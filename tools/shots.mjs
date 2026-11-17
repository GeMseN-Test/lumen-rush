// shots.mjs — takes the screenshots listed in shots.json with Playwright.
// Serves game/ on a local port, opens each ?shot= query at 1280x720,
// waits for the staged frame, saves a JPEG into screenshots/.
// Run from the repo root: node tools/shots.mjs

import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const shots = JSON.parse(await readFile(join(root, "shots.json"), "utf8"));

const server = spawn(process.execPath, ["serve.ts"], {
  cwd: root,
  env: { ...process.env, PORT: "8123" },
  stdio: "ignore",
});
await new Promise((r) => setTimeout(r, 1500));

const exe = `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1148/chrome-linux/headless_shell`;
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE ERROR:", m.text()); });
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));

for (const shot of shots) {
  const url = `http://localhost:8123/${shot.query}`;
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 5000 });
  await page.waitForTimeout(600);
  const file = join(root, "screenshots", shot.name);
  let quality = 85;
  await page.screenshot({ path: file, type: "jpeg", quality });
  let size = (await stat(file)).size;
  while (size > 262144 && quality > 50) {
    quality -= 10;
    await page.screenshot({ path: file, type: "jpeg", quality });
    size = (await stat(file)).size;
  }
  console.log(`${shot.name}: ${size} bytes (quality ${quality})`);
}

await browser.close();
server.kill();
console.log("done");
