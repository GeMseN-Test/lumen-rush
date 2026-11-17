// main.js — the heart of Lumen Rush: the game loop, the state
// machine (title / playing / paused / game over), scoring, combo,
// lives and restarts. It wires input + world + render + audio
// together and nothing else.

import { CONFIG as C } from "./config.js";
import { makeRng, seedFromUrl } from "./random.js";
import { createInput } from "./input.js";
import { createAudio } from "./audio.js";
import { createWorld } from "./world.js";
import { createRenderer } from "./render.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const BEST_KEY = "lumen-rush-best";

const params = new URLSearchParams(window.location.search);
const shot = params.get("shot"); // start | play | end | null
const seed = seedFromUrl();
const rng = makeRng(seed);

const input = createInput(canvas);
const audio = createAudio();
const world = createWorld(rng);
const render = createRenderer(ctx);

const game = {
  state: "title", // title | playing | paused | gameover
  score: 0,
  combo: 1,
  comboTimer: 0,
  lives: C.lives,
  best: 0,
  banner: null,   // { text, sub, color, life }
  isNewBest: false,
  demoScore: 0,
};

try {
  game.best = parseInt(window.localStorage.getItem(BEST_KEY) || "0", 10) || 0;
} catch (e) {
  game.best = 0;
}

function saveBest() {
  try {
    window.localStorage.setItem(BEST_KEY, String(game.best));
  } catch (e) { /* private mode: best score just lives for the session */ }
}

function showBanner(text, sub, color, life = 1.4) {
  game.banner = { text, sub, color, life };
}

function startGame() {
  audio.ensure();
  audio.start();
  world.reset(makeRng((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0));
  game.score = 0;
  game.combo = 1;
  game.comboTimer = 0;
  game.lives = C.lives;
  game.isNewBest = false;
  game.banner = null;
  game.state = "playing";
}

function endGame() {
  game.state = "gameover";
  audio.gameOver();
  if (game.score > game.best) {
    game.best = game.score;
    game.isNewBest = true;
    saveBest();
  }
  world.burst(world.player.x, world.player.y, "#fb7185", 30, 260);
  world.burst(world.player.x, world.player.y, "#c084fc", 20, 200);
}

function applyEvents(events) {
  for (const orb of events.collected) {
    const gained = C.orbScore * game.combo;
    game.score += gained;
    game.demoScore = game.score;
    world.floatText(orb.x, orb.y - 10, `+${gained}`, C.colors.gold);
    world.burst(orb.x, orb.y, C.colors.orbGold, C.particleBurst, 170);
    audio.collect(game.combo);
    game.comboTimer = C.comboWindow;
    if (game.combo < C.comboMax) game.combo += 1;
  }
  if (events.collected.length > 0 && game.combo > C.comboMax) game.combo = C.comboMax;  if (events.shield) {
    showBanner("SHIELD!", "Kebal 5 detik", C.colors.shieldCyan, 1.2);
    audio.shield();
  }
  if (events.leveled) {
    showBanner("LEVEL UP!", `Level ${world.level} — makin cepat!`, C.colors.gold, 1.6);
    audio.levelUp();
  }
  if (events.hit) {
    game.lives -= 1;
    game.combo = 1;
    game.comboTimer = 0;
    world.player.invincible = 1.2;
    world.burst(world.player.x, world.player.y, "#fb7185", C.particleHit, 240);
    world.burst(world.player.x, world.player.y, "#c084fc", 14, 180);
    audio.hit();
    if (game.lives <= 0) endGame();
  }
}

// --- Screenshot modes: deterministic staged scenes for shots.json ---
function setupShot() {
  if (shot === "start") {
    game.state = "title";
    game.best = 1250;
  } else if (shot === "play") {
    game.state = "playing";
    game.score = 1240;
    game.combo = 3;
    game.comboTimer = C.comboWindow;
    game.lives = 2;
    world.seedPlayScene();
    world.floatText(560, 300, "+30", C.colors.gold);
    // Settle the scene once (particles spread, stars twinkle) then freeze
    // it, so the screenshot looks the same no matter when it is taken.
    world.update(0.45, false);
    if (seed === 7) {
      game.score = 2310;
      game.combo = 5;
      world.player.shield = 3.2;
    }
  } else if (shot === "end") {
    game.state = "gameover";
    game.score = 1870;
    game.best = 1870;
    game.isNewBest = true;
  }
  // Expose a flag so the screenshot script knows the frame is staged.
  window.__shotReady = true;
}

function update(dt) {
  if (game.state === "playing") {
    if (input.wasPressed("p")) {
      game.state = "paused";
    } else {
      if (input.wasPressed(" ") || input.clicked) {
        if (world.tryDash()) audio.dash();
      }
      world.movePlayer(input, dt);
      const events = world.update(dt, true);
      applyEvents(events);
      if (game.comboTimer > 0) {
        game.comboTimer -= dt;
        if (game.comboTimer <= 0) game.combo = 1;
      }
      if (game.banner) {
        game.banner.life -= dt;
        if (game.banner.life <= 0) game.banner = null;
      }
    }
  } else if (game.state === "title") {
    world.update(dt, false);
    if (input.wasPressed("Enter") || input.clicked) startGame();
  } else if (game.state === "paused") {
    if (input.wasPressed("p") || input.wasPressed("Enter")) game.state = "playing";
  } else if (game.state === "gameover") {
    world.update(dt, false);
    if (input.wasPressed("r") || input.clicked) startGame();
  }

  if (input.wasPressed("m")) {
    audio.ensure();
    const muted = audio.toggleMute();
    showBanner(muted ? "SUARA MATI" : "SUARA HIDUP", "", C.colors.dim, 0.9);
  }
  if (input.clicked || input.wasPressed("Enter") || input.wasPressed(" ")) audio.ensure();
}

function draw() {
  ctx.save();
  if (world.shake > 0) {
    const s = world.shake;
    ctx.translate((rng() - 0.5) * s, (rng() - 0.5) * s);
  }
  render.drawBackground(world);
  if (game.state === "title") {
    render.drawEntities(world);
    render.drawPlayer(world);
    render.drawTitle(game.best);
  } else if (game.state === "playing" || game.state === "paused") {
    render.drawEntities(world);
    render.drawPlayer(world);
    render.drawHud({
      score: game.score,
      combo: game.combo,
      lives: game.lives,
      level: world.level,
      collected: world.collected,
      world,
    });
    if (game.banner) {
      render.drawBanner(game.banner.text, game.banner.sub, game.banner.color);
    }
    if (game.state === "paused") render.drawPaused();
  } else if (game.state === "gameover") {
    render.drawEntities(world);
    render.drawGameOver(game.score, game.best, game.isNewBest);
  }
  ctx.restore();
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  // In shot mode the scene is staged once in setupShot and frozen:
  // no updates, so every screenshot of the same seed is identical.
  if (!shot) update(dt);
  draw();
  input.endFrame();
  requestAnimationFrame(loop);
}

// Debug/testing hook (read-only state for the play-test script).
window.__lumen = {
  get state() { return game.state; },
  get score() { return game.score; },
  get lives() { return game.lives; },
  get combo() { return game.combo; },
  get level() { return world.level; },
  world,
  game,
};

setupShot();
requestAnimationFrame(loop);
