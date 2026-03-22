import type { Detector } from "./context"

/** Python project → detect pyproject.toml / requirements.txt */
export const pythonProject: Detector = (ctx) => {
  if (ctx.has("pyproject.toml") || ctx.has("requirements.txt") || ctx.has("setup.py") || ctx.has("Pipfile")) {
    return `This is a Python project. Use Python-appropriate tooling (pytest for testing, ruff/black for formatting, mypy for type checking). If the user asks to test, prefer pytest patterns. Check pyproject.toml for project-specific tool configs.`
  }
}
