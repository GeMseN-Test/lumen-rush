// config.js — all tuning numbers for Lumen Rush in one place.
// Change a number here and the whole game retunes; no magic numbers
// are scattered through the other modules.

export const CONFIG = {
  // Canvas
  width: 1280,
  height: 720,

  // Player orb
  playerRadius: 16,
  playerSpeed: 460,          // px per second (keyboard)
  playerFollow: 18,          // mouse-follow lerp strength
  playerTrail: 14,           // trail dots kept
  playerColor: "#aefcff",
  playerGlow: "#22d3ee",

  // Dash
  dashSpeed: 980,
  dashTime: 0.4,             // seconds of invulnerability while dashing
  dashCooldown: 2.0,         // seconds between dashes

  // Lives & scoring
  lives: 3,
  orbScore: 10,              // base points per lumen orb
  comboMax: 5,               // combo multiplier caps at x5
  comboWindow: 3.0,          // seconds to keep the combo alive
  levelEvery: 15,            // orbs collected per level up
  shieldTime: 5.0,           // seconds of shield protection

  // Spawning (per second, scaled by level)
  orbSpawn: 1.6,
  shardSpawn: 0.55,
  shieldSpawn: 0.09,
  maxOrbs: 18,
  maxShards: 16,

  // Entity motion
  orbFallMin: 55,
  orbFallMax: 130,
  orbRadius: 11,
  shardFallMin: 90,
  shardFallMax: 210,
  shardRadius: 17,
  shardSpin: 2.4,            // radians per second
  shieldFall: 70,
  shieldRadius: 14,

  // Difficulty ramp per level
  speedPerLevel: 0.09,       // +9% fall speed per level
  spawnPerLevel: 0.07,       // +7% spawn rate per level

  // Feel
  shakeOnHit: 14,            // px of screen shake when hit
  shakeDecay: 42,
  particleBurst: 16,         // particles per collect
  particleHit: 26,           // particles per hit
  floatTextLife: 0.9,        // seconds a "+10" floats

  // Background
  stars: [70, 45, 25],       // star counts per parallax layer
  starSpeed: [6, 14, 26],    // px/s drift per layer

  // Colours
  colors: {
    bgTop: "#050914",
    bgBottom: "#0b1030",
    nebulaA: "rgba(56, 89, 199, 0.20)",
    nebulaB: "rgba(124, 58, 237, 0.16)",
    nebulaC: "rgba(34, 211, 238, 0.10)",
    orbGold: "#ffd166",
    orbCore: "#fff7d6",
    shardBody: "#2a1445",
    shardEdge: "#e11d48",
    shieldCyan: "#22d3ee",
    text: "#eaf6ff",
    dim: "#8fb3d9",
    danger: "#fb7185",
    gold: "#ffd166",
  },
};
