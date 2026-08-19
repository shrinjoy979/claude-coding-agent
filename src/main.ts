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
import { color, printBanner } from "./ui.js";

async function main() {
  printBanner();

  let agent: Agent;
  try {
    agent = new Agent();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(color.red(`Error: ${message}`));
    return;
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });

  while (true) {
    let userInput: string;
    try {
      userInput = (await rl.question(`\n${color.cyan("You:")} `)).trim();
    } catch {
      console.log(color.dim("\nGoodbye!"));
      break;
    }

    if (["exit", "quit"].includes(userInput.toLowerCase())) {
      console.log(color.dim("Goodbye!"));
      break;
    }
    if (!userInput) continue;

    await agent.run(userInput);
  }

  rl.close();
}

main();
