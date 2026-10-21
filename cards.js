const { createCanvas } = require("@napi-rs/canvas");
const L = require("./lib.js");

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

function base(W, H, c1, c2, img, seed) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  if (img) {
    const small = createCanvas(32, 32);
    L.cover(small.getContext("2d"), img, 0, 0, 32, 32);
    ctx.drawImage(small, 0, 0, W, H);
    ctx.fillStyle = "rgba(15,8,40,0.62)";
    ctx.fillRect(0, 0, W, H);
  }
  L.stars(ctx, W, H, seed || 99);
  return { canvas, ctx };
}

function avatar(ctx, img, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (img) L.cover(ctx, img, cx - r, cy - r, r * 2, r * 2);
  else { ctx.fillStyle = "#4c1d95"; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); }
  ctx.restore();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#a78bfa";
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.stroke();
}

function fit(ctx, text, maxW, size, weight) {
  let s = size;
  ctx.font = weight + " " + s + "px sans-serif";
  while (ctx.measureText(text).width > maxW && s > 20) { s -= 2; ctx.font = weight + " " + s + "px sans-serif"; }
}

function profile(o) {
  const W = 1000, H = 560;
  const { canvas, ctx } = base(W, H, "#140a2d", "#3b1d8f", o.img, 2024);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  L.rrect(ctx, 400, 90, 560, 380, 26);
  ctx.fill();
  avatar(ctx, o.img, 230, 280, 130);
  ctx.textAlign = "left";
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "22px sans-serif";
  ctx.fillText(o.title, 430, 145);
  ctx.fillStyle = "#ffffff";
  fit(ctx, o.name, 500, 46, "bold");
  ctx.fillText(o.name, 430, 215);
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "22px sans-serif";
  ctx.fillText(o.label, 430, 295);
  ctx.fillStyle = o.color || "#ffffff";
  fit(ctx, o.big, 500, 60, "bold");
  ctx.fillText(o.big, 430, 365);
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "22px sans-serif";
  ctx.fillText(o.sub, 430, 430);
  return canvas.toBuffer("image/png");
}

