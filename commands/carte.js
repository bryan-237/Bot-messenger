const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const L = require("../lib.js");

const DIR = path.join(__dirname, "..", "cartes");
const Q = [
  ["nom", "Ton nom ?"],
  ["surnom", "Ton surnom ?"],
  ["naissance", "Date de naissance ? (24 / 12 / 2007)"],
  ["lieu", "Lieu de résidence ?"],
  ["anime", "Anime préféré ?"],
  ["manga", "Manga préféré ?"],
  ["jeux", "Jeux vidéo préférés ?"],
  ["statut", "Ton statut ?"],
  ["phrase", "Ta phrase favorite ?"],
];
const YS = [299, 357, 414, 470, 528, 585, 642, 703, 757];

global.carteEtat = global.carteEtat || {};

function fitText(ctx, txt, x, y, maxW, size, bold) {
  let s = size;
  do {
    ctx.font = (bold ? "bold " : "") + s + "px sans-serif";
    s -= 2;
  } while (ctx.measureText(txt).width > maxW && s > 12);
  ctx.fillText(txt, x, y);
}

async function draw(manga, d, photoBuf) {
  const bg = await loadImage(path.join(DIR, manga + ".png"));
  const canvas = createCanvas(bg.width, bg.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bg, 0, 0);

  // effacer anciennes valeurs + ancien nom
  ctx.fillStyle = "#121214"; ctx.fillRect(440, 280, 510, 565);
  ctx.fillStyle = "#0a0a0a"; ctx.fillRect(1000, 820, 400, 125);

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  Q.forEach(([k], i) => fitText(ctx, d[k] || "", 447, YS[i], 500, 28, true));

  ctx.textAlign = "center";
  ctx.fillStyle = "#dcdcdc";
  fitText(ctx, (d.nom || "").toUpperCase(), 1190, 880, 380, 80, true);

  // photo de l'utilisateur dans le cadre
  const p = await loadImage(photoBuf);
  ctx.save();
  ctx.beginPath(); ctx.rect(985, 32, 520, 750); ctx.clip();
  L.cover(ctx, p, 985, 32, 520, 750);
  ctx.restore();

  return canvas.toBuffer("image/png");
}

async function getBuf(url) {
  return Buffer.from((await axios.get(url, { responseType: "arraybuffer" })).data);
}

async function run(api, event) {
  const tid = event.threadID;
  const arg = (event.body || "").trim().split(/\s+/)[1];
  const manga = (arg || "naruto").toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!fs.existsSync(path.join(DIR, manga + ".png"))) {
    const dispo = fs.readdirSync(DIR).filter(f => f.endsWith(".png")).map(f => f.slice(0, -4));
    return api.sendMessage("❌ Manga indisponible. Choix : " + dispo.join(", "), tid);
  }
  global.carteEtat[tid + "_" + event.senderID] = { manga, etape: 0, data: {} };
  api.sendMessage("🪪 Carte " + manga + " ! (tape « annuler » pour arrêter)\n" + Q[0][1], tid);
}

// appelée pour chaque message : gère les réponses de l'utilisateur
async function handle(api, event) {
  if (event.type !== "message" && event.type !== "message_reply") return;
  const tid = event.threadID;
  const key = tid + "_" + event.senderID;
  const s = global.carteEtat[key];
  if (!s) return;
  const body = (event.body || "").trim();
  if (body.startsWith(".")) return;
  if (body.toLowerCase() === "annuler") {
    delete global.carteEtat[key];
    return api.sendMessage("❎ Carte annulée.", tid);
  }

  // questions
  if (s.etape < Q.length) {
    if (!body) return;
    s.data[Q[s.etape][0]] = body;
    s.etape++;
    if (s.etape < Q.length) return api.sendMessage("➡️ " + Q[s.etape][1], tid);
    return api.sendMessage("📸 Envoie ta photo (visage bien visible), ou tape « profil » pour utiliser ta photo de profil.", tid);
  }

  // photo
  try {
    let url;
    const att = (event.attachments || []).find(a => a.type === "photo");
    if (att) url = att.url || att.largePreviewUrl;
    else if (body.toLowerCase() === "profil") {
      const info = await new Promise(r => api.getUserInfo(event.senderID, (e, i) => r(i && i[event.senderID])));
      url = info && info.thumbSrc;
    }
    if (!url) return api.sendMessage("📸 Envoie une photo, ou tape « profil ».", tid);

    delete global.carteEtat[key];
    api.sendMessage("⏳ Création de ta carte...", tid);
    const buf = await draw(s.manga, s.data, await getBuf(url));
    await L.sendCard(api, tid, buf, "🪪 Voici ta carte " + s.manga + " !");
  } catch (e) {
    console.error("carte:", e.message);
    api.sendMessage("❌ Erreur pendant la création de la carte.", tid);
  }
}

module.exports = { name: "carte", run, handle };
