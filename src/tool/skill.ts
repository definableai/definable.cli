import path from "path"
import fs from "fs/promises"
import { pathToFileURL } from "url"
import z from "zod"
import { Tool } from "./tool"
import { Skill } from "../skill"
import { PermissionNext } from "../permission/next"
import { Ripgrep } from "../file/ripgrep"
import { iife } from "@/util/iife"
import { Global } from "@/global"

export const SkillTool = Tool.define("skill", async (ctx) => {
  const skills = await Skill.all()

  // Filter skills by agent permissions if agent provided
  const agent = ctx?.agent
  const accessibleSkills = agent
    ? skills.filter((skill) => {
        const rule = PermissionNext.evaluate("skill", skill.name, agent.permission)
        return rule.action !== "deny"
      })
    : skills

  const description =
    accessibleSkills.length === 0
      ? "Load a specialized skill that provides domain-specific instructions and workflows. No skills are currently available."
      : [
          "Load a specialized skill that provides domain-specific instructions and workflows.",
          "",
          "When you recognize that a task matches one of the available skills listed below, use this tool to load the full skill instructions.",
          "",
          "The skill will inject detailed instructions, workflows, and access to bundled resources (scripts, references, templates) into the conversation context.",
          "",
          'Tool output includes a `<skill_content name="...">` block with the loaded content.',
          "",
          "The following skills provide specialized sets of instructions for particular tasks",
          "Invoke this tool to load a skill when a task matches one of the available skills listed below:",
          "",
          "<available_skills>",
          ...accessibleSkills.flatMap((skill) => [
            `  <skill>`,
            `    <name>${skill.name}</name>`,
            `    <description>${skill.description}</description>`,
            `    <location>${pathToFileURL(skill.location).href}</location>`,
            `  </skill>`,
          ]),
          "</available_skills>",
        ].join("\n")

  const examples = accessibleSkills
    .map((skill) => `'${skill.name}'`)
    .slice(0, 3)
    .join(", ")
  const hint = examples.length > 0 ? ` (e.g., ${examples}, ...)` : ""

  const parameters = z.object({
    name: z.string().describe(`The name of the skill from available_skills${hint}`),
  })

  return {
    description,
    parameters,
    async execute(params: z.infer<typeof parameters>, ctx) {
      let skill = await Skill.get(params.name)

      if (!skill) {
        const available = await Skill.all().then((x) => Object.keys(x).join(", "))
        throw new Error(`Skill "${params.name}" not found. Available skills: ${available || "none"}`)
      }

      await ctx.ask({
        permission: "skill",
        patterns: [params.name],
        always: [params.name],
        metadata: {},
      })

      // Builtin skills have their content embedded at compile time;
      // their location points to a virtual $bunfs path that doesn't exist on disk.
      // Extract assets to cache so scripts/data files are executable on disk.
      if (skill.builtin && skill.assets && Object.keys(skill.assets).length > 0) {
        const extractDir = path.join(Global.Path.cache, "skills", skill.name)
        await fs.mkdir(extractDir, { recursive: true })
        for (const [filePath, content] of Object.entries(skill.assets)) {
          const dest = path.join(extractDir, filePath)
          await fs.mkdir(path.dirname(dest), { recursive: true })
          await fs.writeFile(dest, String(content))
        }
        // Also write SKILL.md for completeness
        await fs.writeFile(path.join(extractDir, "SKILL.md"), skill.content)
        // Override location so the rest of the flow uses the extracted dir
        skill = { ...skill, location: path.join(extractDir, "SKILL.md") }
      } else if (skill.builtin) {
        return {
          title: `Loaded skill: ${skill.name}`,
          output: [
            `<skill_content name="${skill.name}">`,
            `# Skill: ${skill.name}`,
            "",
            skill.content.trim(),
            "",
            "</skill_content>",
          ].join("\n"),
          metadata: {
            name: skill.name,
          } as { name: string; dir?: string },
        }
      }

      const dir = path.dirname(skill.location)

      const limit = 10
      const files = await iife(async () => {
        const arr = []
        for await (const file of Ripgrep.files({
          cwd: dir,
          follow: false,
          hidden: true,
          signal: ctx.abort,
        })) {
          if (file.includes("SKILL.md")) {
            continue
          }
          arr.push(path.resolve(dir, file))
          if (arr.length >= limit) {
            break
          }
        }
        return arr
      }).then((f) => f.map((file) => `<file>${file}</file>`).join("\n"))

      return {
        title: `Loaded skill: ${skill.name}`,
        output: [
          `<skill_content name="${skill.name}">`,
          `# Skill: ${skill.name}`,
          "",
          skill.content.trim(),
          "",
          `Base directory for this skill: ${dir}`,
          `When running scripts or reading files from this skill, use absolute paths prefixed with ${dir}/`,
          "Note: file list is sampled.",
          "",
          "<skill_files>",
          files,
          "</skill_files>",
          "</skill_content>",
        ].join("\n"),
        metadata: {
          name: skill.name,
          dir,
        },
      }
    },
  }
})
