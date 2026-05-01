from pathlib import Path
from agents.base import BaseAgent


SYSTEM = """You are a Task Decomposition specialist following Spec-Driven Development.
Given an implementation plan, produce an executable task list with clear parallelization markers.
Mark independent tasks with [P] so they can run in parallel.
Each task must be atomic, unambiguous, and completable by a coding agent.
Output Markdown."""

USER_TMPL = """Analyze this implementation plan and generate an executable task list:

---
{plan}
---

Output format:

# Task List

## Phase 1: Foundation
- [P] TASK-001: <specific, atomic task description>
  - Files: list of files to create/modify
  - Acceptance: how to verify it's done
- [P] TASK-002: <another independent task>
- TASK-003: <sequential task that depends on TASK-001>

## Phase 2: Core Features
...

## Phase 3: Polish & Testing
...

## Parallel Groups
Group A (can run together): TASK-001, TASK-002
Group B (after Group A): TASK-003, TASK-004
...

Rules:
- Mark with [P] if the task has no dependencies on other tasks in the same phase
- Each task must name specific files
- Keep tasks 30-120 minutes of work each
"""


class TaskAgent(BaseAgent):
    phase = "TASKS"

    async def run(self) -> dict:
        await self._emit("thinking", "Reading implementation plan...")

        plan_path = self.workspace / "plan.md"
        plan_content = plan_path.read_text() if plan_path.exists() else ""

        user_prompt = USER_TMPL.format(plan=plan_content)

        await self._emit("working", "Decomposing into tasks...")
        tasks_content = await self._stream_prompt(SYSTEM, user_prompt)

        path = self._write_artifact("tasks.md", tasks_content)
        await self._emit("done", "tasks.md generated", artifact="tasks.md")

        # Parse parallel tasks
        parallel_tasks = _extract_parallel_tasks(tasks_content)
        sequential_tasks = _extract_sequential_tasks(tasks_content)

        return {
            "artifact": str(path),
            "content": tasks_content,
            "parallel_tasks": parallel_tasks,
            "sequential_tasks": sequential_tasks,
        }


def _extract_parallel_tasks(content: str) -> list[str]:
    tasks = []
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("- [P]"):
            task_text = stripped[5:].strip()
            if task_text:
                tasks.append(task_text)
    return tasks


def _extract_sequential_tasks(content: str) -> list[str]:
    tasks = []
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("- TASK-") and "[P]" not in stripped:
            task_text = stripped[2:].strip()
            if task_text:
                tasks.append(task_text)
    return tasks
