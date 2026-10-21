const fs = require("fs");
const path = require("path");
const { createCanvas } = require("@napi-rs/canvas");
const L = require("./lib.js");
const FILE = path.join(__dirname, "membres.json");
const read = () => { try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return {}; } };

function drawCard(o) {
  const W = 1000, H = 560, cx = 500, cy = 285, r = 110;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, o.c1);
  bg.addColorStop(1, o.c2);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  if (o.bg) { L.cover(ctx, o.bg, 0, 0, W, H); ctx.fillStyle = "rgba(15,8,40,0.66)"; ctx.fillRect(0, 0, W, H); }
  L.stars(ctx, W, H, o.seed);
  const glow = ctx.createRadialGradient(cx, cy, 40, cx, cy, 260);
  glow.addColorStop(0, "rgba(167,139,250,0.35)");
  glow.addColorStop(1, "rgba(167,139,250,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 76px sans-serif";
  ctx.fillText(o.title, cx, 100);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (o.img) {
    L.cover(ctx, o.img, cx - r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = "#4c1d95";
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 110px sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(String(o.name || "?")[0].toUpperCase(), cx, cy);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#a78bfa";
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 46px sans-serif";
  ctx.fillText(o.line1, cx, 470);
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "30px sans-serif";
  ctx.fillText(o.line2, cx, 520);
  return canvas.toBuffer("image/png");
}

module.exports = async (api, event) => {
  if (event.type !== "event") return;
  const tid = event.threadID;
  const cfg = read()[tid] || {};
  const type = event.logMessageType;
  try {
    if (type === "log:subscribe" && cfg.welcome) {
      const added = (event.logMessageData && event.logMessageData.addedParticipants) || [];
      const info = await L.ask((cb) => api.getThreadInfo(tid, cb));
      const bg = info && info.imageSrc ? await L.loadUrl(info.imageSrc) : null;
      const ids = info ? info.participantIDs.map(String) : [];
      let count = ids.length;
      for (const u of added) {
        const id = String(u.userFbId);
        if (info && !ids.includes(id)) count++;
        const ui = await L.ask((cb) => api.getUserInfo(id, cb));
        const p = ui && ui[id];
        const name = L.short(L.clean(u.fullName || (p && p.name)) || "Membre");
        const img = await L.getAvatar(id, p && p.thumbSrc);
        const buf = drawCard({
          title: "BIENVENUE", name, img, bg, seed: 12345, c1: "#140a2d", c2: "#3b1d8f",
          line1: name + " a rejoint le groupe", line2: "Tu es le membre #" + count,
        });
        L.sendCard(api, tid, buf, "👋 Bienvenue " + name + " ! Tu es le membre #" + count);
      }
    }

    if (type === "log:unsubscribe" && (cfg.antiout || cfg.bye)) {
      const id = String(event.logMessageData.leftParticipantFbId);
      if (id === String(api.getCurrentUserID())) return;
      const kicked = String(event.author) !== id;
      const info = await L.ask((cb) => api.getThreadInfo(tid, cb));
      const bg = info && info.imageSrc ? await L.loadUrl(info.imageSrc) : null;
      const ui = await L.ask((cb) => api.getUserInfo(id, cb));
      const p = ui && ui[id];
      const name = L.short(L.clean(p && p.name) || "Membre");
      const img = await L.getAvatar(id, p && p.thumbSrc);
      if (cfg.antiout) {
        const ok = await new Promise((res) => api.addUserToGroup(id, tid, (err) => res(!err)));
        if (!ok) return api.sendMessage("⚠️ Impossible de rajouter " + name + " (il m'a peut-être bloqué).", tid);
        const buf = drawCard({
          title: "INTERDIT", name, img, bg, seed: 777, c1: "#2a0a14", c2: "#4c1d95",
          line1: name + " reste ici", line2: "Interdiction de sortir sans la permission de mon maître Bryan",
        });
        L.sendCard(api, tid, buf, "😈 " + name + " a été rajouté(e)");
        return api.sendMessage("😈 Interdiction de sortir sans la permission de mon maître Bryan", tid);
      }
      let count = info ? info.participantIDs.length : 0;
      if (info && info.participantIDs.map(String).includes(id)) count--;
      const buf = drawCard({
        title: "AU REVOIR", name, img, bg, seed: 54321, c1: "#0f0f1a", c2: "#2d1b69",
        line1: name + (kicked ? " a été retiré du groupe" : " a quitté le groupe"),
        line2: "Il reste " + count + " membres",
      });
      L.sendCard(api, tid, buf, "👋 Au revoir " + name + " • Il reste " + count + " membres");
    }
  } catch (e) { console.error(e); }
};
