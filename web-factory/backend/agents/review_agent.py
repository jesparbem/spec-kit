from pathlib import Path
from agents.base import BaseAgent


SYSTEM = """You are a Senior Software Architect doing a final code review.
Evaluate the generated code against the specification and plan.
Be constructive but thorough. Identify real issues, not nitpicks.
Output a structured review report in Markdown."""

USER_TMPL = """Perform a final review of this software factory output:

## Original Specification
{spec}

## Implementation Plan
{plan}

## Generated Files
{file_tree}

## Review Checklist
Evaluate and score each area (1-5):

# Code Review Report

## Executive Summary
(2-3 sentences: what was built and overall quality)

## Acceptance Criteria Coverage
(Map each AC from spec to implementation status: ✅ Met / ⚠️ Partial / ❌ Missing)

## Code Quality
Score: /5
- Architecture alignment with plan
- Code clarity and maintainability
- Error handling completeness
- Security considerations

## Test Coverage
Score: /5
(Are the tests adequate? What's missing?)

## Issues Found
### Critical
### Major
### Minor

## Recommendations
(Top 3 things to improve before production)

## Overall Score
X/5 — Brief verdict
"""


class ReviewAgent(BaseAgent):
    phase = "REVIEW"

    async def run(self) -> dict:
        await self._emit("thinking", "Collecting all generated artifacts...")

        spec = (self.workspace / "spec.md").read_text() if (self.workspace / "spec.md").exists() else ""
        plan = (self.workspace / "plan.md").read_text() if (self.workspace / "plan.md").exists() else ""

        file_tree = _build_file_tree(self.workspace)

        user_prompt = USER_TMPL.format(spec=spec, plan=plan, file_tree=file_tree)

        await self._emit("working", "Performing code review...")
        review_content = await self._stream_prompt(SYSTEM, user_prompt)

        path = self._write_artifact("review.md", review_content)
        await self._emit("done", "Review complete", artifact="review.md")

        return {"artifact": str(path), "content": review_content}


def _build_file_tree(workspace: Path) -> str:
    lines = []
    for path in sorted(workspace.rglob("*")):
        if path.is_file() and ".git" not in str(path):
            rel = path.relative_to(workspace)
            depth = len(rel.parts) - 1
            lines.append("  " * depth + f"- {rel}")
    return "\n".join(lines) or "(empty workspace)"
