# Lumen Rush

[![make.fun bounty](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/GeMseN-Test/lumen-rush/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/GeMseN-Test/lumen-rush/reward.svg)](https://make.fun/bounty/best-game-01)

**Lumen Rush** is a neon arcade game: you steer a little comet of light
through a starry night sky. Collect golden lumen orbs to score and build
your combo, dodge the spinning purple void shards, and grab the cyan
shield when you need a breather. The longer you survive, the faster it
gets — a level up every 15 orbs. Three lives. Beat your best score.

## How to play

- **Mouse** — the orb follows your cursor, **or Arrow keys / WASD** to fly.
- **Space or click** — dash: a quick burst that makes you invulnerable
  for 0.4s (2s cooldown, watch the bar at the bottom).
- **P** — pause. **M** — mute. **R** — restart from the game-over screen.
- **Enter / click** — start.

Scoring: each orb is worth 10 points times your combo (x1–x5). Keep
collecting within 3 seconds to grow the combo. A shield power-up makes
you invulnerable for 5 seconds and shatters shards on contact.

## Run it locally

```sh
node serve.ts
# open http://localhost:8080/
```

No build step, no network, no external files — plain HTML + canvas +
vanilla JavaScript, with WebAudio synth sounds (no audio files).

## Layout

- `game/index.html` — canvas + entry point
- `game/src/config.js` — all tuning numbers
- `game/src/random.js` — seeded PRNG (deterministic screenshots)
- `game/src/input.js` — keyboard + mouse + dash
- `game/src/audio.js` — WebAudio synth SFX
- `game/src/world.js` — entities, spawning, collisions, levels
- `game/src/render.js` — canvas drawing, HUD, all screens
- `game/src/main.js` — game loop + state machine + scoring
- `main.ts` — builds the make.fun dossier (`MAKEFUN_OUTPUT_DIR=out node main.ts`)
- `tools/shots.mjs` — takes the screenshots in `shots.json`

Built for the [make.fun best-game-01 bounty](https://make.fun/bounty/best-game-01).
MIT licensed.
