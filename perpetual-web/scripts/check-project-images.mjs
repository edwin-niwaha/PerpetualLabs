import { readFile, stat } from "node:fs/promises";
const manifest = JSON.parse(
  await readFile(
    new URL("../src/lib/project-images.json", import.meta.url),
    "utf8",
  ),
);
for (const [slug, asset] of Object.entries(manifest)) {
  if (!/^[a-z0-9-]+\.(webp|svg|png|jpe?g)$/.test(asset))
    throw new Error(`Invalid project image: ${slug}`);
  const path = new URL(`../public/images/projects/${asset}`, import.meta.url);
  const file = await stat(path).catch(() => null);
  if (!file?.isFile() || !file.size)
    throw new Error(
      `Missing project image: public/images/projects/${asset}. Include the public directory in the deployment.`,
    );
}
console.log(`Verified ${Object.keys(manifest).length} bundled project images.`);
