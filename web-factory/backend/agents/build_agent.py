import uuid
from pathlib import Path
from agents.base import BaseAgent


SYSTEM = """You are an expert software engineer implementing a specific task.
Write production-quality code following best practices.
Output the complete file contents for each file you need to create or modify.
Use this format for each file:

=== FILE: path/to/file.ext ===
<complete file contents>
=== END FILE ===

Be thorough and write working code, not stubs or placeholders."""

USER_TMPL = """Implement the following task as part of a larger software project:

## Task
{task}

## Project Context (spec.md)
{spec}

## Implementation Plan
{plan}

## Instructions
1. Write complete, working code for each file needed
2. Follow the architecture described in the plan
3. Include proper error handling
4. Add type hints where applicable
5. Output each file using the === FILE: === format
"""


class BuildAgent(BaseAgent):
    phase = "BUILD"

    def __init__(self, project_id: str, workspace: Path, model: str, task: str, task_index: int):
        super().__init__(project_id, workspace, model)
        self.task = task
        self.task_index = task_index
        self.agent_id = f"build-{task_index:03d}-{uuid.uuid4().hex[:6]}"

    async def run(self) -> dict:
        await self._emit("thinking", f"Reading context for: {self.task[:60]}...")

        spec = (self.workspace / "spec.md").read_text() if (self.workspace / "spec.md").exists() else ""
        plan = (self.workspace / "plan.md").read_text() if (self.workspace / "plan.md").exists() else ""

        user_prompt = USER_TMPL.format(task=self.task, spec=spec, plan=plan)

        await self._emit("working", f"Building: {self.task[:80]}...")
        result_content = await self._stream_prompt(SYSTEM, user_prompt)

        # Parse and write generated files
        written_files = _parse_and_write_files(result_content, self.workspace / "src")
        artifact_list = ", ".join(written_files) if written_files else "no files"

        await self._emit("done", f"Completed: {artifact_list}", artifact=written_files[0] if written_files else None)

        return {"files": written_files, "task": self.task}


def _parse_and_write_files(content: str, base_dir: Path) -> list[str]:
    written = []
    parts = content.split("=== FILE:")
    for part in parts[1:]:
        if "===" not in part:
            continue
        header, _, rest = part.partition("===")
        file_path = header.strip()
        end_marker = "=== END FILE ==="
        if end_marker in rest:
            file_content = rest.split(end_marker)[0].strip()
        else:
            file_content = rest.strip()

        full_path = base_dir / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_text(file_content)
        written.append(str(full_path.relative_to(base_dir.parent)))

    return written
