import path from "path"
import matter from "gray-matter"
import type { Skill } from "./skill"

// Embedded at compile time via Bun's text imports
// -- Design & Frontend --
import frontendDesignRaw from "./builtin/frontend-design/SKILL.md" with { type: "text" }
import reactBestPracticesRaw from "./builtin/react-best-practices/SKILL.md" with { type: "text" }
import webDesignGuidelinesRaw from "./builtin/web-design-guidelines/SKILL.md" with { type: "text" }
import uiUxProMaxRaw from "./builtin/ui-ux-pro-max/SKILL.md" with { type: "text" }
// -- Testing & Quality --
import webappTestingRaw from "./builtin/webapp-testing/SKILL.md" with { type: "text" }
import testDrivenDevelopmentRaw from "./builtin/test-driven-development/SKILL.md" with { type: "text" }
import verificationBeforeCompletionRaw from "./builtin/verification-before-completion/SKILL.md" with { type: "text" }
// -- Workflow & Process --
import systematicDebuggingRaw from "./builtin/systematic-debugging/SKILL.md" with { type: "text" }
import writingPlansRaw from "./builtin/writing-plans/SKILL.md" with { type: "text" }
import brainstormingRaw from "./builtin/brainstorming/SKILL.md" with { type: "text" }
import subagentDrivenDevelopmentRaw from "./builtin/subagent-driven-development/SKILL.md" with { type: "text" }
import receivingCodeReviewRaw from "./builtin/receiving-code-review/SKILL.md" with { type: "text" }

/**
 * Built-in skills that are always available, even in distributed builds.
 * Each skill lives in its own folder under builtin/<name>/SKILL.md.
 * To add a new builtin skill:
 *   1. Create a folder under builtin/<name>/ with a SKILL.md
 *   2. Add a text import above
 *   3. Add the raw string to BUILTIN_RAW below
 */
export namespace Builtin {
  const BUILTIN_DIR = path.join(import.meta.dirname, "builtin")

  const BUILTIN_RAW = [
    // Design & Frontend
    frontendDesignRaw,
    reactBestPracticesRaw,
    webDesignGuidelinesRaw,
    uiUxProMaxRaw,
    // Testing & Quality
    webappTestingRaw,
    testDrivenDevelopmentRaw,
    verificationBeforeCompletionRaw,
    // Workflow & Process
    systematicDebuggingRaw,
    writingPlansRaw,
    brainstormingRaw,
    subagentDrivenDevelopmentRaw,
    receivingCodeReviewRaw,
  ]

  function parse(raw: string): Skill.Info {
    const md = matter(raw)
    const name = md.data.name as string
    return {
      name,
      description: md.data.description,
      location: path.join(BUILTIN_DIR, name, "SKILL.md"),
      content: md.content,
    }
  }

  export const skills: Skill.Info[] = BUILTIN_RAW.map(parse)
}
