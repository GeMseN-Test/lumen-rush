// random.js — a tiny seeded PRNG (mulberry32) plus helpers.
// Screenshots use a fixed seed so the same layout renders every time;
// live play seeds from the clock. Nothing here touches Math.random,
// so a seeded run is fully deterministic.

export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function range(rng, min, max) {
  return min + rng() * (max - min);
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

export function chance(rng, p) {
  return rng() < p;
}

// Seed from the URL (?seed=7) or from the clock for live play.
export function seedFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("seed");
  if (raw !== null) {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n)) return n >>> 0;
  }
  return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
}
