/**
 * The core agent loop.
 *
 * The idea is simple:
 *   1. Send the conversation so far to Claude.
 *   2. If Claude's reply asks to use a tool, run that tool locally.
 *   3. Send the tool's result back to Claude.
 *   4. Repeat until Claude replies with plain text and no more tool calls.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, ContentBlock, ToolResultBlockParam } from "@anthropic-ai/sdk/resources/messages";

import * as config from "./config.js";
import { TOOLS, TOOL_FUNCTIONS } from "./tools.js";

const SYSTEM_PROMPT = `You are a helpful coding agent. You can read, write, and edit files,
list directories, and run shell commands to complete coding tasks.

Guidelines:
- Look around the project (list_directory, read_file) before making changes if you're
  unsure how it's structured.
- Prefer edit_file for small, targeted changes over rewriting a whole file with write_file.
- Use run_command to run tests, install dependencies, or check that your changes work.
- Briefly explain what you're doing as you go.
- If a request is ambiguous, make a reasonable assumption, state it, and proceed,
  rather than stopping to ask.`;

export class Agent {
  private client: Anthropic;
  private messages: MessageParam[] = [];

  constructor() {
    if (!config.API_KEY) {
      throw new Error(
        "No API key found. Set the ANTHROPIC_API_KEY environment variable " +
          "(you can put it in a .env file - see .env.example)."
      );
    }
    this.client = new Anthropic({ apiKey: config.API_KEY });
  }

  /** Handle one user request end-to-end, including any tool calls. */
  async run(userInput: string): Promise<void> {
    this.messages.push({ role: "user", content: userInput });

    for (let step = 0; step < config.MAX_STEPS; step++) {
      const response = await this.client.messages.create({
        model: config.MODEL,
        max_tokens: config.MAX_TOKENS,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: this.messages,
      });

      this.messages.push({ role: "assistant", content: response.content });
      this.printTextBlocks(response.content);

      if (response.stop_reason !== "tool_use") {
        return; // Claude gave a final answer; nothing left to do.
      }

      const toolResults = this.runRequestedTools(response.content);
      this.messages.push({ role: "user", content: toolResults });
    }

    console.log("\n(Stopped: reached the maximum number of steps for this task.)");
  }

  private printTextBlocks(blocks: ContentBlock[]): void {
    for (const block of blocks) {
      if (block.type === "text" && block.text.trim()) {
        console.log(`\nClaude: ${block.text}`);
      }
    }
  }

  private runRequestedTools(blocks: ContentBlock[]): ToolResultBlockParam[] {
    const results: ToolResultBlockParam[] = [];
    for (const block of blocks) {
      if (block.type !== "tool_use") continue;
      const result = this.executeTool(block.name, block.input);
      results.push({ type: "tool_result", tool_use_id: block.id, content: result });
    }
    return results;
  }

  private executeTool(name: string, toolInput: unknown): string {
    const func = TOOL_FUNCTIONS[name];
    if (!func) return `Error: unknown tool '${name}'`;

    console.log(`\n[tool] ${name}(${JSON.stringify(toolInput)})`);
    try {
      return String(func(toolInput));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return `Error while running ${name}: ${message}`;
    }
  }
}
