import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from db.database import get_db
from db.models import Project, Phase, Artifact
from config import WORKSPACES_DIR

router = APIRouter(prefix="/api/projects", tags=["projects"])


class SpecInput(BaseModel):
    name: str
    description: str
    target_users: str = ""
    acceptance_criteria: list[str] = []
    preferred_stack: str = ""
    enabled_phases: list[str] = ["SPECIFY", "PLAN", "TASKS", "BUILD", "TEST", "REVIEW"]


class ProjectOut(BaseModel):
    id: str
    name: str
    description: str
    status: str
    created_at: str

    class Config:
        from_attributes = True


@router.get("/", response_model=list[ProjectOut])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).order_by(Project.created_at.desc()))
    return result.scalars().all()


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/", response_model=ProjectOut, status_code=201)
async def create_project(
    spec: SpecInput,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    project_id = str(uuid.uuid4())
    workspace = WORKSPACES_DIR / project_id
    workspace.mkdir(parents=True, exist_ok=True)

    project = Project(
        id=project_id,
        name=spec.name,
        description=spec.description,
        status="running",
        workspace_path=str(workspace),
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    # Write the input spec as raw user request
    (workspace / "user_request.md").write_text(
        f"# {spec.name}\n\n{spec.description}\n\n"
        f"**Target users:** {spec.target_users}\n\n"
        f"**Acceptance criteria:**\n" +
        "\n".join(f"- {c}" for c in spec.acceptance_criteria) +
        f"\n\n**Preferred stack:** {spec.preferred_stack or 'Any'}\n"
    )

    # Launch orchestrator in background
    background_tasks.add_task(_run_factory, project_id, spec.dict(), str(workspace))

    return project


@router.get("/{project_id}/artifacts")
async def list_artifacts(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Artifact).where(Artifact.project_id == project_id)
    )
    artifacts = result.scalars().all()
    out = []
    for a in artifacts:
        path = Path(a.file_path)
        content = path.read_text() if path.exists() else ""
        out.append({"id": a.id, "file_path": a.file_path, "content": content})
    return out


@router.get("/{project_id}/phases")
async def list_phases(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Phase).where(Phase.project_id == project_id)
    )
    return result.scalars().all()


async def _run_factory(project_id: str, spec_data: dict, workspace: str):
    from agents.orchestrator import Orchestrator
    orch = Orchestrator(project_id, spec_data, Path(workspace))
    await orch.run()
