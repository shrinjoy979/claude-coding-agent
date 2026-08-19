/**
 * Tools available to the coding agent.
 *
 * Each tool has two parts, kept side by side so they're easy to follow:
 *   1. A JSON schema in TOOLS, which tells Claude the tool exists and how to call it.
 *   2. A plain function that actually performs the action.
 *
 * To add a new tool: write a function, add its schema to TOOLS, and register
 * it in TOOL_FUNCTIONS.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import type Anthropic from "@anthropic-ai/sdk";

import * as config from "./config.js";

function safePath(inputPath: string): string {
  const fullPath = path.resolve(config.WORKING_DIR, inputPath);
  if (!fullPath.startsWith(config.WORKING_DIR)) {
    throw new Error(`Path '${inputPath}' is outside the allowed working directory.`);
  }
  return fullPath;
}

function readFile(args: { path: string }): string {
  const fullPath = safePath(args.path);
  const content = fs.readFileSync(fullPath, "utf-8");

  if (!content) return "(file is empty)";

  return content
    .split("\n")
    .map((line, i) => `${i + 1}\t${line}`)
    .join("\n");
}

function writeFile(args: { path: string; content: string }): string {
  const fullPath = safePath(args.path);
  const parent = path.dirname(fullPath);
  fs.mkdirSync(parent, { recursive: true });
  fs.writeFileSync(fullPath, args.content, "utf-8");
  return `Wrote ${args.content.length} characters to ${args.path}`;
}

function editFile(args: { path: string; old_str: string; new_str: string }): string {
  const fullPath = safePath(args.path);
  const content = fs.readFileSync(fullPath, "utf-8");

  const occurrences = content.split(args.old_str).length - 1;
  if (occurrences === 0) {
    return `Error: could not find that text in ${args.path}`;
  }
  if (occurrences > 1) {
    return `Error: text appears ${occurrences} times in ${args.path}; it must be unique`;
  }

  fs.writeFileSync(fullPath, content.replace(args.old_str, args.new_str), "utf-8");
  return `Edited ${args.path}`;
}

function listDirectory(args: { path?: string }): string {
  const fullPath = safePath(args.path ?? ".");
  const names = fs.readdirSync(fullPath).sort();
  if (names.length === 0) return "(empty directory)";

  return names
    .map((name) => {
      const isDir = fs.statSync(path.join(fullPath, name)).isDirectory();
      return isDir ? `${name}/` : name;
    })
    .join("\n");
}

function runCommand(args: { command: string }): string {
  try {
    const stdout = execSync(args.command, {
      cwd: config.WORKING_DIR,
      timeout: 30_000,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return `${stdout}\n[exit code: 0]`.trim();
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; status?: number; signal?: string };
    if (e.signal === "SIGTERM") {
      return "Error: command timed out after 30 seconds";
    }
    let output = e.stdout ?? "";
    if (e.stderr) output += `\n[stderr]\n${e.stderr}`;
    output += `\n[exit code: ${e.status ?? "unknown"}]`;
    return output.trim();
  }
}

// --- Tool schemas Claude sees -------------------------------------------------

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "read_file",
    description: "Read a text file and return its contents with line numbers.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file, relative to the working directory.",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Create a new file, or overwrite an existing one, with the given content.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file, relative to the working directory.",
        },
        content: {
          type: "string",
          description: "Full content to write to the file.",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "edit_file",
    description:
      "Replace one exact occurrence of old_str with new_str in an existing file. " +
      "old_str must match the file's content exactly and appear only once.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file, relative to the working directory.",
        },
        old_str: { type: "string", description: "Exact text to find and replace." },
        new_str: { type: "string", description: "Text to replace it with." },
      },
      required: ["path", "old_str", "new_str"],
    },
  },
  {
    name: "list_directory",
    description: "List the files and folders inside a directory.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Directory to list. Defaults to the working directory.",
        },
      },
      required: [],
    },
  },
  {
    name: "run_command",
    description:
      "Run a shell command in the working directory and return stdout, stderr, and exit code.",
    input_schema: {
      type: "object",
      properties: {
        command: { type: "string", description: "The shell command to run." },
      },
      required: ["command"],
    },
  },
];

// Maps a tool name to the function that implements it.
export const TOOL_FUNCTIONS: Record<string, (args: any) => string> = {
  read_file: readFile,
  write_file: writeFile,
  edit_file: editFile,
  list_directory: listDirectory,
  run_command: runCommand,
};
