// render.js — everything drawn on the canvas: the night sky, the
// glowing player orb, lumen orbs, void shards, particles, the HUD
// and the title / pause / game-over screens. No game logic lives
// here; it only paints the state main.js hands it.

import { CONFIG as C } from "./config.js";

export function createRenderer(ctx) {
  const R = {};

  function circle(x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  R.drawBackground = (world) => {
    const g = ctx.createLinearGradient(0, 0, 0, C.height);
    g.addColorStop(0, C.colors.bgTop);
    g.addColorStop(1, C.colors.bgBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, C.width, C.height);

    // Soft nebula blobs, fixed in place so shots stay stable.
    const blobs = [
      [300, 180, 320, C.colors.nebulaA],
      [1020, 420, 380, C.colors.nebulaB],
      [760, 120, 240, C.colors.nebulaC],
    ];
    for (const [x, y, r, color] of blobs) {
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, color);
      rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    for (const s of world.stars) {
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(s.twinkle));
      ctx.globalAlpha = tw * (0.35 + s.layer * 0.22);
      circle(s.x, s.y, s.size, "#dbeafe");
    }
    ctx.globalAlpha = 1;
  };

  R.drawPlayer = (world) => {
    const p = world.player;
    // Comet trail, fading behind the orb.
    for (let i = p.trail.length - 1; i >= 1; i--) {
      const t = p.trail[i];
      const f = 1 - i / p.trail.length;
      ctx.globalAlpha = f * 0.45;
      circle(t.x, t.y, p.r * f * 0.9, C.playerGlow);
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.shadowBlur = 28;
    ctx.shadowColor = C.playerGlow;
    circle(p.x, p.y, p.r, C.playerColor);
    ctx.shadowBlur = 0;
    circle(p.x, p.y, p.r * 0.55, "#ffffff");
    ctx.restore();

    if (p.shield > 0) {
      ctx.save();
      ctx.globalAlpha = 0.55 + 0.25 * Math.sin(world.time * 6);
      ctx.strokeStyle = C.colors.shieldCyan;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (p.dashTime > 0) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  };

  R.drawEntities = (world) => {
    for (const o of world.orbs) {
      const pulse = 1 + 0.18 * Math.sin(world.time * o.pulse + o.phase);
      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = C.colors.orbGold;
      circle(o.x, o.y, o.r * pulse, C.colors.orbGold);
      ctx.shadowBlur = 0;
      circle(o.x, o.y, o.r * 0.5 * pulse, C.colors.orbCore);
      ctx.restore();
    }

    for (const s of world.shards) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.shadowBlur = 12;
      ctx.shadowColor = C.colors.shardEdge;
      ctx.fillStyle = C.colors.shardBody;
      ctx.strokeStyle = C.colors.shardEdge;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * s.r;
        const py = Math.sin(a) * s.r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.shadowBlur = 0;
      circle(s.x, s.y, 4, "#fda4af");
      ctx.restore();
    }

    for (const s of world.shields) {
      const pulse = 1 + 0.15 * Math.sin(world.time * 4 + s.phase);
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = C.colors.shieldCyan;
      ctx.strokeStyle = C.colors.shieldCyan;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(34, 211, 238, 0.25)";
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ecfeff";
      ctx.font = "bold 16px 'Segoe UI', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("S", s.x, s.y + 1);
      ctx.restore();
    }

    for (const pt of world.particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      circle(pt.x, pt.y, pt.size, pt.color);
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const f of world.floats) {
      ctx.globalAlpha = Math.max(0, f.life / C.floatTextLife);
      ctx.font = "bold 22px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  };

  function bar(x, y, w, h, frac, color, bg = "rgba(255,255,255,0.15)") {
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  }

  R.drawHud = (state) => {
    const { score, combo, lives, level, collected, world } = state;
    ctx.textBaseline = "alphabetic";

    ctx.textAlign = "left";
    ctx.fillStyle = C.colors.text;
    ctx.font = "bold 34px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(String(score).padStart(6, "0"), 24, 48);
    ctx.font = "bold 20px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = combo > 1 ? C.colors.gold : C.colors.dim;
    ctx.fillText(combo > 1 ? `COMBO x${combo}` : "COMBO x1", 24, 78);

    // Lives as hearts, top right.
    ctx.textAlign = "right";
    ctx.font = "28px 'Segoe UI', system-ui, sans-serif";
    let hearts = "";
    for (let i = 0; i < C.lives; i++) hearts += i < lives ? "♥ " : "♡ ";
    ctx.fillStyle = "#fb7185";
    ctx.fillText(hearts.trim(), C.width - 24, 46);

    // Level + progress, top centre.
    ctx.textAlign = "center";
    ctx.fillStyle = C.colors.text;
    ctx.font = "bold 20px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(`LEVEL ${level}`, C.width / 2, 34);
    bar(C.width / 2 - 90, 44, 180, 8, (collected % C.levelEvery) / C.levelEvery, C.colors.shieldCyan);

    // Shield timer bar under the level bar.
    if (world.player.shield > 0) {
      ctx.fillStyle = C.colors.shieldCyan;
      ctx.font = "bold 15px 'Segoe UI', system-ui, sans-serif";
      ctx.fillText(`SHIELD ${Math.ceil(world.player.shield)}s`, C.width / 2, 76);
      bar(C.width / 2 - 60, 82, 120, 6, world.player.shield / C.shieldTime, C.colors.shieldCyan);
    }

    // Dash cooldown bar, bottom centre.
    const p = world.player;
    const ready = p.dashCooldown <= 0;
    ctx.fillStyle = ready ? "#a5f3fc" : C.colors.dim;
    ctx.font = "bold 14px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(ready ? "DASH READY  [Space / Click]" : "DASH...", C.width / 2, C.height - 28);
    bar(C.width / 2 - 70, C.height - 20, 140, 6,
      ready ? 1 : 1 - p.dashCooldown / C.dashCooldown,
      ready ? "#22d3ee" : "#64748b");
  };

  R.drawBanner = (text, sub, color) => {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 24;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.font = "bold 54px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(text, C.width / 2, C.height / 2 - 30);
    ctx.shadowBlur = 0;
    if (sub) {
      ctx.fillStyle = C.colors.text;
      ctx.font = "22px 'Segoe UI', system-ui, sans-serif";
      ctx.fillText(sub, C.width / 2, C.height / 2 + 18);
    }
    ctx.restore();
  };

  R.drawTitle = (best) => {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 32;
    ctx.shadowColor = C.playerGlow;
    ctx.fillStyle = "#e0faff";
    ctx.font = "bold 92px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText("LUMEN RUSH", C.width / 2, 210);
    ctx.shadowBlur = 0;
    ctx.fillStyle = C.colors.gold;
    ctx.font = "bold 24px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText("✦  Kumpulkan cahaya. Hindari kehampaan.  ✦", C.width / 2, 272);

    ctx.fillStyle = C.colors.text;
    ctx.font = "20px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText("Gerakkan orb dengan mouse atau panah / WASD", C.width / 2, 350);
    ctx.fillText("Spasi / klik = dash  •  P = jeda  •  M = bisu", C.width / 2, 382);
    ctx.fillText("Kumpulkan orb emas, hindari shard ungu, rebut perisai cyan", C.width / 2, 414);

    if (best > 0) {
      ctx.fillStyle = C.colors.gold;
      ctx.font = "bold 22px 'Segoe UI', system-ui, sans-serif";
      ctx.fillText(`SKOR TERBAIK: ${best}`, C.width / 2, 505);
    }

    const blink = 0.6 + 0.4 * Math.sin(Date.now() / 350);
    ctx.globalAlpha = blink;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText("Klik atau tekan Enter untuk main", C.width / 2, 550);
    ctx.restore();
  };

  R.drawPaused = () => {
    ctx.fillStyle = "rgba(3, 7, 18, 0.62)";
    ctx.fillRect(0, 0, C.width, C.height);
    R.drawBanner("JEDA", "Tekan P untuk lanjut", "#a5f3fc");
  };

  R.drawGameOver = (score, best, isNewBest) => {
    ctx.fillStyle = "rgba(3, 7, 18, 0.66)";
    ctx.fillRect(0, 0, C.width, C.height);
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 26;
    ctx.shadowColor = "#e11d48";
    ctx.fillStyle = "#fecdd3";
    ctx.font = "bold 72px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText("GAME OVER", C.width / 2, 210);
    ctx.shadowBlur = 0;
    if (isNewBest) {
      ctx.fillStyle = C.colors.gold;
      ctx.font = "bold 30px 'Segoe UI', system-ui, sans-serif";
      ctx.fillText("★ NEW BEST! ★", C.width / 2, 282);
    }
    ctx.fillStyle = C.colors.text;
    ctx.font = "bold 44px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(`SKOR: ${score}`, C.width / 2, 350);
    ctx.font = "22px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = C.colors.dim;
    ctx.fillText(`Skor terbaik: ${best}`, C.width / 2, 396);
    const blink = 0.6 + 0.4 * Math.sin(Date.now() / 350);
    ctx.globalAlpha = blink;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText("Tekan R atau klik untuk main lagi", C.width / 2, 480);
    ctx.restore();
  };

  return R;
}
