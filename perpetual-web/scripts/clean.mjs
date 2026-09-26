import { lstat, readdir, realpath, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = await realpath(fileURLToPath(new URL("../", import.meta.url)));
const dryRun = process.argv.includes("--dry-run");
const directories =
  /^(?:\.next(?:-.*)?|playwright-report|test-results(?:-.*)?|coverage|out)$/;
const files = /(?:\.tsbuildinfo|\.log)$/;

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (
    !(entry.isDirectory() && directories.test(entry.name)) &&
    !(entry.isFile() && files.test(entry.name))
  )
    continue;
  const target = path.resolve(root, entry.name);
  // Only remove generated entries directly inside this project, never links.
  if (
    path.dirname(target) !== root ||
    (await lstat(target)).isSymbolicLink() ||
    (await realpath(target)) !== target
  ) {
    throw new Error(`Refusing to clean outside the project: ${target}`);
  }
  console.log(`${dryRun ? "Would remove" : "Removing"} ${entry.name}`);
  if (!dryRun)
    await rm(target, { recursive: true, force: true, maxRetries: 3 });
}
