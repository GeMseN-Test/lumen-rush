// main.ts — hands Lumen Rush in to make.fun.
// Copies game/ and screenshots/ into the output directory and writes
// dossier.json with buildDossier from vendor/makefun-game.ts.
// Node 22, stdlib only. Run: MAKEFUN_OUTPUT_DIR=out node main.ts

import { cp, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const root = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

await mkdir(outDir, { recursive: true });
await cp(join(root, "game"), join(outDir, "game"), { recursive: true });
await cp(join(root, "screenshots"), join(outDir, "screenshots"), { recursive: true });

const dossier = buildDossier(outDir, caps);
await writeFile(join(outDir, "dossier.json"), dossier);
console.log(`wrote ${join(outDir, "dossier.json")} (${dossier.length} bytes)`);
