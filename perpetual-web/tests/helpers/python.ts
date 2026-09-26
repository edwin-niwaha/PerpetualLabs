import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const executable =
  process.platform === "win32" ? "Scripts/python.exe" : "bin/python";
const candidates = [
  process.env.PLAYWRIGHT_PYTHON,
  resolve("../perpetual-api/.venv", executable),
  resolve("../perpetual-api/.venv-web", executable),
].filter((value): value is string => Boolean(value));
const python = candidates.find(existsSync);
if (!python)
  throw new Error(
    "Create the API virtual environment or set PLAYWRIGHT_PYTHON.",
  );

export function pythonFixture(script: string, args: string[]) {
  return execFileSync(python!, [script, ...args], {
    encoding: "utf8",
    timeout: 120000,
  });
}
