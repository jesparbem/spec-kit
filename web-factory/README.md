# Software Factory — AI Agent Swarm Portal

Web portal for spec-driven software manufacturing using Claude agent swarms.
Built on top of [spec-kit](../README.md) — the Spec-Driven Development toolkit.

## What it does

1. Business users fill in a specification form (project name, description, acceptance criteria)
2. A swarm of Claude agents builds the software automatically through 6 phases:
   - **SPECIFY** — Generates `spec.md` from the user's input
   - **PLAN** — Creates architecture, API contracts, data model
   - **TASKS** — Decomposes the plan into atomic, parallelizable tasks
   - **BUILD** — Multiple agents build in parallel
   - **TEST** — Test suite generated and written
   - **REVIEW** — Final code review report
3. The frontend shows a live interactive graph of agent activity (React Flow)
4. All generated documents are viewable as rendered Markdown

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 + React + TypeScript + Tailwind |
| Agent graph | @xyflow/react + dagre |
| State | Zustand |
| Real-time | WebSocket (native) |
| Backend | FastAPI + Python 3.11+ |
| AI | Anthropic Claude SDK (streaming) |
| DB | SQLite (aiosqlite + SQLAlchemy async) |

## Getting started

### 1. Backend

```bash
cd web-factory/backend
pip install -r requirements.txt

# Create .env with your API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd web-factory/frontend
npm install
npm run dev   # → http://localhost:3000
```

### 3. Use it

1. Open `http://localhost:3000`
2. Click **New Project**
3. Describe what you want to build
4. Watch the agent swarm work in real time

## Agent configuration

Visit `/settings` to choose which Claude model each agent uses:
- Opus for complex reasoning phases (Specify, Plan)
- Sonnet for implementation (Build, Review)
- Haiku for fast tasks (Test)

## Architecture

```
web-factory/
├── backend/
│   ├── main.py              # FastAPI app + WebSocket
│   ├── config.py            # Model config per agent
│   ├── agents/
│   │   ├── orchestrator.py  # Coordinates all 6 phases
│   │   ├── spec_agent.py    # Phase 1: Specification
│   │   ├── plan_agent.py    # Phase 2: Planning
│   │   ├── task_agent.py    # Phase 3: Task decomposition
│   │   ├── build_agent.py   # Phase 4: Build (parallel)
│   │   ├── test_agent.py    # Phase 5: Test writing
│   │   └── review_agent.py  # Phase 6: Code review
│   ├── api/
│   │   ├── projects.py      # Project CRUD
│   │   ├── config_api.py    # Agent model config
│   │   └── ws.py            # WebSocket manager
│   └── db/
│       ├── models.py        # SQLAlchemy models
│       └── database.py      # Async SQLite setup
└── frontend/
    ├── app/                 # Next.js pages
    ├── components/
    │   ├── SwarmGraph/      # React Flow agent visualization
    │   ├── PipelineBar/     # Phase status bar
    │   ├── ActivityFeed/    # Real-time logs
    │   ├── MarkdownViewer/  # Generated document viewer
    │   ├── SpecForm/        # Business spec input
    │   └── AgentConfigPanel/# Model selection per agent
    ├── store/swarmStore.ts  # Zustand global state
    ├── lib/
    │   ├── api.ts           # HTTP client
    │   └── ws.ts            # WebSocket hook
    └── types/index.ts       # Shared TypeScript types
```
