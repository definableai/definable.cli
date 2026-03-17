---
name: subagent-driven-testing
description: Parallelize testing by dispatching specialized tester subagents for different test types. Each subagent loads the relevant skill (agent-browser, dogfood, backend-testing, etc.) and runs independently. Use automatically when testing spans multiple areas.
---

# Subagent-Driven Testing

Dispatch specialized tester subagents in parallel. Each subagent loads the relevant skill and produces a findings report. You coordinate and aggregate.

**Why subagents:** Different test types are independent. A frontend tester doesn't need API test results. Running them in parallel is faster and keeps each subagent focused with clean context.

## Process

1. **Analyze scope** — What areas need testing? Use the table below.
2. **Dispatch subagents IN PARALLEL** — Launch them in a single message using the prompt templates in this skill's directory.
3. **Collect results** — Each returns: CLEAN, ISSUES_FOUND, BLOCKED, or NEEDS_INFO.
4. **Verify critical findings** — Re-dispatch a verifier (see `./verifier-prompt.md`) for critical/high issues.
5. **Write unified report** — Aggregate all findings into one test report.

## Which Subagents to Dispatch

| What's Being Tested | Subagents |
|---|---|
| UI / pages | `./frontend-tester-prompt.md` |
| API endpoints | `./api-tester-prompt.md` |
| Auth flow | `./api-tester-prompt.md` + `./security-tester-prompt.md` |
| Full feature (FE+BE) | `./frontend-tester-prompt.md` + `./api-tester-prompt.md` |
| Production site QA | `./frontend-tester-prompt.md` + `./accessibility-tester-prompt.md` + `./performance-tester-prompt.md` |
| Incident / errors | `./log-analyzer-prompt.md` |
| Security audit | `./security-tester-prompt.md` |
| Accessibility check | `./accessibility-tester-prompt.md` |
| Performance check | `./performance-tester-prompt.md` |

Each prompt template tells the subagent which skill to load (agent-browser, dogfood, backend-testing, etc.). You don't need to repeat skill content — just fill in the template variables and dispatch.

## Prompt Templates

- `./frontend-tester-prompt.md` — Loads agent-browser + dogfood
- `./api-tester-prompt.md` — Loads backend-testing
- `./security-tester-prompt.md` — Loads security-best-practices
- `./accessibility-tester-prompt.md` — Loads web-accessibility + agent-browser
- `./performance-tester-prompt.md` — Loads performance-optimization + agent-browser
- `./log-analyzer-prompt.md` — Loads log-analysis
- `./verifier-prompt.md` — Independently reproduces critical/high findings

## Rules

- Max 4 subagents at once
- Each subagent must NOT edit source code (test mode constraint)
- Don't dispatch subagents for a single narrow test — just do it directly
- If a subagent returns NEEDS_INFO, provide context and re-dispatch
- If a subagent returns BLOCKED, check the app is up and credentials are correct
