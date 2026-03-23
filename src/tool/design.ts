import z from "zod"
import { Tool } from "./tool"
import { Question } from "../question"
import { Session } from "../session"
import { MessageV2 } from "../session/message-v2"
import { Identifier } from "../id/id"
import { Provider } from "../provider/provider"
import EXIT_DESCRIPTION from "./design-exit.txt"
import ENTER_DESCRIPTION from "./design-enter.txt"

async function getLastModel(sessionID: string) {
  for await (const item of MessageV2.stream(sessionID)) {
    if (item.info.role === "user" && item.info.model) return item.info.model
  }
  return Provider.defaultModel()
}

export const DesignExitTool = Tool.define("design_exit", {
  description: EXIT_DESCRIPTION,
  parameters: z.object({}),
  async execute(_params, ctx) {
    const answers = await Question.ask({
      sessionID: ctx.sessionID,
      questions: [
        {
          question: "Design complete. What would you like to do next?",
          header: "Next Step",
          custom: false,
          options: [
            { label: "Plan", description: "Switch to plan mode to create an implementation plan" },
            { label: "Build", description: "Switch to build agent and start implementing directly" },
            { label: "Keep designing", description: "Stay in design mode to continue designing" },
          ],
        },
      ],
      tool: ctx.callID ? { messageID: ctx.messageID, callID: ctx.callID } : undefined,
    })

    const answer = answers[0]?.[0]
    if (answer === "Keep designing") throw new Question.RejectedError()

    const model = await getLastModel(ctx.sessionID)
    const targetAgent = answer === "Plan" ? "plan" : "build"

    const userMsg: MessageV2.User = {
      id: Identifier.ascending("message"),
      sessionID: ctx.sessionID,
      role: "user",
      time: {
        created: Date.now(),
      },
      agent: targetAgent,
      model,
    }
    await Session.updateMessage(userMsg)

    if (targetAgent === "plan") {
      await Session.updatePart({
        id: Identifier.ascending("part"),
        messageID: userMsg.id,
        sessionID: ctx.sessionID,
        type: "text",
        text: "The design system and approach have been finalized. Create a detailed implementation plan for building the website/feature based on the design decisions.",
        synthetic: true,
      } satisfies MessageV2.TextPart)

      return {
        title: "Switching to plan mode",
        output: "User chose to plan first. Switching to plan mode. Create an implementation plan based on the design.",
        metadata: { targetAgent: "plan" },
      }
    }

    await Session.updatePart({
      id: Identifier.ascending("part"),
      messageID: userMsg.id,
      sessionID: ctx.sessionID,
      type: "text",
      text: "The designs have been reviewed. You can now edit files. Implement the designs.",
      synthetic: true,
    } satisfies MessageV2.TextPart)

    return {
      title: "Switching to build agent",
      output: "User approved switching to build agent to implement designs. Wait for further instructions.",
      metadata: { targetAgent: "build" },
    }
  },
})

export const DesignEnterTool = Tool.define("design_enter", {
  description: ENTER_DESCRIPTION,
  parameters: z.object({}),
  async execute(_params, ctx) {
    const answers = await Question.ask({
      sessionID: ctx.sessionID,
      questions: [
        {
          question: "Would you like to switch to the design agent to create UI designs with Stitch?",
          header: "Design Mode",
          custom: false,
          options: [
            { label: "Yes", description: "Switch to design agent for UI design with Stitch" },
            { label: "No", description: "Stay with current agent" },
          ],
        },
      ],
      tool: ctx.callID ? { messageID: ctx.messageID, callID: ctx.callID } : undefined,
    })

    const answer = answers[0]?.[0]
    if (answer === "No") throw new Question.RejectedError()

    const model = await getLastModel(ctx.sessionID)

    const userMsg: MessageV2.User = {
      id: Identifier.ascending("message"),
      sessionID: ctx.sessionID,
      role: "user",
      time: {
        created: Date.now(),
      },
      agent: "design",
      model,
    }
    await Session.updateMessage(userMsg)
    await Session.updatePart({
      id: Identifier.ascending("part"),
      messageID: userMsg.id,
      sessionID: ctx.sessionID,
      type: "text",
      text: "User has requested to enter design mode. Switch to design mode and begin designing.",
      synthetic: true,
    } satisfies MessageV2.TextPart)

    return {
      title: "Switching to design agent",
      output: "User confirmed to switch to design mode. A new message has been created to switch you to design mode. Begin designing.",
      metadata: { targetAgent: "design" },
    }
  },
})
