import json
from datetime import datetime
from fastapi import WebSocket
from typing import Any


class ConnectionManager:
    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, project_id: str, websocket: WebSocket):
        await websocket.accept()
        self._connections.setdefault(project_id, []).append(websocket)

    def disconnect(self, project_id: str, websocket: WebSocket):
        conns = self._connections.get(project_id, [])
        if websocket in conns:
            conns.remove(websocket)

    async def broadcast(self, project_id: str, event: dict[str, Any]):
        payload = json.dumps(event, default=str)
        dead = []
        for ws in self._connections.get(project_id, []):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(project_id, ws)

    async def emit(
        self,
        project_id: str,
        agent_id: str,
        phase: str,
        status: str,
        content: str = "",
        artifact: str | None = None,
        extra: dict | None = None,
    ):
        event = {
            "type": "agent_update",
            "agent_id": agent_id,
            "phase": phase,
            "status": status,
            "content": content,
            "artifact": artifact,
            "timestamp": datetime.utcnow().isoformat(),
        }
        if extra:
            event.update(extra)
        await self.broadcast(project_id, event)

    async def emit_phase(self, project_id: str, phase: str, status: str):
        await self.broadcast(project_id, {
            "type": "phase_update",
            "phase": phase,
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
        })

    async def emit_complete(self, project_id: str, summary: str = ""):
        await self.broadcast(project_id, {
            "type": "factory_complete",
            "summary": summary,
            "timestamp": datetime.utcnow().isoformat(),
        })

    async def emit_error(self, project_id: str, error: str, phase: str = ""):
        await self.broadcast(project_id, {
            "type": "factory_error",
            "error": error,
            "phase": phase,
            "timestamp": datetime.utcnow().isoformat(),
        })


ws_manager = ConnectionManager()
