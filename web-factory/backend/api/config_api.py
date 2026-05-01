from fastapi import APIRouter
from pydantic import BaseModel
from config import settings

router = APIRouter(prefix="/api/config", tags=["config"])

AVAILABLE_MODELS = [
    "claude-opus-4-7",
    "claude-sonnet-4-6",
    "claude-haiku-4-5-20251001",
]


class AgentConfig(BaseModel):
    spec_agent_model: str = "claude-opus-4-7"
    plan_agent_model: str = "claude-opus-4-7"
    task_agent_model: str = "claude-sonnet-4-6"
    build_agent_model: str = "claude-sonnet-4-6"
    test_agent_model: str = "claude-haiku-4-5-20251001"
    review_agent_model: str = "claude-sonnet-4-6"
    max_parallel_build_agents: int = 3


@router.get("/", response_model=AgentConfig)
async def get_config():
    return AgentConfig(
        spec_agent_model=settings.spec_agent_model,
        plan_agent_model=settings.plan_agent_model,
        task_agent_model=settings.task_agent_model,
        build_agent_model=settings.build_agent_model,
        test_agent_model=settings.test_agent_model,
        review_agent_model=settings.review_agent_model,
        max_parallel_build_agents=settings.max_parallel_build_agents,
    )


@router.put("/", response_model=AgentConfig)
async def update_config(cfg: AgentConfig):
    settings.spec_agent_model = cfg.spec_agent_model
    settings.plan_agent_model = cfg.plan_agent_model
    settings.task_agent_model = cfg.task_agent_model
    settings.build_agent_model = cfg.build_agent_model
    settings.test_agent_model = cfg.test_agent_model
    settings.review_agent_model = cfg.review_agent_model
    settings.max_parallel_build_agents = cfg.max_parallel_build_agents
    return cfg


@router.get("/models")
async def get_models():
    return {"models": AVAILABLE_MODELS}
