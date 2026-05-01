import asyncio
import uuid
from datetime import datetime
from pathlib import Path

from api.ws import ws_manager
from config import settings
from db.database import AsyncSessionLocal
from db.models import Project, Phase, AgentRun, Artifact


PHASES = ["SPECIFY", "PLAN", "TASKS", "BUILD", "TEST", "REVIEW"]


class Orchestrator:
    def __init__(self, project_id: str, spec_data: dict, workspace: Path):
        self.project_id = project_id
        self.spec_data = spec_data
        self.workspace = workspace
        self.enabled_phases = spec_data.get("enabled_phases", PHASES)

    async def run(self):
        try:
            await self._update_project_status("running")

            if "SPECIFY" in self.enabled_phases:
                await self._run_specify()

            if "PLAN" in self.enabled_phases:
                await self._run_plan()

            if "TASKS" in self.enabled_phases:
                task_result = await self._run_tasks()
            else:
                task_result = {"parallel_tasks": [], "sequential_tasks": []}

            if "BUILD" in self.enabled_phases:
                await self._run_build(task_result)

            if "TEST" in self.enabled_phases:
                await self._run_test()

            if "REVIEW" in self.enabled_phases:
                await self._run_review()

            await self._update_project_status("completed")
            await ws_manager.emit_complete(self.project_id, "Software factory run complete.")

        except Exception as exc:
            await self._update_project_status("failed")
            await ws_manager.emit_error(self.project_id, str(exc))

    # ── Phase runners ──────────────────────────────────────────────

    async def _run_specify(self):
        from agents.spec_agent import SpecAgent
        phase_id = await self._create_phase("SPECIFY")
        agent = SpecAgent(
            self.project_id, self.workspace,
            settings.spec_agent_model, self.spec_data
        )
        run_id = await self._create_agent_run(phase_id, "SpecAgent", settings.spec_agent_model)
        await ws_manager.emit_phase(self.project_id, "SPECIFY", "running")
        try:
            result = await agent.run()
            await self._save_artifact(phase_id, result.get("artifact", ""))
            await self._finish_phase(phase_id, "completed")
            await self._finish_agent_run(run_id, "done", agent.log_lines)
            await ws_manager.emit_phase(self.project_id, "SPECIFY", "completed")
        except Exception as e:
            await self._finish_phase(phase_id, "failed")
            await self._finish_agent_run(run_id, "error", [str(e)])
            raise

    async def _run_plan(self):
        from agents.plan_agent import PlanAgent
        phase_id = await self._create_phase("PLAN")
        agent = PlanAgent(self.project_id, self.workspace, settings.plan_agent_model)
        run_id = await self._create_agent_run(phase_id, "PlanAgent", settings.plan_agent_model)
        await ws_manager.emit_phase(self.project_id, "PLAN", "running")
        try:
            result = await agent.run()
            await self._save_artifact(phase_id, result.get("artifact", ""))
            await self._finish_phase(phase_id, "completed")
            await self._finish_agent_run(run_id, "done", agent.log_lines)
            await ws_manager.emit_phase(self.project_id, "PLAN", "completed")
        except Exception as e:
            await self._finish_phase(phase_id, "failed")
            await self._finish_agent_run(run_id, "error", [str(e)])
            raise

    async def _run_tasks(self) -> dict:
        from agents.task_agent import TaskAgent
        phase_id = await self._create_phase("TASKS")
        agent = TaskAgent(self.project_id, self.workspace, settings.task_agent_model)
        run_id = await self._create_agent_run(phase_id, "TaskAgent", settings.task_agent_model)
        await ws_manager.emit_phase(self.project_id, "TASKS", "running")
        try:
            result = await agent.run()
            await self._save_artifact(phase_id, result.get("artifact", ""))
            await self._finish_phase(phase_id, "completed")
            await self._finish_agent_run(run_id, "done", agent.log_lines)
            await ws_manager.emit_phase(self.project_id, "TASKS", "completed")
            return result
        except Exception as e:
            await self._finish_phase(phase_id, "failed")
            await self._finish_agent_run(run_id, "error", [str(e)])
            raise

    async def _run_build(self, task_result: dict):
        from agents.build_agent import BuildAgent
        phase_id = await self._create_phase("BUILD")
        await ws_manager.emit_phase(self.project_id, "BUILD", "running")

        parallel = task_result.get("parallel_tasks", [])
        sequential = task_result.get("sequential_tasks", [])

        # If no tasks were parsed, create one generic build task
        if not parallel and not sequential:
            parallel = ["Implement the full application based on the spec and plan"]

        all_tasks = parallel + sequential
        max_parallel = settings.max_parallel_build_agents

        try:
            # Run parallel tasks in batches
            for i in range(0, len(parallel), max_parallel):
                batch = parallel[i:i + max_parallel]
                agents = [
                    BuildAgent(
                        self.project_id, self.workspace,
                        settings.build_agent_model,
                        task, idx + i
                    )
                    for idx, task in enumerate(batch)
                ]
                run_ids = [
                    await self._create_agent_run(phase_id, f"BuildAgent-{i+j}", settings.build_agent_model)
                    for j in range(len(batch))
                ]
                results = await asyncio.gather(*[a.run() for a in agents], return_exceptions=True)
                for agent, run_id, result in zip(agents, run_ids, results):
                    if isinstance(result, Exception):
                        await self._finish_agent_run(run_id, "error", [str(result)])
                    else:
                        for f in result.get("files", []):
                            await self._save_artifact(phase_id, f)
                        await self._finish_agent_run(run_id, "done", agent.log_lines)

            # Run sequential tasks one by one
            for idx, task in enumerate(sequential):
                agent = BuildAgent(
                    self.project_id, self.workspace,
                    settings.build_agent_model,
                    task, len(parallel) + idx
                )
                run_id = await self._create_agent_run(
                    phase_id, f"BuildAgent-seq-{idx}", settings.build_agent_model
                )
                result = await agent.run()
                for f in result.get("files", []):
                    await self._save_artifact(phase_id, f)
                await self._finish_agent_run(run_id, "done", agent.log_lines)

            await self._finish_phase(phase_id, "completed")
            await ws_manager.emit_phase(self.project_id, "BUILD", "completed")
        except Exception as e:
            await self._finish_phase(phase_id, "failed")
            raise

    async def _run_test(self):
        from agents.test_agent import TestAgent
        phase_id = await self._create_phase("TEST")
        agent = TestAgent(self.project_id, self.workspace, settings.test_agent_model)
        run_id = await self._create_agent_run(phase_id, "TestAgent", settings.test_agent_model)
        await ws_manager.emit_phase(self.project_id, "TEST", "running")
        try:
            result = await agent.run()
            for f in result.get("files", []):
                await self._save_artifact(phase_id, f)
            await self._finish_phase(phase_id, "completed")
            await self._finish_agent_run(run_id, "done", agent.log_lines)
            await ws_manager.emit_phase(self.project_id, "TEST", "completed")
        except Exception as e:
            await self._finish_phase(phase_id, "failed")
            await self._finish_agent_run(run_id, "error", [str(e)])
            raise

    async def _run_review(self):
        from agents.review_agent import ReviewAgent
        phase_id = await self._create_phase("REVIEW")
        agent = ReviewAgent(self.project_id, self.workspace, settings.review_agent_model)
        run_id = await self._create_agent_run(phase_id, "ReviewAgent", settings.review_agent_model)
        await ws_manager.emit_phase(self.project_id, "REVIEW", "running")
        try:
            result = await agent.run()
            await self._save_artifact(phase_id, result.get("artifact", ""))
            await self._finish_phase(phase_id, "completed")
            await self._finish_agent_run(run_id, "done", agent.log_lines)
            await ws_manager.emit_phase(self.project_id, "REVIEW", "completed")
        except Exception as e:
            await self._finish_phase(phase_id, "failed")
            await self._finish_agent_run(run_id, "error", [str(e)])
            raise

    # ── DB helpers ─────────────────────────────────────────────────

    async def _update_project_status(self, status: str):
        async with AsyncSessionLocal() as db:
            project = await db.get(Project, self.project_id)
            if project:
                project.status = status
                await db.commit()

    async def _create_phase(self, name: str) -> str:
        phase_id = str(uuid.uuid4())
        async with AsyncSessionLocal() as db:
            phase = Phase(
                id=phase_id,
                project_id=self.project_id,
                name=name,
                status="running",
                started_at=datetime.utcnow(),
            )
            db.add(phase)
            await db.commit()
        return phase_id

    async def _finish_phase(self, phase_id: str, status: str):
        async with AsyncSessionLocal() as db:
            phase = await db.get(Phase, phase_id)
            if phase:
                phase.status = status
                phase.completed_at = datetime.utcnow()
                await db.commit()

    async def _create_agent_run(self, phase_id: str, agent_type: str, model: str) -> str:
        run_id = str(uuid.uuid4())
        async with AsyncSessionLocal() as db:
            run = AgentRun(
                id=run_id,
                project_id=self.project_id,
                phase_id=phase_id,
                agent_type=agent_type,
                model=model,
                status="working",
            )
            db.add(run)
            await db.commit()
        return run_id

    async def _finish_agent_run(self, run_id: str, status: str, log_lines: list):
        async with AsyncSessionLocal() as db:
            run = await db.get(AgentRun, run_id)
            if run:
                run.status = status
                run.log = "".join(log_lines)
                await db.commit()

    async def _save_artifact(self, phase_id: str, file_path: str):
        if not file_path:
            return
        artifact_id = str(uuid.uuid4())
        async with AsyncSessionLocal() as db:
            artifact = Artifact(
                id=artifact_id,
                project_id=self.project_id,
                phase_id=phase_id,
                file_path=file_path,
            )
            db.add(artifact)
            await db.commit()
