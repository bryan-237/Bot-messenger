const fs = require("fs");
const path = require("path");
const { execFile, spawn } = require("child_process");
const { createCanvas } = require("@napi-rs/canvas");
const L = require("../lib.js");
const F = require("../fonts.js");
const U = require("../utils.js");

const LANGS = ["fr", "en", "es", "de", "it", "pt", "ar", "ja", "ko", "ru", "tr", "zh"];
const S = 480, FPS = 25;
const ROOT = path.join(__dirname, "..");
const last = {};
let busy = false;
const run = (cmd, args, opts) => new Promise((res, rej) =>
  execFile(cmd, args, Object.assign({ timeout: 120000, maxBuffer: 64 * 1024 * 1024 }, opts), (e, out) => (e ? rej(e) : res(out))));

function chunks(t) {
  const out = [];
  let cur = "";
  for (const w of t.split(" ")) {
    if ((cur + " " + w).trim().length > 180) { out.push(cur.trim()); cur = w; } else cur += " " + w;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

async function tts(text, lang) {
  const bufs = [];
  for (const c of chunks(text)) {
    const r = await fetch("https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=" + lang + "&q=" + encodeURIComponent(c), { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10000) });
    const b = Buffer.from(await r.arrayBuffer());
    if (!r.ok || b.length < 500) throw new Error("TTS HTTP " + r.status);
    bufs.push(b);
  }
  return Buffer.concat(bufs);
}

async function getFace(api, event) {
  const att = event.messageReply && event.messageReply.attachments && event.messageReply.attachments.find((a) => a.type === "photo" || a.type === "animated_image");
  if (att && att.url) { const im = await L.loadUrl(att.url); if (im) return im; }
  const id = U.targetId(event) || String(event.senderID);
  const ui = await L.ask((cb) => api.getUserInfo(id, cb));
  return L.getAvatar(id, ui && ui[id] && ui[id].thumbSrc);
}

function envelope(pcm) {
  const per = 8000 / FPS, n = Math.floor(pcm.length / 2 / per);
  const raw = [];
  for (let f = 0; f < n; f++) {
    let sum = 0;
    for (let i = 0; i < per; i++) { const v = pcm.readInt16LE((f * per + i) * 2); sum += v * v; }
    raw.push(Math.sqrt(sum / per));
  }
  const max = Math.max(...raw, 1);
  let cur = 0;
  return raw.map((v) => { const t = Math.min(1, (v / max) * 1.3); cur = t > cur ? t : cur * 0.7 + t * 0.3; return cur; });
}

async function render(img, text, mp3, out) {
  const pcm = await run("ffmpeg", ["-v", "error", "-i", mp3, "-f", "s16le", "-ac", "1", "-ar", "8000", "-"], { encoding: "buffer" });
  const env = envelope(pcm);
  if (!env.length) throw new Error("audio vide");
  const base = createCanvas(S, S);
  L.cover(base.getContext("2d"), img, 0, 0, S, S);
  const cap = createCanvas(S, S);
  const cc = cap.getContext("2d");
  const g = cc.createLinearGradient(0, S * 0.62, 0, S);
  g.addColorStop(0, "rgba(10,5,30,0)");
  g.addColorStop(1, "rgba(10,5,30,0.85)");
  cc.fillStyle = g;
  cc.fillRect(0, S * 0.62, S, S * 0.38);
  cc.textAlign = "center";
  cc.fillStyle = "#ffffff";
  cc.font = "bold 22px sans-serif";
  U.wrap(cc, text, S - 50).slice(0, 4).forEach((l, i, a) => cc.fillText(l, S / 2, S - 20 - (a.length - 1 - i) * 28));
  const canvas = createCanvas(S, S);
  const ctx = canvas.getContext("2d");
  const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", S + "x" + S, "-r", String(FPS), "-i", "-", "-i", mp3, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-crf", "27", "-c:a", "aac", "-b:a", "96k", "-shortest", "-movflags", "+faststart", out]);
  let err = "";
  ff.stderr.on("data", (d) => { err += d; });
  const done = new Promise((res, rej) => {
    ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg " + c + " " + err.slice(0, 120)))));
    ff.on("error", rej);
  });
  ff.stdin.on("error", () => {});
  for (let f = 0; f < env.length; f++) {
    const a = env[f];
    ctx.fillStyle = "#0b0716";
    ctx.fillRect(0, 0, S, S);
    ctx.save();
    ctx.translate(S / 2, S / 2 + Math.sin(f * 0.35) * 5 * a);
    ctx.rotate(Math.sin(f * 0.18) * 0.012 * (0.3 + a));
    const sc = 1.1 + 0.04 * a;
    ctx.scale(sc, sc);
    ctx.drawImage(base, -S / 2, -S / 2);
    ctx.restore();
    ctx.drawImage(cap, 0, 0);
    for (let i = 0; i < 20; i++) {
      const h = 6 + 52 * a * (0.5 + 0.5 * Math.sin(i * 0.9 + f * 0.6));
      ctx.fillStyle = i % 2 ? "#a78bfa" : "#4cc9f0";
      ctx.fillRect(20 + i * 22, 300 - h, 12, h);
    }
    const d = ctx.getImageData(0, 0, S, S).data;
    const px = Buffer.from(d.buffer, d.byteOffset, d.byteLength);
    if (!ff.stdin.write(px)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await done;
}

module.exports = {
  name: "talk",
  run: async (api, event) => {
    const tid = String(event.threadID), uid = String(event.senderID);
    const t = U.args(event);
    let lang = "fr";
    if (t.length > 1 && LANGS.includes(t[0].toLowerCase())) lang = t.shift().toLowerCase();
    let text = t.join(" ").trim();
    const rb = event.messageReply && event.messageReply.body;
    if (!text && rb) text = String(rb).trim();
    text = text.replace(/\s+/g, " ").slice(0, 300);
    if (!text) return api.sendMessage(F.panel("💡", "Vidéo parlante", [F.b("Utilise") + " : .talk Bonjour tout le monde", F.bi("Photo") + " : celle de la personne mentionnée ou de ton message cité", F.bi("Langue") + " : .talk en hello"]), tid);
    if (busy) return api.sendMessage(F.panel("⏳", "Vidéo parlante", ["Une vidéo est déjà en cours, réessaie dans un instant."]), tid);
    const wait = 60000 - (Date.now() - (last[uid] || 0));
    if (wait > 0) return api.sendMessage("⏳ Patiente " + Math.ceil(wait / 1000) + " s avant une nouvelle vidéo.", tid);
    try { await run("ffmpeg", ["-version"]); }
    catch { return api.sendMessage(F.panel("❌", "Vidéo parlante", ["ffmpeg n'est pas installé.", F.bi("Installe-le") + " : sudo apt install -y ffmpeg"]), tid); }
    busy = true;
    last[uid] = Date.now();
    const base = path.join(ROOT, "tmp_talk_" + Date.now());
    try {
      api.sendMessage(F.panel("🎬", "Vidéo parlante", ["⏳ " + F.bi("Création en cours..."), "Cela peut prendre 20 à 60 secondes."]), tid);
      const img = await getFace(api, event);
      if (!img) throw new Error("photo introuvable");
      fs.writeFileSync(base + ".mp3", await tts(text, lang));
      await render(img, text, base + ".mp3", base + ".mp4");
      api.sendMessage(
        { body: "🗣️ " + F.bi("Voici ta vidéo parlante"), attachment: fs.createReadStream(base + ".mp4") },
        tid,
        () => { fs.unlink(base + ".mp3", () => {}); fs.unlink(base + ".mp4", () => {}); }
      );
    } catch (e) {
      console.error(e.message);
      fs.unlink(base + ".mp3", () => {});
      fs.unlink(base + ".mp4", () => {});
      api.sendMessage(F.panel("❌", "Vidéo parlante", ["Impossible de créer la vidéo.", F.bi("Réessaie avec un texte plus court.")]), tid);
    } finally {
      busy = false;
    }
  },
};