function symbol(ctx, k, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s / 100, s / 100);
  if (k === 0) {
    ctx.strokeStyle = "#2f7d32";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-20, 10); ctx.quadraticCurveTo(-10, -30, 15, -45);
    ctx.moveTo(22, 20); ctx.quadraticCurveTo(25, -20, 15, -45);
    ctx.stroke();
    ctx.fillStyle = "#d62828";
    ctx.beginPath(); ctx.arc(-22, 25, 24, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(24, 30, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath(); ctx.arc(-30, 17, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(16, 22, 6, 0, Math.PI * 2); ctx.fill();
  } else if (k === 1) {
    ctx.fillStyle = "#ffd60a";
    ctx.beginPath(); ctx.ellipse(0, 5, 45, 32, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2f7d32";
    ctx.beginPath(); ctx.ellipse(38, -22, 16, 8, 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath(); ctx.ellipse(-12, -6, 14, 7, -0.5, 0, Math.PI * 2); ctx.fill();
  } else if (k === 2) {
    ctx.fillStyle = "#f5b301";
    ctx.beginPath(); ctx.moveTo(-42, 32); ctx.quadraticCurveTo(-42, -40, 0, -40); ctx.quadraticCurveTo(42, -40, 42, 32); ctx.closePath(); ctx.fill();
    ctx.fillRect(-52, 30, 104, 14);
    ctx.beginPath(); ctx.arc(0, 56, 10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -46, 8, 0, Math.PI * 2); ctx.fill();
  } else if (k === 3) {
    ctx.fillStyle = "#ffd60a";
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? 22 : 50;
      ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
  } else if (k === 4) {
    ctx.fillStyle = "#4cc9f0";
    ctx.beginPath(); ctx.moveTo(-40, -15); ctx.lineTo(-20, -42); ctx.lineTo(20, -42); ctx.lineTo(40, -15); ctx.lineTo(0, 45); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-40, -15); ctx.lineTo(40, -15);
    ctx.moveTo(-20, -42); ctx.lineTo(-8, -15); ctx.lineTo(0, 45);
    ctx.moveTo(20, -42); ctx.lineTo(8, -15); ctx.lineTo(0, 45);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#e63946";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 6;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 110px serif";
    ctx.strokeText("7", 0, 6);
    ctx.fillText("7", 0, 6);
  }
  ctx.restore();
}

function die(ctx, x, y, s, v, color) {
  ctx.fillStyle = color || "#fdf6e3";
  L.rrect(ctx, x, y, s, s, s * 0.16);
  ctx.fill();
  ctx.strokeStyle = "#3b1d8f";
  ctx.lineWidth = 6;
  ctx.stroke();
  const P = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
  ctx.fillStyle = "#1a0b3d";
  P[v].forEach(([i, j]) => {
    ctx.beginPath();
    ctx.arc(x + s * (0.25 + 0.25 * i), y + s * (0.25 + 0.25 * j), s * 0.075, 0, Math.PI * 2);
    ctx.fill();
  });
}

function coin(ctx, cx, cy, r, side) {
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  g.addColorStop(0, "#fff3b0");
  g.addColorStop(1, "#d4a017");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#a47500";
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#7a5200";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold " + Math.round(r * 0.5) + "px serif";
  ctx.fillText(side === "pile" ? "PILE" : "FACE", cx, cy);
  ctx.textBaseline = "alphabetic";
}

module.exports = { fmt, base, avatar, profile, symbol, die, coin };

function suit(ctx, k, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s / 100, s / 100);
  ctx.fillStyle = k < 2 ? "#d62828" : "#1a1a2e";
  ctx.beginPath();
  if (k === 0) {
    ctx.moveTo(0, 45); ctx.bezierCurveTo(-70, 0, -50, -50, 0, -18); ctx.bezierCurveTo(50, -50, 70, 0, 0, 45);
  } else if (k === 1) {
    ctx.moveTo(0, -48); ctx.lineTo(34, 0); ctx.lineTo(0, 48); ctx.lineTo(-34, 0); ctx.closePath();
  } else if (k === 2) {
    ctx.moveTo(0, -48); ctx.bezierCurveTo(-72, 5, -48, 52, 0, 26); ctx.bezierCurveTo(48, 52, 72, 5, 0, -48);
  } else {
    ctx.arc(0, -22, 21, 0, Math.PI * 2);
    ctx.moveTo(-2, 14); ctx.arc(-23, 14, 21, 0, Math.PI * 2);
    ctx.moveTo(44, 14); ctx.arc(23, 14, 21, 0, Math.PI * 2);
  }
  ctx.fill();
  if (k >= 2) {
    ctx.beginPath();
    ctx.moveTo(-7, 20); ctx.lineTo(-16, 50); ctx.lineTo(16, 50); ctx.lineTo(7, 20);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function playingCard(ctx, x, y, w, h, rank, k) {
  ctx.fillStyle = "#fdf6e3";
  L.rrect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#3b1d8f";
  ctx.stroke();
  const lab = { 1: "A", 11: "J", 12: "Q", 13: "K" }[rank] || String(rank);
  ctx.fillStyle = k < 2 ? "#d62828" : "#1a1a2e";
  ctx.font = "bold " + Math.round(h * 0.17) + "px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(lab, x + 12, y + h * 0.2);
  suit(ctx, k, x + w * 0.5, y + h * 0.58, w * 0.55);
}

async function whoCard(api, id, o) {
  const ui = await L.ask((cb) => api.getUserInfo(id, cb));
  const p = ui && ui[id];
  const name = L.short(L.clean(p && p.name) || "Utilisateur", 40);
  const img = await L.getAvatar(id, p && p.thumbSrc);
  return { name, buf: profile(Object.assign({ img, name }, o)) };
}

Object.assign(module.exports, { suit, playingCard, whoCard });
