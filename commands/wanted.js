const { createCanvas } = require("@napi-rs/canvas");
const L = require("../lib.js");

const CRIMES = [
  "A volé la dernière part de pizza",
  "A spoilé la fin de la série",
  "Spam de stickers à trois heures du matin",
  "A laissé le groupe en vu pendant trois jours",
  "A envoyé un vocal de huit minutes",
  "A dit « j'arrive » il y a deux heures",
  "Trafic illégal de mèmes périmés",
  "A mangé le dernier chocolat sans demander",
  "A renommé le groupe sans prévenir",
  "A raconté la même blague trois fois",
  "Contrebande de chips au fromage",
  "Tricherie aux jeux de société",
  "A répondu « lol » à une très longue histoire",
  "A volé des frites après avoir dit « j'ai pas faim »",
  "A cassé la télécommande, puis a tout nié",
  "A mis de l'ananas sur la pizza",
  "Disparu après avoir dit « j'ai deux minutes »",
  "A pris la meilleure place du canapé",
  "A chanté faux dans un vocal",
  "A lu le message sans jamais répondre",
  "A ronflé pendant le film",
];
let last = -1;

function wrap(ctx, text, maxW) {
  const lines = [];
  let cur = "";
  for (const w of text.split(" ")) {
    const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
const money = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

function drawPoster(o) {
  const canvas = createCanvas(840, 1560);
  const ctx = canvas.getContext("2d");
  ctx.scale(3, 3);
  ctx.translate(-50, -20);
  ctx.fillStyle = "#E8D5A8";
  ctx.fillRect(50, 20, 280, 520);
  ctx.strokeStyle = "#3B2412";
  ctx.lineWidth = 3;
  ctx.strokeRect(51.5, 21.5, 277, 517);
  ctx.strokeStyle = "#8B6B3E";
  ctx.lineWidth = 1;
  ctx.strokeRect(58, 28, 264, 504);
  ctx.fillStyle = "#5B3A1E";
  [[70, 40], [310, 40], [70, 520], [310, 520]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); });
  ctx.textAlign = "center";
  const txt = (s, y, size, color, style) => { ctx.fillStyle = color; ctx.font = (style || "") + " " + size + "px serif"; ctx.fillText(s, 190, y); };
  txt("WANTED", 82, 42, "#3B2412", "bold");
  txt("AVIS DE RECHERCHE", 104, 12, "#5B3A1E");
  ctx.fillStyle = "#C9B27C";
  ctx.fillRect(100, 120, 180, 170);
  if (o.img) {
    L.cover(ctx, o.img, 100, 120, 180, 170);
    ctx.fillStyle = "rgba(200,165,100,0.28)";
    ctx.fillRect(100, 120, 180, 170);
  } else {
    ctx.fillStyle = "#7A5C33";
    ctx.beginPath(); ctx.arc(190, 195, 30, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(122, 290); ctx.quadraticCurveTo(122, 238, 190, 238); ctx.quadraticCurveTo(258, 238, 258, 290); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = "#3B2412";
  ctx.lineWidth = 3;
  ctx.strokeRect(100, 120, 180, 170);
  txt("VIVANT OU MORT", 318, 18, "#3B2412", "bold");
  let size = 32;
  ctx.font = "bold " + size + "px serif";
  while (ctx.measureText(o.name).width > 232 && size > 14) { size -= 2; ctx.font = "bold " + size + "px serif"; }
  txt(o.name, 358, size, "#3B2412", "bold");
  txt("CRIME", 392, 12, "#5B3A1E");
  ctx.font = "italic 14px serif";
  wrap(ctx, o.crime, 232).slice(0, 2).forEach((l, i) => txt(l, 412 + i * 18, 14, "#3B2412", "italic"));
  ctx.strokeStyle = "#8B6B3E";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(110, 452); ctx.lineTo(270, 452); ctx.stroke();
  txt("RÉCOMPENSE", 470, 12, "#5B3A1E");
  txt(o.prize, 500, 28, "#7A1F1F", "bold");
  txt("BRYAN BOT", 524, 11, "#5B3A1E");
  return canvas.toBuffer("image/png");
}

module.exports = {
  name: "wanted",
  run: async (api, event) => {
    const tid = event.threadID;
    let id = String(event.senderID);
    if (event.messageReply && event.messageReply.senderID) id = String(event.messageReply.senderID);
    else if (event.mentions && Object.keys(event.mentions).length) id = Object.keys(event.mentions)[0];
    try {
      const ui = await L.ask((cb) => api.getUserInfo(id, cb));
      const p = ui && ui[id];
      const name = L.short(L.clean(p && p.name) || "Inconnu", 40).toUpperCase();
      const img = await L.getAvatar(id, p && p.thumbSrc);
      let k;
      do { k = Math.floor(Math.random() * CRIMES.length); } while (k === last);
      last = k;
      const prize = money((Math.floor(Math.random() * 95) + 5) * 1000000) + " $";
      L.sendCard(api, tid, drawPoster({ name, img, crime: CRIMES[k], prize }), "🚨 " + name + " est recherché(e) !");
    } catch (e) {
      console.error(e);
      api.sendMessage("❌ Impossible de créer l'avis de recherche.", tid);
    }
  },
};
