import uuid
from pathlib import Path
from datetime import datetime

import anthropic

from config import settings
from api.ws import ws_manager


class BaseAgent:
    phase: str = "BASE"

    def __init__(self, project_id: str, workspace: Path, model: str):
        self.project_id = project_id
        self.workspace = workspace
        self.model = model
        self.agent_id = f"{self.phase.lower()}-{uuid.uuid4().hex[:8]}"
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.log_lines: list[str] = []

    async def _emit(self, status: str, content: str = "", artifact: str | None = None):
        await ws_manager.emit(
            self.project_id, self.agent_id, self.phase, status, content, artifact
        )

    async def _stream_prompt(self, system: str, user: str) -> str:
        await self._emit("thinking", "Analyzing request...")
        full_text = ""
        async with self._client.messages.stream(
            model=self.model,
            max_tokens=8096,
            system=system,
            messages=[{"role": "user", "content": user}],
        ) as stream:
            async for text in stream.text_stream:
                full_text += text
                self.log_lines.append(text)
                await self._emit("working", text)
        return full_text

    def _read_template(self, name: str) -> str:
        from config import TEMPLATES_DIR
        path = TEMPLATES_DIR / name
        return path.read_text() if path.exists() else ""

    def _write_artifact(self, filename: str, content: str) -> Path:
        path = self.workspace / filename
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
        return path

    async def run(self) -> dict:
        raise NotImplementedError
