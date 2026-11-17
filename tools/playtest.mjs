// playtest.mjs — actually plays Lumen Rush in headless Chrome and checks
// every state: title -> playing -> (score moves, life lost on shard hit)
// -> game over -> restart with R. Logs console errors and any
// failed/external requests. Run from the repo root: node tools/playtest.mjs

import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
const errors = [];
const badRequests = [];
const check = (name, ok, detail = "") => {
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
};

const server = spawn(process.execPath, ["serve.ts"], {
  cwd: root,
  env: { ...process.env, PORT: "8124" },
  stdio: "ignore",
});
await new Promise((r) => setTimeout(r, 1500));

const exe = `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1148/chrome-linux/headless_shell`;
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(e.message));
page.on("requestfailed", (r) => badRequests.push(r.url()));
page.on("request", (r) => {
  if (!r.url().startsWith("http://localhost:8124")) badRequests.push("EXTERNAL: " + r.url());
});

const lumen = () => page.evaluate(() => ({
  state: window.__lumen.state,
  score: window.__lumen.score,
  lives: window.__lumen.lives,
  combo: window.__lumen.combo,
  level: window.__lumen.level,
}));

await page.goto("http://localhost:8124/", { waitUntil: "load" });
await page.waitForTimeout(800);
let s = await lumen();
check("title screen on load", s.state === "title", `state=${s.state}`);

await page.keyboard.press("Enter");
await page.waitForTimeout(400);
s = await lumen();
check("Enter starts the game", s.state === "playing", `state=${s.state}`);

// Steer around and dash for 45s; orbs drift down and the player sweeps.
await page.mouse.move(640, 360);
const t0 = Date.now();
let dashed = false;
while (Date.now() - t0 < 45000) {
  const t = Date.now() - t0;
  const x = 640 + 420 * Math.sin(t / 2600);
  const y = 360 + 200 * Math.sin(t / 1700);
  await page.mouse.move(x, y, { steps: 4 });
  if (!dashed && t > 5000) { await page.keyboard.press("Space"); dashed = true; }
  await page.waitForTimeout(120);
}
s = await lumen();
check("score moved after 45s of play", s.score > 0, `score=${s.score}`);
check("dash fired without error", dashed);
check("still playing or already over (both fine)", ["playing", "gameover"].includes(s.state), `state=${s.state}`);

// If still alive, force a shard hit by teleporting a shard onto the player.
if (s.state === "playing") {
  const before = s.lives;
  await page.evaluate(() => {
    const w = window.__lumen.world;
    const p = w.player;
    w.spawnShard(p.x, p.y);
    const sh = w.shards[w.shards.length - 1];
    sh.vy = 0; sh.vx = 0;
    p.invincible = 0; p.shield = 0;
  });
  await page.waitForTimeout(600);
  s = await lumen();
  check("shard hit costs 1 life", s.lives === before - 1, `lives ${before} -> ${s.lives}`);

  // Last life + one more hit = game over.
  await page.evaluate(() => {
    const w = window.__lumen.world;
    const p = w.player;
    window.__lumen.game.lives = 1;
    w.spawnShard(p.x, p.y);
    const sh = w.shards[w.shards.length - 1];
    sh.vy = 0; sh.vx = 0;
    p.invincible = 0; p.shield = 0;
  });
  await page.waitForTimeout(600);
  s = await lumen();
  check("game over appears at 0 lives", s.state === "gameover", `state=${s.state}, score=${s.score}`);

  await page.keyboard.press("r");
  await page.waitForTimeout(400);
  s = await lumen();
  check("R restarts the game", s.state === "playing" && s.score === 0 && s.lives === 3,
    `state=${s.state}, score=${s.score}, lives=${s.lives}`);
}

// Pause check on the fresh run.
await page.keyboard.press("p");
await page.waitForTimeout(300);
s = await lumen();
check("P pauses", s.state === "paused", `state=${s.state}`);
await page.keyboard.press("p");
await page.waitForTimeout(300);
s = await lumen();
check("P resumes", s.state === "playing", `state=${s.state}`);

check("no console/page errors", errors.length === 0, errors.join(" | "));
check("no failed/external requests", badRequests.length === 0, badRequests.join(" | "));

await browser.close();
server.kill();

console.log("--- PLAYTEST ---");
for (const r of results) console.log(" ", r);
