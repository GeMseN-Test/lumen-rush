// audio.js — tiny WebAudio synth for Lumen Rush.
// No audio files: every sound is an oscillator + gain envelope built
// in code. AudioContext starts only after the first user gesture,
// so the browser never blocks it.

export function createAudio() {
  const audio = {
    ctx: null,
    muted: false,
    started: false,
  };

  audio.ensure = () => {
    if (!audio.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audio.ctx = new AC();
    }
    if (audio.ctx.state === "suspended") audio.ctx.resume();
    audio.started = true;
  };

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (!audio.ctx || audio.muted) return;
    const t0 = audio.ctx.currentTime + when;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(audio.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  audio.collect = (combo = 1) => {
    // Blip that climbs with the combo — collecting feels better in a streak.
    const base = 520 + Math.min(combo, 5) * 60;
    tone(base, 0.12, "sine", 0.22, 0, base * 1.6);
  };
  audio.hit = () => {
    tone(160, 0.35, "sawtooth", 0.25, 0, 55);
    tone(90, 0.3, "square", 0.14, 0, 45);
  };
  audio.levelUp = () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, "triangle", 0.2, i * 0.07));
  };
  audio.shield = () => {
    tone(440, 0.18, "sine", 0.2, 0, 880);
    tone(880, 0.22, "sine", 0.14, 0.1);
  };
  audio.dash = () => {
    tone(300, 0.14, "sine", 0.14, 0, 900);
  };
  audio.gameOver = () => {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.28, "triangle", 0.2, i * 0.16));
  };
  audio.start = () => {
    [262, 392, 523, 784].forEach((f, i) => tone(f, 0.14, "triangle", 0.18, i * 0.06));
  };

  audio.toggleMute = () => {
    audio.muted = !audio.muted;
    return audio.muted;
  };

  return audio;
}
