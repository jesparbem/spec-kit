from pathlib import Path
from agents.base import BaseAgent


SYSTEM = """You are a QA Engineer and Test Specialist following Test-Driven Development.
Given a project specification and generated source code, write comprehensive tests.
Cover unit tests, integration tests, and key acceptance scenarios.
Output complete test files using the === FILE: === format."""

USER_TMPL = """Write a comprehensive test suite for this project:

## Specification
{spec}

## Source files generated
{file_list}

## Instructions
1. Write tests that validate the acceptance criteria from the spec
2. Cover happy paths and error cases
3. Use pytest for Python, Jest/Vitest for JavaScript/TypeScript
4. Include at least one integration test
5. Output each test file using === FILE: path === ... === END FILE === format
"""


class TestAgent(BaseAgent):
    phase = "TEST"

    async def run(self) -> dict:
        await self._emit("thinking", "Scanning generated source files...")

        spec = (self.workspace / "spec.md").read_text() if (self.workspace / "spec.md").exists() else ""

        src_dir = self.workspace / "src"
        file_list = ""
        if src_dir.exists():
            files = list(src_dir.rglob("*"))
            file_list = "\n".join(
                str(f.relative_to(self.workspace))
                for f in files if f.is_file()
            )

        user_prompt = USER_TMPL.format(spec=spec, file_list=file_list or "(no source files yet)")

        await self._emit("working", "Writing test suite...")
        result = await self._stream_prompt(SYSTEM, user_prompt)

        tests_dir = self.workspace / "tests"
        tests_dir.mkdir(exist_ok=True)

        written = _parse_and_write_files(result, tests_dir)
        artifact = written[0] if written else None

        await self._emit("done", f"Test suite written ({len(written)} files)", artifact=artifact)
        return {"files": written}


def _parse_and_write_files(content: str, base_dir: Path) -> list[str]:
    written = []
    parts = content.split("=== FILE:")
    for part in parts[1:]:
        if "===" not in part:
            continue
        header, _, rest = part.partition("===")
        file_path = header.strip()
        end_marker = "=== END FILE ==="
        file_content = rest.split(end_marker)[0].strip() if end_marker in rest else rest.strip()

        full_path = base_dir / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_text(file_content)
        written.append(str(full_path.relative_to(base_dir.parent)))
    return written
