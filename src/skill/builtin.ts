import matter from "gray-matter"
import type { Skill } from "./skill"

// Embedded at compile time via Bun's text imports
import frontendDesignRaw from "./builtin/frontend-design/SKILL.md" with { type: "text" }
import webappTestingRaw from "./builtin/webapp-testing/SKILL.md" with { type: "text" }

/**
 * Built-in skills that are always available, even in distributed builds.
 * Each skill lives in its own folder under builtin/<name>/SKILL.md.
 * To add a new builtin skill:
 *   1. Create a folder under builtin/<name>/ with a SKILL.md
 *   2. Add a text import above
 *   3. Add the raw string to BUILTIN_RAW below
 */
export namespace Builtin {
  const BUILTIN_RAW = [frontendDesignRaw, webappTestingRaw]

  function parse(raw: string): Skill.Info {
    const md = matter(raw)
    return {
      name: md.data.name,
      description: md.data.description,
      location: `builtin://${md.data.name}`,
      content: md.content,
    }
  }

  export const skills: Skill.Info[] = BUILTIN_RAW.map(parse)
}
