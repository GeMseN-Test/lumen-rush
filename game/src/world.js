// world.js — the living world of Lumen Rush: the player orb, lumen
// orbs, void shards, shield power-ups, particles and floating text.
// Pure game logic: it moves things, spawns things and reports what
// happened (collected / hit / shield / level up) so main.js can score.

import { CONFIG as C } from "./config.js";
import { range, chance } from "./random.js";

export function createWorld(rng) {
  const world = {
    rng,
    player: {
      x: C.width / 2,
      y: C.height * 0.62,
      vx: 0,
      vy: 0,
      r: C.playerRadius,
      trail: [],
      dashTime: 0,
      dashCooldown: 0,
      dashDirX: 0,
      dashDirY: -1,
      shield: 0,
      invincible: 0,
    },
    orbs: [],
    shards: [],
    shields: [],
    particles: [],
    floats: [],
    stars: [],
    orbTimer: 0.4,
    shardTimer: 1.2,
    shieldTimer: 6,
    time: 0,
    shake: 0,
    level: 1,
    collected: 0,
  };

  // Three parallax star layers, seeded so shots look the same.
  for (let layer = 0; layer < 3; layer++) {
    for (let i = 0; i < C.stars[layer]; i++) {
      world.stars.push({
        x: rng() * C.width,
        y: rng() * C.height,
        layer,
        size: 0.8 + layer * 0.7 + rng() * 0.8,
        twinkle: rng() * Math.PI * 2,
      });
    }
  }

  world.levelSpeed = () => 1 + (world.level - 1) * C.speedPerLevel;
  world.levelSpawn = () => 1 + (world.level - 1) * C.spawnPerLevel;

  world.spawnOrb = (x, y) => {
    world.orbs.push({
      x: x !== undefined ? x : range(rng, 30, C.width - 30),
      y: y !== undefined ? y : -20,
      r: C.orbRadius,
      vy: range(rng, C.orbFallMin, C.orbFallMax),
      vx: range(rng, -24, 24),
      phase: rng() * Math.PI * 2,
      pulse: range(rng, 2.2, 3.4),
    });
  };

  world.spawnShard = (x, y) => {
    world.shards.push({
      x: x !== undefined ? x : range(rng, 30, C.width - 30),
      y: y !== undefined ? y : -24,
      r: C.shardRadius,
      vy: range(rng, C.shardFallMin, C.shardFallMax),
      vx: range(rng, -40, 40),
      rot: rng() * Math.PI * 2,
      spin: range(rng, -C.shardSpin, C.shardSpin),
    });
  };

  world.spawnShield = () => {
    world.shields.push({
      x: range(rng, 40, C.width - 40),
      y: -20,
      r: C.shieldRadius,
      vy: C.shieldFall,
      phase: rng() * Math.PI * 2,
    });
  };

  world.burst = (x, y, color, n, speed) => {
    for (let i = 0; i < n; i++) {
      const a = rng() * Math.PI * 2;
      const s = range(rng, speed * 0.3, speed);
      world.particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: range(rng, 0.35, 0.8),
        maxLife: 0.8,
        size: range(rng, 2, 5),
        color,
      });
    }
  };

  world.floatText = (x, y, text, color) => {
    world.floats.push({ x, y, text, color, life: C.floatTextLife });
  };

  // Fill the scene for the "play" screenshot: a busy mid-game moment.
  world.seedPlayScene = () => {
    world.level = 3;
    world.collected = 32;
    for (let i = 0; i < 11; i++) {
      world.spawnOrb(range(rng, 60, C.width - 60), range(rng, 60, C.height - 200));
    }
    for (let i = 0; i < 7; i++) {
      world.spawnShard(range(rng, 60, C.width - 60), range(rng, 40, C.height - 260));
    }
    world.spawnShield();
    world.shields[0].x = C.width * 0.78;
    world.shields[0].y = 210;
    world.player.x = C.width * 0.42;
    world.player.y = C.height * 0.6;
    world.burst(560, 330, C.colors.orbGold, 10, 130);
  };

  // Move the player. input gives keys/mouse; dt is seconds.
  world.movePlayer = (input, dt) => {
    const p = world.player;
    const ax = input.axisX();
    const ay = input.axisY();
    if (ax !== 0 || ay !== 0) {
      const len = Math.hypot(ax, ay);
      p.vx = (ax / len) * C.playerSpeed;
      p.vy = (ay / len) * C.playerSpeed;
      p.dashDirX = ax / len;
      p.dashDirY = ay / len;
      input.mouseActive = false;
    } else if (input.mouseActive) {
      const dx = input.mouseX - p.x;
      const dy = input.mouseY - p.y;
      p.vx = dx * C.playerFollow;
      p.vy = dy * C.playerFollow;
      const len = Math.hypot(dx, dy);
      if (len > 4) {
        p.dashDirX = dx / len;
        p.dashDirY = dy / len;
      }
    } else {
      p.vx *= 0.86;
      p.vy *= 0.86;
    }

    if (p.dashTime > 0) {
      p.dashTime -= dt;
      p.x += p.dashDirX * C.dashSpeed * dt;
      p.y += p.dashDirY * C.dashSpeed * dt;
    } else {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    p.x = Math.max(p.r, Math.min(C.width - p.r, p.x));
    p.y = Math.max(p.r, Math.min(C.height - p.r, p.y));
    if (p.dashCooldown > 0) p.dashCooldown -= dt;
    if (p.shield > 0) p.shield -= dt;
    if (p.invincible > 0) p.invincible -= dt;

    p.trail.unshift({ x: p.x, y: p.y });
    if (p.trail.length > C.playerTrail) p.trail.pop();
  };

  world.tryDash = () => {
    const p = world.player;
    if (p.dashCooldown <= 0) {
      p.dashTime = C.dashTime;
      p.dashCooldown = C.dashCooldown;
      p.invincible = Math.max(p.invincible, C.dashTime);
      return true;
    }
    return false;
  };

  // One simulation step. Returns events for main.js to score.
  world.update = (dt, spawning = true) => {
    world.time += dt;
    const events = { collected: [], hit: false, shield: false, leveled: false };

    for (const s of world.stars) {
      s.y += C.starSpeed[s.layer] * dt;
      s.twinkle += dt * 2;
      if (s.y > C.height + 2) {
        s.y = -2;
        s.x = world.rng() * C.width;
      }
    }

    if (spawning) {
      world.orbTimer -= dt;
      if (world.orbTimer <= 0 && world.orbs.length < C.maxOrbs) {
        world.spawnOrb();
        world.orbTimer = (1 / C.orbSpawn / world.levelSpawn()) * range(world.rng, 0.7, 1.3);
      }
      world.shardTimer -= dt;
      if (world.shardTimer <= 0 && world.shards.length < C.maxShards) {
        world.spawnShard();
        world.shardTimer = (1 / C.shardSpawn / world.levelSpawn()) * range(world.rng, 0.7, 1.3);
      }
      world.shieldTimer -= dt;
      if (world.shieldTimer <= 0) {
        world.spawnShield();
        world.shieldTimer = range(world.rng, 14, 22);
      }
    }

    const speed = world.levelSpeed();
    for (const o of world.orbs) {
      o.y += o.vy * speed * dt;
      o.x += o.vx * dt + Math.sin(world.time * o.pulse + o.phase) * 14 * dt;
    }
    world.orbs = world.orbs.filter((o) => o.y < C.height + 30);

    for (const s of world.shards) {
      s.y += s.vy * speed * dt;
      s.x += s.vx * dt;
      s.rot += s.spin * dt;
      if (s.x < s.r || s.x > C.width - s.r) s.vx *= -1;
    }
    world.shards = world.shards.filter((s) => s.y < C.height + 40);

    for (const s of world.shields) {
      s.y += s.vy * dt;
      s.x += Math.sin(world.time * 2 + s.phase) * 20 * dt;
    }
    world.shields = world.shields.filter((s) => s.y < C.height + 30);

    for (const pt of world.particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.96;
      pt.vy *= 0.96;
      pt.life -= dt;
    }
    world.particles = world.particles.filter((pt) => pt.life > 0);

    for (const f of world.floats) {
      f.y -= 42 * dt;
      f.life -= dt;
    }
    world.floats = world.floats.filter((f) => f.life > 0);

    if (world.shake > 0) world.shake = Math.max(0, world.shake - C.shakeDecay * dt);

    // Collisions with the player.
    const p = world.player;
    const hitR = p.r;
    const keepOrbs = [];
    for (const o of world.orbs) {
      const d = Math.hypot(o.x - p.x, o.y - p.y);
      if (d < o.r + hitR) {
        events.collected.push(o);
        world.collected += 1;
        if (world.collected % C.levelEvery === 0) {
          world.level += 1;
          events.leveled = true;
        }
      } else keepOrbs.push(o);
    }
    world.orbs = keepOrbs;

    if (p.invincible <= 0 && p.shield <= 0) {
      for (let i = 0; i < world.shards.length; i++) {
        const s = world.shards[i];
        if (Math.hypot(s.x - p.x, s.y - p.y) < s.r * 0.85 + hitR * 0.8) {
          world.shards.splice(i, 1);
          events.hit = true;
          world.shake = C.shakeOnHit;
          break;
        }
      }
    } else if (p.shield > 0) {
      // Shield shatters shards on contact instead of hurting the player.
      for (let i = world.shards.length - 1; i >= 0; i--) {
        const s = world.shards[i];
        if (Math.hypot(s.x - p.x, s.y - p.y) < s.r + hitR) {
          world.burst(s.x, s.y, "#c084fc", 12, 180);
          world.shards.splice(i, 1);
        }
      }
    }

    const keepShields = [];
    for (const s of world.shields) {
      if (Math.hypot(s.x - p.x, s.y - p.y) < s.r + hitR) {
        p.shield = C.shieldTime;
        events.shield = true;
      } else keepShields.push(s);
    }
    world.shields = keepShields;

    return events;
  };

  world.reset = (rng) => {
    world.rng = rng || world.rng;
    world.orbs = [];
    world.shards = [];
    world.shields = [];
    world.particles = [];
    world.floats = [];
    world.level = 1;
    world.collected = 0;
    world.time = 0;
    world.shake = 0;
    world.orbTimer = 0.4;
    world.shardTimer = 1.2;
    world.shieldTimer = 6;
    const p = world.player;
    p.x = C.width / 2;
    p.y = C.height * 0.62;
    p.vx = 0;
    p.vy = 0;
    p.trail = [];
    p.dashTime = 0;
    p.dashCooldown = 0;
    p.shield = 0;
    p.invincible = 0;
  };

  return world;
}
