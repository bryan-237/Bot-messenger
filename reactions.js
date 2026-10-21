const fs = require("fs");
const path = require("path");
const { createCanvas } = require("@napi-rs/canvas");
const L = require("./lib.js");

const PREFIX = ".";
const OWNER = "Bryan";
const EMO = { start: "🤖", ok: "✅", err: "❌" };
const BUILTIN = ["menu", "ping", "heure", "list", "reload", "install", "remove"];
const CMD_DIR = path.join(__dirname, "commands");
const ctxByThread = {};
const lastPrefix = {};

function commandNames() {
  try { return fs.readdirSync(CMD_DIR).filter((f) => f.endsWith(".js")).map((f) => f.slice(0, -3).toLowerCase()); } catch { return []; }
}

function react(api, emoji, messageID, threadID) {
  try { api.setMessageReaction(emoji, messageID, threadID, () => {}, true); } catch {}
}

function patch(api) {
  if (api.__replyPatched) return;
  api.__replyPatched = true;
  const orig = api.sendMessage.bind(api);
  api.sendMessage = function (msg, threadID, cb, replyID, isGroup) {
    const key = String(threadID);
    const c = ctxByThread[key];
    if (c && Date.now() - c.t < 45000 && !replyID) {
      delete ctxByThread[key];
      const text = typeof msg === "string" ? msg : (msg && msg.body) || "";
      react(api, /^(❌|⛔|⚠️)/.test(text) ? EMO.err : EMO.ok, c.id, key);
      return orig(msg, threadID, typeof cb === "function" ? cb : () => {}, c.id, isGroup);
    }
    return orig(msg, threadID, cb, replyID, isGroup);
  };
}

function run(api, event) {
  if (event.type !== "message" && event.type !== "message_reply") return;
  const body = (event.body || "").trim();
  if (!body || String(event.senderID) === String(api.getCurrentUserID())) return;
  patch(api);
  try { require("./games.js").onMessage(api, event); } catch (e) { console.error(e); }
  try { const lv = require("./levels.js").add(String(event.threadID), String(event.senderID)); if (lv) setTimeout(() => require("./levels.js").announce(api, event, lv).catch((e) => console.error(e)), 2500); } catch (e) { console.error(e); }
  const tid = String(event.threadID);
  if (body.startsWith(PREFIX)) {
    const name = body.slice(PREFIX.length).split(/\s+/)[0].toLowerCase();
    if (BUILTIN.includes(name) || commandNames().includes(name)) {
      ctxByThread[tid] = { id: event.messageID, t: Date.now() };
      react(api, EMO.start, event.messageID, tid);
    }
    return;
  }
  if (/^pr[ée]fixe?$/i.test(body)) sendPrefixCard(api, event);
}

const NAMES = { ".": "le point", "!": "le point d'exclamation", "/": "la barre oblique", "-": "le tiret", "#": "le dièse" };

function drawPrefix(n) {
  const W = 1000, H = 700, cx = 500, cy = 270, r = 100;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#140a2d");
  bg.addColorStop(1, "#3b1d8f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  L.stars(ctx, W, H, 909);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 76px sans-serif";
  ctx.fillText("PRÉFIXE", cx, 105);
  ctx.fillStyle = "#4c1d95";
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#a78bfa";
  ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#ffffff";
  if (PREFIX === ".") {
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.font = "bold 120px sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(PREFIX, cx, cy);
    ctx.textBaseline = "alphabetic";
  }
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "34px sans-serif";
  ctx.fillText("Mon préfixe est " + (NAMES[PREFIX] || "« " + PREFIX + " »"), cx, 440);
  const chips = [PREFIX + "list  menu", PREFIX + "ia  question", PREFIX + "groupe  infos"];
  ctx.font = "28px sans-serif";
  const widths = chips.map((c) => ctx.measureText(c).width + 40);
  const gap = 20;
  let x = (W - (widths.reduce((a, b) => a + b, 0) + gap * 2)) / 2;
  chips.forEach((c, i) => {
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    L.rrect(ctx, x, 480, widths[i], 56, 22);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(c, x + widths[i] / 2, 518);
    x += widths[i] + gap;
  });
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "28px sans-serif";
  ctx.fillText("Maître : " + OWNER + "  •  " + n + " commandes", cx, 610);
  ctx.font = "22px sans-serif";
  ctx.fillText("BRYAN BOT", cx, 655);
  return canvas.toBuffer("image/png");
}

function sendPrefixCard(api, event) {
  const tid = String(event.threadID);
  if (Date.now() - (lastPrefix[tid] || 0) < 8000) return;
  lastPrefix[tid] = Date.now();
  ctxByThread[tid] = { id: event.messageID, t: Date.now() };
  react(api, EMO.start, event.messageID, tid);
  L.sendCard(api, event.threadID, drawPrefix(commandNames().length), "Mon préfixe est : " + PREFIX);
}

module.exports = (api, event) => {
  try { run(api, event); } catch (e) { console.error(e); }
};
