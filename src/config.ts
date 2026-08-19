/**
 * Configuration for the coding agent.
 *
 * All settings come from environment variables so you never have to hard-code
 * secrets like your API key. If a .env file is present, it's loaded too.
 */

import "dotenv/config";
import path from "node:path";

// Your Anthropic API key. Get one at https://console.anthropic.com/
export const API_KEY = process.env.ANTHROPIC_API_KEY;

// Which Claude model to use.
export const MODEL = process.env.AGENT_MODEL ?? "claude-sonnet-4-6";

// Max tokens Claude can generate in a single reply.
export const MAX_TOKENS = 4096;

// Safety limit: max number of tool-use steps per task, to avoid infinite loops.
export const MAX_STEPS = 25;

// The directory the agent is allowed to read/write/run commands in.
// Defaults to the folder you launch the agent from.
export const WORKING_DIR = path.resolve(process.env.AGENT_WORKING_DIR ?? process.cwd());
