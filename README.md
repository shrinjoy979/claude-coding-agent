<img width="803" height="404" alt="Screenshot 2026-08-20 at 12 39 42 AM" src="https://github.com/user-attachments/assets/931b3819-f35d-4adf-ab3c-e30325d363fd" />


# Simple Coding Agent (TypeScript)

A small, easy-to-read coding agent, similar in spirit to tools like Pi:
you type a request, Claude figures out which tools it needs, and the agent
runs them (reading/writing files, running commands) until the task is done.

No frameworks, no hidden magic - just a loop and five tools.

## Folder structure

```
coding-agent/
├── src/
│   ├── main.ts          # CLI entry point
│   ├── agent.ts          # The agent loop (talks to Claude, runs tools)
│   ├── tools.ts            # Tool definitions + implementations
│   └── config.ts           # Settings (API key, model, limits)
├── package.json
├── tsconfig.json
└── .env.example
```

## How it works

1. `src/main.ts` starts a chat loop and creates an `Agent`.
2. Each time you type something, `agent.run()` sends the conversation to
   Claude along with the list of available tools (`src/tools.ts`).
3. If Claude wants to use a tool (e.g. `read_file`), the agent runs the
   matching function locally and sends the result back to Claude.
4. This repeats until Claude responds with a plain text answer and no more
   tool calls - then control returns to you.

## Available tools

| Tool | What it does |
|---|---|
| `read_file` | Read a file's contents (with line numbers) |
| `write_file` | Create or overwrite a file |
| `edit_file` | Find-and-replace a unique snippet of text in a file |
| `list_directory` | List files/folders in a directory |
| `run_command` | Run a shell command (e.g. run tests, install packages) |

All file/command tools are restricted to `AGENT_WORKING_DIR` (default: the
current folder) so the agent can't wander outside your project.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and add your API key:
   ```bash
   cp .env.example .env
   # then edit .env and set ANTHROPIC_API_KEY
   ```
   Get a key at https://console.anthropic.com/

3. Run it:
   ```bash
   npm start
   ```
   This compiles the TypeScript and runs it. For faster iteration during
   development (no separate build step), use:
   ```bash
   npm run dev
   ```

## Example session

```
Simple Coding Agent (type 'exit' to quit)

You: create a hello.js that prints "Hello, world!" and run it

[tool] write_file({"path":"hello.js","content":"console.log(\"Hello, world!\");\n"})

[tool] run_command({"command":"node hello.js"})

Claude: Created hello.js and ran it - it printed "Hello, world!" as expected.
```

## Extending it

To add a new tool:
1. Write a function in `src/tools.ts`.
2. Add a matching JSON schema entry to the `TOOLS` array.
3. Register the function in `TOOL_FUNCTIONS`.

That's it - the agent loop in `agent.ts` doesn't need to change.

## Notes on simplicity

This project intentionally skips things a production agent might have:
multi-agent orchestration, persistent memory, sandboxing, streaming output,
or a web UI. It's meant to be small enough to read end-to-end in a few
minutes and understand exactly how a tool-using agent works, so you have a
solid base to build on.
