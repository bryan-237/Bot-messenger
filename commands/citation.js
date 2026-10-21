const fs = require("fs");
const path = require("path");
const { createCanvas } = require("@napi-rs/canvas");
const L = require("../lib.js");
const F = require("../fonts.js");
const U = require("../utils.js");

const SEEN_FILE = path.join(__dirname, "..", "citations_vues.json");
const UA = { "User-Agent": "BryanBot/1.0 (bot Messenger; citations)" };
const AUTHORS = ["Socrate", "Platon", "Aristote", "Sénèque", "Marc Aurèle", "Épictète", "Confucius", "Nietzsche", "Victor Hugo", "Albert Einstein", "Voltaire", "Blaise Pascal", "Albert Camus", "Nelson Mandela", "Gandhi", "Molière"];
const CACHE = global.__citCache || (global.__citCache = {});

async function getJson(url) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

function cleanWiki(s) {
  let t = String(s);
  for (let i = 0; i < 3; i++) t = t.replace(/\{\{[^{}]*\}\}/g, "");
  return t
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "").replace(/<ref[^>]*\/>/gi, "")
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/\[https?:\/\/\S+\s*([^\]]*)\]/g, "$1")
    .replace(/'{2,}/g, "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").replace(/^[«"“\s]+|[»"”\s]+$/g, "").trim();
}

function parseQuotes(wt) {
  const cut = wt.search(/^==+\s*(?:Citations?\s+(?:sur|à propos|concernant)|Sur\s+\w|Voir aussi|Liens externes|Notes|Références|Bibliographie)/mi);
  const body = cut > 0 ? wt.slice(0, cut) : wt;
  const out = [];
  let m;
  const re = /\{\{\s*citation\s*\|([\s\S]*?)\}\}/gi;
  while ((m = re.exec(body))) {
    const mm = /(?:^|\|)\s*citation\s*=\s*([\s\S]*?)\s*(?=\|\s*[\wéèêàùç ]+\s*=|$)/i.exec(m[1]) || /^\s*([^|=]+?)\s*(?:\||$)/.exec(m[1]);
    if (mm) out.push(mm[1]);
  }
  const re2 = /^\*(?!\*)\s*(.+)$/gm;
  while ((m = re2.exec(body))) out.push(m[1]);
  const seen = new Set();
  return out.map(cleanWiki).filter((q) =>
    q.length >= 25 && q.length <= 240 &&
    !/^(voir|sur |pages? |références?|article|liens?|source)/i.test(q) &&
    !/wikipedia|wikiquote|commons/i.test(q) &&
    (seen.has(q) ? false : seen.add(q)));
}

async function fetchQuotes(query) {
  const s = await getJson("https://fr.wikiquote.org/w/api.php?action=query&list=search&srlimit=5&srnamespace=0&format=json&srsearch=" + encodeURIComponent(query));
  const hits = ((s.query && s.query.search) || []).filter((h) => !/homonymie|^(Citations?|Proverbes)/i.test(h.title));
  const pick = hits.find((h) => h.title.toLowerCase() === query.toLowerCase()) || hits[0];
  if (!pick) return null;
  const p = await getJson("https://fr.wikiquote.org/w/api.php?action=parse&prop=wikitext&redirects=1&format=json&page=" + encodeURIComponent(pick.title));
  const w = p.parse && p.parse.wikitext;
  const wt = typeof w === "string" ? w : (w && w["*"]) || "";
  return { title: pick.title, quotes: parseQuotes(wt) };
}

async function fetchInfo(query) {
  const j = await getJson("https://fr.wikipedia.org/w/api.php?action=query&generator=search&gsrlimit=1&prop=pageimages|extracts|description&piprop=thumbnail&pithumbsize=1100&exintro=1&explaintext=1&exsentences=2&format=json&gsrsearch=" + encodeURIComponent(query));
  const pg = j.query && j.query.pages && Object.values(j.query.pages)[0];
  if (!pg) return null;
  return {
    title: pg.title,
    desc: pg.description || "",
    bio: (pg.extract || "").replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").replace(/\s+([,.;])/g, "$1").trim(),
    thumb: pg.thumbnail && pg.thumbnail.source,
  };
}

function pickQuote(tid, key, quotes) {
  let seen = {};
  try { seen = JSON.parse(fs.readFileSync(SEEN_FILE, "utf8")); } catch {}
  const k = tid + "|" + key;
  const used = new Set(seen[k] || []);
  let pool = quotes.filter((q) => !used.has(q.slice(0, 50)));
  let reset = false;
  if (!pool.length) { pool = quotes; used.clear(); reset = true; }
  const q = pool[Math.floor(Math.random() * pool.length)];
  used.add(q.slice(0, 50));
  seen[k] = [...used].slice(-500);
  fs.writeFileSync(SEEN_FILE, JSON.stringify(seen));
  return { q, reset };
}

