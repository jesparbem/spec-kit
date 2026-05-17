<div align="center">

# 🏭 Software Factory

### AI-powered software manufacturing portal using Claude agent swarms

[![Built on spec-kit](https://img.shields.io/badge/built%20on-spec--kit-6366f1?style=flat-square)](https://github.com/jesparbem/spec-kit)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Claude](https://img.shields.io/badge/Claude-Opus%204-D97706?style=flat-square)](https://anthropic.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](../LICENSE)

---

**Describe what you want to build. Watch a swarm of AI agents design, plan, and code it — live.**

[Quick Start](#-quick-start) · [Architecture](#-architecture) · [Agent Phases](#-manufacturing-phases) · [Mobile Access](#-access-from-mobile)

</div>

---

## ✨ What is this?

Software Factory is a web portal that transforms a plain-language business description into working software. You type what you need; a coordinated swarm of Claude agents does the rest — specification, architecture, coding, testing, and review — all visible in real time through an interactive graph.

Built on top of [spec-kit](../README.md) and its **Spec-Driven Development (SDD)** methodology: specifications are the source of truth, code is the output.

```
You describe an idea
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  SPECIFY → PLAN → TASKS → BUILD (×N parallel) → TEST → REVIEW │
│                                                             │
│  Every agent streams its work live to your browser          │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
Working code + spec.md + plan.md + tasks.md + review.md
```

---

## 🖥️ Interface

### Dashboard
Project list with live status badges — running, completed, failed — auto-refreshes every 5 seconds.

### Agent Swarm View
The main view: an interactive graph (React Flow) where each agent is a node. Colors change as agents progress through their work:

| Color | State |
|-------|-------|
| ⬛ Grey | Idle |
| 🔵 Blue | Thinking |
| 🟡 Yellow | Working |
| 🟢 Green | Done |
| 🔴 Red | Error |

Click any node to open its inspector: full log, current artifact, model used.

### Pipeline Bar
A persistent status bar showing the 6 manufacturing phases and which is active.

```
SPECIFY ──── PLAN ──── TASKS ──── BUILD ──── TEST ──── REVIEW
   ✅           ✅        ✅        ◉ working   ○         ○
```

### Activity Feed
A rolling terminal log of everything every agent is doing, filterable by agent.

### Documents Tab
All generated files (spec.md, plan.md, tasks.md, review.md) rendered as beautiful Markdown with syntax-highlighted code blocks.

### Agent Config (`/settings`)
Choose which Claude model powers each agent. Tune the number of parallel build agents.

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Python | 3.11+ | `python3 --version` |
| Node.js | 18+ | `node --version` |
| Anthropic API key | — | [console.anthropic.com](https://console.anthropic.com) |

### 1. Clone and switch branch

```bash
git clone https://github.com/jesparbem/spec-kit.git
cd spec-kit
git checkout claude/ai-software-factory-e4h4u
```

### 2. Backend

```bash
cd web-factory/backend

# Install dependencies
pip install -r requirements.txt

# Add your API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# Start
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
# In a new terminal
cd web-factory/frontend

npm install
npm run dev
```

### 4. Open

```
http://localhost:3000
```

### One-liner (both services)

```bash
cd web-factory && bash start.sh
```

---

## 📱 Access from Mobile

The easiest way to access the Factory from a phone or tablet — no installation required.

### GitHub Codespaces (recommended)

1. Open [github.com/jesparbem/spec-kit](https://github.com/jesparbem/spec-kit) in your mobile browser
2. Tap **`< > Code`** → **Codespaces** → **Create codespace on `claude/ai-software-factory-e4h4u`**
3. In the terminal that opens:

```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." > web-factory/backend/.env
bash web-factory/start.sh
```

4. GitHub exposes a **public URL** automatically:
   ```
   https://[your-codespace]-3000.app.github.dev
   ```

Open that URL on any device. ✅ Codespaces free tier: **60 hours/month**.

---

## 🏗️ Architecture

```
web-factory/
├── backend/                     FastAPI · Python 3.11+
│   ├── main.py                  App entry point + WebSocket endpoint
│   ├── config.py                Model config per agent (env-based)
│   ├── agents/
│   │   ├── orchestrator.py      Coordinates all 6 phases
│   │   ├── spec_agent.py        Phase 1 — Specification
│   │   ├── plan_agent.py        Phase 2 — Architecture & planning
│   │   ├── task_agent.py        Phase 3 — Task decomposition
│   │   ├── build_agent.py       Phase 4 — Code generation (parallel)
│   │   ├── test_agent.py        Phase 5 — Test suite writing
│   │   └── review_agent.py      Phase 6 — Code review
│   ├── api/
│   │   ├── projects.py          Project CRUD + factory trigger
│   │   ├── config_api.py        Agent model configuration
│   │   └── ws.py                WebSocket connection manager
│   └── db/
│       ├── models.py            Project · Phase · AgentRun · Artifact
│       └── database.py          Async SQLite (aiosqlite)
│
└── frontend/                    Next.js 14 · TypeScript · Tailwind
    ├── app/
    │   ├── page.tsx             Dashboard (project list)
    │   ├── new/page.tsx         New project spec form
    │   ├── projects/[id]/       Live swarm view
    │   └── settings/page.tsx    Agent configuration
    ├── components/
    │   ├── SwarmGraph/          React Flow agent graph
    │   ├── PipelineBar/         Phase status bar
    │   ├── ActivityFeed/        Streaming agent logs
    │   ├── MarkdownViewer/      Generated document viewer
    │   ├── SpecForm/            Business spec input form
    │   └── AgentConfigPanel/    Model + parallelism settings
    ├── store/swarmStore.ts      Zustand — WebSocket → React state
    └── lib/
        ├── api.ts               HTTP client (projects, config)
        └── ws.ts                WebSocket hook (auto-reconnect)
```

### Real-time flow

```
Browser                Next.js              FastAPI            Claude
  │                      │                    │                  │
  │── POST /api/projects ──────────────────>  │                  │
  │                      │            spawn orchestrator         │
  │── WS /ws/{id} ────────────────────────>  │                  │
  │                      │                    │── stream ──────> │
  │ <── agent_update ──────────────────────── │ <─ text chunk ── │
  │ <── phase_update ──────────────────────── │                  │
  │    (graph animates)  │                    │                  │
  │ <── factory_complete ──────────────────── │                  │
```

### WebSocket event schema

```json
{
  "type": "agent_update",
  "agent_id": "build-003-a1b2c3",
  "phase": "BUILD",
  "status": "working",
  "content": "Writing authentication middleware...",
  "artifact": "src/auth/middleware.py",
  "timestamp": "2026-05-01T08:00:00Z"
}
```

---

## ⚙️ Manufacturing Phases

Each phase runs as an independent Claude agent, streaming output in real time.

| Phase | Agent | Input | Output | Default Model |
|-------|-------|-------|--------|---------------|
| **SPECIFY** | `SpecAgent` | User description | `spec.md` | Opus 4 |
| **PLAN** | `PlanAgent` | `spec.md` | `plan.md`, data model, API contracts | Opus 4 |
| **TASKS** | `TaskAgent` | `plan.md` | `tasks.md` with `[P]` parallel markers | Sonnet 4.6 |
| **BUILD** | N× `BuildAgent` | `tasks.md` | Source code (parallel `[P]` tasks) | Sonnet 4.6 |
| **TEST** | `TestAgent` | Source files | Test suite (pytest / jest) | Haiku 4.5 |
| **REVIEW** | `ReviewAgent` | Everything | `review.md` with scores + recommendations | Sonnet 4.6 |

### Parallel build

Tasks marked `[P]` in `tasks.md` run concurrently up to the configured limit:

```
tasks.md
  [P] TASK-001: Create database models      ──┐
  [P] TASK-002: Write API routes            ──┼── run together
  [P] TASK-003: Build React components      ──┘
      TASK-004: Wire frontend to API        ── waits for above
```

---

## 🔧 Configuration

### Environment variables (backend)

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | — | Required. Your Anthropic API key |
| `SPEC_AGENT_MODEL` | `claude-opus-4-7` | Model for specification phase |
| `PLAN_AGENT_MODEL` | `claude-opus-4-7` | Model for planning phase |
| `TASK_AGENT_MODEL` | `claude-sonnet-4-6` | Model for task decomposition |
| `BUILD_AGENT_MODEL` | `claude-sonnet-4-6` | Model for build agents |
| `TEST_AGENT_MODEL` | `claude-haiku-4-5-20251001` | Model for test writing |
| `REVIEW_AGENT_MODEL` | `claude-sonnet-4-6` | Model for code review |
| `MAX_PARALLEL_BUILD_AGENTS` | `3` | Max concurrent build agents |

All of these can also be changed live from the **Agent Config** page in the UI.

### Model recommendations

- **Opus** — Best reasoning for Specify and Plan (complex, creative, one-time)
- **Sonnet** — Balanced speed/quality for Build and Review (frequent, iterative)
- **Haiku** — Fast and cheap for Tests (repetitive, formulaic)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | Next.js 14 (App Router) |
| UI language | TypeScript |
| Styling | Tailwind CSS |
| Agent graph | [@xyflow/react](https://reactflow.dev) + [dagre](https://github.com/dagrejs/dagre) |
| State management | [Zustand](https://zustand-demo.pmnd.rs) |
| Markdown rendering | react-markdown + rehype-highlight |
| Icons | lucide-react |
| Backend framework | FastAPI |
| AI | [Anthropic Python SDK](https://github.com/anthropic-sdk/sdk-python) (streaming) |
| Database | SQLite via aiosqlite + SQLAlchemy async |
| Real-time | WebSocket (native browser API + FastAPI) |
| SDD methodology | [spec-kit](../README.md) templates |

---

## 📖 API Reference

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects/` | List all projects |
| `POST` | `/api/projects/` | Create project + launch factory |
| `GET` | `/api/projects/{id}` | Get project details |
| `GET` | `/api/projects/{id}/artifacts` | List generated files with content |
| `GET` | `/api/projects/{id}/phases` | List phases and their status |

### Config

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/config/` | Get current agent model config |
| `PUT` | `/api/config/` | Update model config |
| `GET` | `/api/config/models` | List available Claude models |

### WebSocket

```
ws://localhost:8000/ws/{project_id}
```

Send `"ping"` to keep alive. Receive JSON events (see schema above).

Interactive API docs: **[localhost:8000/docs](http://localhost:8000/docs)**

---

## 🔬 Inspired by

| Project | Stars | What we learned |
|---------|-------|-----------------|
| [wshobson/agents](https://github.com/wshobson/agents) | 34k⭐ | Claude Code multi-agent orchestration patterns |
| [ruvnet/ruflo](https://github.com/ruvnet/ruflo) | 34k⭐ | Swarm intelligence architecture + WebSocket event schema |
| [backnotprop/plannotator](https://github.com/backnotprop/plannotator) | 4.8k⭐ | Visual plan annotation UI |
| [getpaseo/paseo](https://github.com/getpaseo/paseo) | 5k⭐ | Remote agent orchestration design |
| [humanlayer/humanlayer](https://github.com/humanlayer/humanlayer) | 10.6k⭐ | Human-in-the-loop for agent approval |

---

## 📄 License

MIT — see [LICENSE](../LICENSE)

---

<div align="center">

Built with ❤️ on [spec-kit](https://github.com/jesparbem/spec-kit) · Powered by [Claude](https://anthropic.com)

</div>
