from pathlib import Path
from agents.base import BaseAgent


SYSTEM = """You are a Software Architect following Spec-Driven Development (SDD).
Given a feature specification, produce a detailed implementation plan.
Focus on architecture, technology choices with rationale, and phased delivery.
Keep the plan high-level and readable. Extract complex details to separate sections.
Output Markdown."""

USER_TMPL = """Based on this feature specification, create a comprehensive implementation plan:

---
{spec}
---

Structure your response as:

# Implementation Plan: {name}

## Architecture Overview
(High-level architecture diagram in ASCII + description)

## Technology Choices
(Each choice with rationale linked to spec requirements)

## Data Model
(Key entities, relationships, fields)

## API Contracts
(Key endpoints: method, path, request/response shape)

## Implementation Phases
### Phase 1: Foundation
### Phase 2: Core Features
### Phase 3: Polish & Testing

## Risk & Mitigations
(Top 3-5 risks and how to address them)

## Estimated Complexity
(T-shirt sizing per phase: XS/S/M/L/XL)
"""


class PlanAgent(BaseAgent):
    phase = "PLAN"

    async def run(self) -> dict:
        await self._emit("thinking", "Reading specification...")

        spec_path = self.workspace / "spec.md"
        spec_content = spec_path.read_text() if spec_path.exists() else ""
        name = spec_path.parent.name

        user_prompt = USER_TMPL.format(spec=spec_content, name=name)

        await self._emit("working", "Generating implementation plan...")
        plan_content = await self._stream_prompt(SYSTEM, user_prompt)

        path = self._write_artifact("plan.md", plan_content)
        await self._emit("done", "plan.md generated", artifact="plan.md")

        return {"artifact": str(path), "content": plan_content}
