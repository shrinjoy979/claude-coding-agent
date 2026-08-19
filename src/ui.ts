/**
 * Terminal styling for the coding agent CLI.
 *
 * Banner is FIGlet "slant" (same look as the Cargo And Capital reference):
 * neon green ASCII art on a dark terminal.
 */

const RESET = "\x1b[0m";
const NEON_GREEN = "\x1b[38;2;0;255;65m";
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";

const useColor = Boolean(process.stdout.isTTY);

function paint(color: string, text: string): string {
  if (!useColor) return text;
  return `${color}${text}${RESET}`;
}

export const color = {
  neon: (text: string) => paint(NEON_GREEN, text),
  dim: (text: string) => paint(DIM, text),
  cyan: (text: string) => paint(CYAN, text),
  yellow: (text: string) => paint(YELLOW, text),
  red: (text: string) => paint(RED, text),
};

const BANNER = String.raw`
   __________  ____  _____   ________   ___   _____________   ________
  / ____/ __ \/ __ \/  _/ | / / ____/  /   | / ____/ ____/ | / /_  __/
 / /   / / / / / / // //  |/ / / __   / /| |/ / __/ __/ /  |/ / / /   
/ /___/ /_/ / /_/ // // /|  / /_/ /  / ___ / /_/ / /___/ /|  / / /    
\____/\____/_____/___/_/ |_/\____/  /_/  |_\____/_____/_/ |_/ /_/     
`.trimEnd();

export function printBanner(): void {
  console.log(color.neon(BANNER));
  console.log(color.dim("  type 'exit' or 'quit' to leave\n"));
}
