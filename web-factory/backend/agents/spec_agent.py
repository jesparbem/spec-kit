from pathlib import Path
from agents.base import BaseAgent


SYSTEM = """You are a Specification Engineer following Spec-Driven Development (SDD).
Your job is to transform a user's rough idea into a complete, structured specification document.
Write in clear business language. Focus on WHAT users need and WHY, never HOW to implement.
Use [NEEDS CLARIFICATION: question] for genuinely ambiguous requirements.
Output a well-structured Markdown document."""

USER_TMPL = """Create a complete feature specification for the following project request:

---
{user_request}
---

Use this template structure:
# {name} — Feature Specification

## Overview
(1-2 sentence summary of what this builds and why)

## Target Users
(Who uses this and what are their goals)

## Problem Statement
(What problem does this solve)

## User Stories
(As a [user], I want to [action] so that [benefit] — at least 5 stories)

## Acceptance Criteria
(Measurable, testable criteria — at least one per user story)

## Non-Functional Requirements
(Performance, security, accessibility, scalability)

## Out of Scope
(Explicit list of what this does NOT include)

## Open Questions
(Any [NEEDS CLARIFICATION] items)
"""


class SpecAgent(BaseAgent):
    phase = "SPECIFY"

    def __init__(self, project_id: str, workspace: Path, model: str, spec_data: dict):
        super().__init__(project_id, workspace, model)
        self.spec_data = spec_data

    async def run(self) -> dict:
        await self._emit("thinking", "Reading user request...")

        user_request = (self.workspace / "user_request.md").read_text()
        user_prompt = USER_TMPL.format(
            user_request=user_request,
            name=self.spec_data.get("name", "Project"),
        )

        await self._emit("working", "Generating specification...")
        spec_content = await self._stream_prompt(SYSTEM, user_prompt)

        path = self._write_artifact("spec.md", spec_content)
        await self._emit("done", "spec.md generated", artifact="spec.md")

        return {"artifact": str(path), "content": spec_content}