function coverTop(ctx, img, x, y, w, h) {
  const ar = img.width / img.height, fr = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (ar > fr) { sw = img.height * fr; sx = (img.width - sw) / 2; } else { sh = img.width / fr; sy = (img.height - sh) * 0.2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function draw(o) {
  const W = 1080, H = 1080;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0b0f1e";
  ctx.fillRect(0, 0, W, H);
  if (o.img) {
    const small = createCanvas(32, 32);
    L.cover(small.getContext("2d"), o.img, 0, 0, 32, 32);
    ctx.drawImage(small, 0, 0, W, H);
  }
  ctx.fillStyle = o.img ? "rgba(8,10,22,0.72)" : "rgb(8,10,22)";
  ctx.fillRect(0, 0, W, H);
  if (o.img) {
    const pw = 700, P = createCanvas(pw, H), pc = P.getContext("2d");
    coverTop(pc, o.img, 0, 0, pw, H);
    pc.globalCompositeOperation = "destination-in";
    const g = pc.createLinearGradient(pw * 0.55, 0, pw, 0);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    pc.fillStyle = g;
    pc.fillRect(0, 0, pw, H);
    ctx.drawImage(P, 0, 0);
  } else {
    ctx.fillStyle = "rgba(212,169,90,0.12)";
    ctx.font = "bold 520px serif";
    ctx.textAlign = "left";
    ctx.fillText("“", 60, 520);
  }
  const bot = ctx.createLinearGradient(0, H * 0.7, 0, H);
  bot.addColorStop(0, "rgba(0,0,0,0)");
  bot.addColorStop(1, "rgba(0,0,0,0.65)");
  ctx.fillStyle = bot;
  ctx.fillRect(0, H * 0.7, W, H * 0.3);

  const fitText = (text, maxW, size, style) => {
    let s = size;
    ctx.font = style + " " + s + "px serif";
    while (ctx.measureText(text).width > maxW && s > 18) { s -= 2; ctx.font = style + " " + s + "px serif"; }
    return s;
  };
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  fitText(o.name.toUpperCase(), 440, 46, "bold");
  ctx.fillText(o.name.toUpperCase(), 800, 175);
  ctx.fillStyle = "#e8e2d0";
  fitText(o.desc, 440, 26, "italic");
  ctx.fillText(o.desc, 800, 215);

  const maxW = 440;
  let size = 54, lines = [];
  for (; size >= 28; size -= 2) {
    ctx.font = size + "px serif";
    lines = U.wrap(ctx, o.quote, maxW);
    if (lines.length * size * 1.25 <= 420) break;
  }
  const lh = size * 1.25;
  const y0 = 560 - (lines.length * lh) / 2 + size * 0.8;
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = size + "px serif";
  lines.forEach((l, i) => ctx.fillText(l, 610, y0 + i * lh));
  ctx.fillStyle = "#d4a95a";
  ctx.font = "bold 96px serif";
  ctx.fillText("“", 545, y0 - 10);
  ctx.fillText("”", 610 + maxW - 30, y0 + lines.length * lh + 40);

  ctx.fillStyle = "#d4a95a";
  fitText(o.name, 430, 44, "italic");
  ctx.fillText(o.name, 610, 880);
  ctx.strokeStyle = "#d4a95a";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(610, 900); ctx.lineTo(730, 900); ctx.stroke();
  ctx.fillStyle = "#e8e2d0";
  ctx.font = "italic 25px serif";
  U.wrap(ctx, o.bio.slice(0, 230), 430).slice(0, 4).forEach((l, i) => ctx.fillText(l, 610, 940 + i * 32));

  ctx.fillStyle = "#d4a95a";
  ctx.fillRect(52, 1010, 70, 8);
  for (let i = 0; i < 4; i++) ctx.fillRect(58 + i * 17, 975, 9, 35);
  ctx.beginPath(); ctx.moveTo(48, 975); ctx.lineTo(87, 950); ctx.lineTo(126, 975); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "26px sans-serif";
  ctx.fillText(o.cat, 150, 985);
  ctx.fillStyle = "#c9c2b0";
  ctx.font = "15px sans-serif";
  ctx.fillText("DES PENSÉES QUI ÉCLAIRENT LA VIE", 150, 1012);
  ctx.textAlign = "right";
  ctx.fillStyle = "#8a8578";
  ctx.font = "14px sans-serif";
  ctx.fillText("Image : Wikimedia  •  Citations : Wikiquote", W - 20, H - 16);
  return canvas.toBuffer("image/png");
}

module.exports = {
  name: "citation",
  run: async (api, event) => {
    const tid = String(event.threadID);
    let query = U.args(event).join(" ").trim();
    if (!query) query = AUTHORS[Math.floor(Math.random() * AUTHORS.length)];
    try { api.sendTypingIndicator(tid); } catch {}
    try {
      const key = query.toLowerCase();
      let c = CACHE[key];
      if (!c || Date.now() - c.at > 6 * 3600000) {
        const [qd, info] = await Promise.all([fetchQuotes(query), fetchInfo(query).catch(() => null)]);
        c = { at: Date.now(), qd, info };
        if (qd && qd.quotes.length) CACHE[key] = c;
      }
      if (!c.qd || !c.qd.quotes.length)
        return api.sendMessage(F.panel("❌", "Citation", ["Aucune citation trouvée pour : " + query, F.bi("Essaie un auteur connu") + " : .citation socrate"]), tid);
      const { q, reset } = pickQuote(tid, key, c.qd.quotes);
      const name = (c.info && c.info.title) || c.qd.title;
      const dsc = (c.info && c.info.desc) || "";
      const img = c.info && c.info.thumb ? await L.loadUrl(c.info.thumb) : null;
      const buf = draw({
        img, name, quote: q,
        desc: dsc ? dsc.charAt(0).toUpperCase() + dsc.slice(1) : "",
        bio: (c.info && c.info.bio) || "",
        cat: /philosoph/i.test(dsc) ? "PHILOSOPHIE" : "CITATIONS",
      });
      L.sendCard(api, event.threadID, buf, "« " + q + " » — " + name);
      if (reset) api.sendMessage(F.panel("🔁", "Citations", ["Tu as vu toutes les citations de " + name + " : on recommence !"]), tid);
    } catch (e) {
      console.error(e.message);
      api.sendMessage(F.panel("❌", "Citation", ["Service indisponible, réessaie plus tard."]), tid);
    }
  },
};
