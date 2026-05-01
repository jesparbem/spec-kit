from pathlib import Path
from pydantic_settings import BaseSettings


SPEC_KIT_ROOT = Path(__file__).parents[2]
TEMPLATES_DIR = SPEC_KIT_ROOT / "templates"
WORKSPACES_DIR = Path(__file__).parent / "workspaces"
WORKSPACES_DIR.mkdir(exist_ok=True)


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    # Default models per agent type
    spec_agent_model: str = "claude-opus-4-7"
    plan_agent_model: str = "claude-opus-4-7"
    task_agent_model: str = "claude-sonnet-4-6"
    build_agent_model: str = "claude-sonnet-4-6"
    test_agent_model: str = "claude-haiku-4-5-20251001"
    review_agent_model: str = "claude-sonnet-4-6"
    max_parallel_build_agents: int = 3

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
