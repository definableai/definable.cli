import path from "path"
import matter from "gray-matter"
import type { Skill } from "./skill"
import { builtinAssets } from "./builtin-assets"

// Embedded at compile time via Bun's text imports
// -- Design & Frontend --
import frontendDesignRaw from "./builtin/frontend-design/SKILL.md" with { type: "text" }
import reactBestPracticesRaw from "./builtin/react-best-practices/SKILL.md" with { type: "text" }
import webDesignGuidelinesRaw from "./builtin/web-design-guidelines/SKILL.md" with { type: "text" }
import uiUxProMaxRaw from "./builtin/ui-ux-pro-max/SKILL.md" with { type: "text" }
// -- Testing & Quality --
import testDrivenDevelopmentRaw from "./builtin/test-driven-development/SKILL.md" with { type: "text" }
import verificationBeforeCompletionRaw from "./builtin/verification-before-completion/SKILL.md" with { type: "text" }
// -- Workflow & Process --
import systematicDebuggingRaw from "./builtin/systematic-debugging/SKILL.md" with { type: "text" }
import writingPlansRaw from "./builtin/writing-plans/SKILL.md" with { type: "text" }
import brainstormingRaw from "./builtin/brainstorming/SKILL.md" with { type: "text" }
import subagentDrivenDevelopmentRaw from "./builtin/subagent-driven-development/SKILL.md" with { type: "text" }
import receivingCodeReviewRaw from "./builtin/receiving-code-review/SKILL.md" with { type: "text" }
// -- Marketing & SEO --
import analyticsTrackingRaw from "./builtin/analytics-tracking/SKILL.md" with { type: "text" }
import schemaMarkupRaw from "./builtin/schema-markup/SKILL.md" with { type: "text" }
import seoAuditRaw from "./builtin/seo-audit/SKILL.md" with { type: "text" }
// -- Figma & Design --
import codeConnectComponentsRaw from "./builtin/code-connect-components/SKILL.md" with { type: "text" }
import createDesignSystemRulesRaw from "./builtin/create-design-system-rules/SKILL.md" with { type: "text" }
import implementDesignRaw from "./builtin/implement-design/SKILL.md" with { type: "text" }
// -- Mobile --
import reactNativeSkillsRaw from "./builtin/react-native-skills/SKILL.md" with { type: "text" }
// -- Browser Automation --
import agentBrowserRaw from "./builtin/agent-browser/SKILL.md" with { type: "text" }
import dogfoodRaw from "./builtin/dogfood/SKILL.md" with { type: "text" }
// -- Backend Testing & QA --
import backendTestingRaw from "./builtin/backend-testing/SKILL.md" with { type: "text" }
import testingStrategiesRaw from "./builtin/testing-strategies/SKILL.md" with { type: "text" }
import securityBestPracticesRaw from "./builtin/security-best-practices/SKILL.md" with { type: "text" }
import webAccessibilityRaw from "./builtin/web-accessibility/SKILL.md" with { type: "text" }
import performanceOptimizationRaw from "./builtin/performance-optimization/SKILL.md" with { type: "text" }
import logAnalysisRaw from "./builtin/log-analysis/SKILL.md" with { type: "text" }
// -- Subagent Testing --
import subagentDrivenTestingRaw from "./builtin/subagent-driven-testing/SKILL.md" with { type: "text" }
// -- Skills Discovery --
import findSkillsRaw from "./builtin/find-skills/SKILL.md" with { type: "text" }

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
    testDrivenDevelopmentRaw,
    verificationBeforeCompletionRaw,
    // Workflow & Process
    systematicDebuggingRaw,
    writingPlansRaw,
    brainstormingRaw,
    subagentDrivenDevelopmentRaw,
    receivingCodeReviewRaw,
    // Marketing & SEO
    analyticsTrackingRaw,
    schemaMarkupRaw,
    seoAuditRaw,
    // Figma & Design
    codeConnectComponentsRaw,
    createDesignSystemRulesRaw,
    implementDesignRaw,
    // Mobile
    reactNativeSkillsRaw,
    // Browser Automation
    agentBrowserRaw,
    dogfoodRaw,
    // Backend Testing & QA
    backendTestingRaw,
    testingStrategiesRaw,
    securityBestPracticesRaw,
    webAccessibilityRaw,
    performanceOptimizationRaw,
    logAnalysisRaw,
    // Subagent Testing
    subagentDrivenTestingRaw,
    // Skills Discovery
    findSkillsRaw,
  ]

  function parse(raw: string): Skill.Info {
    const md = matter(raw)
    const name = md.data.name as string
    return {
      name,
      description: md.data.description,
      location: path.join(BUILTIN_DIR, name, "SKILL.md"),
      content: md.content,
      builtin: true,
      assets: builtinAssets[name],
    }
  }

  export const skills: Skill.Info[] = BUILTIN_RAW.map(parse)
}
