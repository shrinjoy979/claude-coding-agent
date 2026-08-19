/**
 * Entry point for the coding agent.
 *
 * Usage:
 *     npm start
 *
 * Type instructions at the prompt. Type 'exit' or 'quit' to stop.
 */

import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { Agent } from "./agent.js";

async function main() {
  console.log("Simple Coding Agent (type 'exit' to quit)");

  let agent: Agent;
  try {
    agent = new Agent();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error: ${message}`);
    return;
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });

  while (true) {
    let userInput: string;
    try {
      userInput = (await rl.question("\nYou: ")).trim();
    } catch {
      console.log("\nGoodbye!");
      break;
    }

    if (["exit", "quit"].includes(userInput.toLowerCase())) {
      console.log("Goodbye!");
      break;
    }
    if (!userInput) continue;

    await agent.run(userInput);
  }

  rl.close();
}

main();
