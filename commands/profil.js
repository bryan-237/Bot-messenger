const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { loadImage } = require("@napi-rs/canvas");
const eco = require("../eco.js");
const L = require("../lib.js");
const C = require("../cards.js");

const FILE = path.join(__dirname, "..", "niveaux.json");
const data = () => (global.__levels && global.__levels.cache) || (() => { try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return {}; } })();
const levelOf = (exp) => Math.floor(Math.sqrt(exp / 3));
const needFor = (lvl) => 3 * lvl * lvl;
const TITRES = { ninja: "🥷 Ninja", samourai: "⚔️ Samouraï", shogun: "👑 Shogun", hokage: "🔥 Hokage" };
const last = {};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

module.exports = { name: "profil", run: async (api, event) => {
  const tid = event.threadID, me = String(event.senderID);
  if (Date.now() - (last[me] || 0) < 5000) return;
  last[me] = Date.now();

  const cible = String(Object.keys(event.mentions || {})[0] || (event.messageReply && event.messageReply.senderID) || me);
  const d = data()[tid] || {};
  const st = d[cible] || { msgs: 0, exp: 0 };
  const lvl = levelOf(st.exp);
  const from = needFor(lvl), to = needFor(lvl + 1);
  const pct = Math.min(1, (st.exp - from) / (to - from || 1));
  const rang = Object.entries(d).sort((a, b) => b[1].exp - a[1].exp).findIndex((x) => x[0] === cible) + 1;
  const u = eco.get(cible);

  const ui = await L.ask((cb) => api.getUserInfo(cible, cb));
  const info = (ui && ui[cible]) || {};
  const nom = L.short(L.clean(info.name || "Joueur"), 22);

  let photo = null;
  try {
    if (info.thumbSrc) photo = await loadImage(Buffer.from((await axios.get(info.thumbSrc, { responseType: "arraybuffer" })).data));
  } catch {}

  const W = 1000, H = 600;
  const { canvas, ctx } = C.base(W, H, "#0f0f1a", "#3b1d8f", photo, 77);

  // avatar
  ctx.save(); ctx.beginPath(); ctx.arc(170, 200, 110, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
  if (photo) L.cover(ctx, photo, 60, 90, 220, 220);
  else { ctx.fillStyle = "#4c1d95"; ctx.fillRect(60, 90, 220, 220); }
  ctx.restore();
  ctx.lineWidth = 8; ctx.strokeStyle = "#a78bfa";
  ctx.beginPath(); ctx.arc(170, 200, 116, 0, Math.PI * 2); ctx.stroke();

  // textes
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 54px sans-serif"; ctx.fillText(nom, 330, 150);
  ctx.fillStyle = "#f5c542"; ctx.font = "bold 34px sans-serif";
  ctx.fillText(TITRES[u.titre] || "Débutant", 330, 200);
  ctx.fillStyle = "#c4b5fd"; ctx.font = "30px sans-serif";
  ctx.fillText("Niveau " + lvl + "   •   Rang #" + (rang || "-"), 330, 250);

  // barre d'expérience
  rr(ctx, 330, 275, 620, 34, 17); ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fill();
  if (pct > 0) { rr(ctx, 330, 275, Math.max(34, 620 * pct), 34, 17); ctx.fillStyle = "#a78bfa"; ctx.fill(); }
  ctx.fillStyle = "#e9e5ff"; ctx.font = "22px sans-serif";
  ctx.fillText("EXP " + st.exp + " / " + to, 345, 300);

  // cases stats
  const box = [
    ["💬 Messages", C.fmt(st.msgs)],
    ["💰 Portefeuille", C.fmt(u.coins || 0)],
    ["🏦 Banque", C.fmt(u.bank || 0)],
  ];
  box.forEach((b, i) => {
    const x = 60 + i * 300;
    rr(ctx, x, 380, 270, 130, 20); ctx.fillStyle = "rgba(255,255,255,0.1)"; ctx.fill();
    ctx.fillStyle = "#c4b5fd"; ctx.font = "26px sans-serif"; ctx.fillText(b[0], x + 20, 425);
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 46px sans-serif"; ctx.fillText(b[1], x + 20, 485);
  });

  ctx.fillStyle = "#8b7fc7"; ctx.font = "20px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("BRYAN BOT", 500, 570);

  await L.sendCard(api, tid, canvas.toBuffer("image/png"), "🪪 Profil de " + nom);
}};
