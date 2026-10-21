const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const eco = require("../eco.js");
const L = require("../lib.js");

const DIR = path.join(__dirname, "..", "persos");
const R = ("Naruto:10,Sasuke:10,Sakura:7,Kakashi:9,Itachi:10,Madara:10,Obito:10,Minato:10,Jiraiya:9,Tsunade:8," +
  "Orochimaru:9,Gaara:8,Rock Lee:7,Neji:7,Hinata:6,Shikamaru:7,Temari:6,Kiba:6,Shino:6,Tenten:6," +
  "Choji:6,Ino:6,Might Guy:9,Hashirama:10,Tobirama:9,Hiruzen:8,Pain:10,Konan:7,Kisame:8,Deidara:8," +
  "Sasori:8,Hidan:7,Kakuzu:8,Zabuza:7,Haku:6,Killer Bee:9,Raikage A:9,Onoki:8,Mei Terumi:8,Danzo:8," +
  "Kabuto:8,Boruto:8,Kaguya:10,Hagoromo:10,Kushina:8,Yamato:7,Konohamaru:6,Jugo:7,Suigetsu:6,Karin:5")
  .split(",").map((s) => { const [n, p] = s.split(":"); return { n, p: +p }; });

global.duels = global.duels || {};
global.combats = global.combats || {};
const imgs = {};
const jour = () => new Date(Date.now() + 3600000).toISOString().slice(0, 10);
const nom = (api, id) => new Promise((r) => api.getUserInfo(id, (e, i) => r((i && i[id] && i[id].name) || "Joueur")));

async function portrait(n) {
  if (n in imgs) return imgs[n];
  imgs[n] = null;
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    const f = path.join(DIR, n + "." + ext);
    if (fs.existsSync(f)) { try { imgs[n] = await loadImage(f); } catch {} break; }
  }
  return imgs[n];
}

function drawPerso(ctx, img, n, x, y, w, h) {
  if (img) return L.cover(ctx, img, x, y, w, h);
  ctx.fillStyle = "hsl(" + (n * 37 % 360) + ",45%,28%)"; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = "bold " + Math.round(h / 3) + "px sans-serif";
  ctx.fillText(R[n - 1].n.split(" ").map((s) => s[0]).join("").slice(0, 2), x + w / 2, y + h / 2);
}

function fit(ctx, txt, x, y, maxW, size, bold) {
  let s = size;
  do { ctx.font = (bold ? "bold " : "") + s + "px sans-serif"; s -= 2; } while (ctx.measureText(txt).width > maxW && s > 10);
  ctx.fillText(txt, x, y);
}

async function selectImage() {
  if (global.__duelSel) return global.__duelSel;
  const W = 1500, H = 985, c = createCanvas(W, H), x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0b0b10"); g.addColorStop(1, "#3a0a0a");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#ff3b3b";
  x.font = "bold 52px sans-serif"; x.fillText("CHOISIS TON COMBATTANT", W / 2, 45);
  for (let i = 0; i < R.length; i++) {
    const cx = (i % 10) * 150 + 10, cy = 90 + Math.floor(i / 10) * 175;
    x.save(); x.beginPath(); x.rect(cx, cy, 130, 130); x.clip();
    drawPerso(x, await portrait(i + 1), i + 1, cx, cy, 130, 130);
    x.restore();
    x.strokeStyle = "#ff3b3b"; x.lineWidth = 3; x.strokeRect(cx, cy, 130, 130);
    x.fillStyle = "#ff3b3b"; x.fillRect(cx, cy, 46, 32);
    x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle";
    x.font = "bold 24px sans-serif"; x.fillText(String(i + 1), cx + 23, cy + 17);
    x.fillStyle = "#e9e5ff"; fit(x, R[i].n, cx + 65, cy + 152, 128, 20, true);
  }
  return (global.__duelSel = c.toBuffer("image/png"));
}

async function vsImage(c, na, nb, win) {
  const W = 1400, H = 760, cv = createCanvas(W, H), x = cv.getContext("2d");
  const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, "#1a0505"); g.addColorStop(0.5, "#000"); g.addColorStop(1, "#05051a");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const side = [[c.a, na, 60, "#ff3b3b"], [c.b, nb, 780, "#3b8bff"]];
  for (const [id, pn, px, col] of side) {
    const n = c.pick[id], img = await portrait(n), won = win === id;
    x.save(); x.beginPath(); x.rect(px, 60, 560, 560); x.clip();
    drawPerso(x, img, n, px, 60, 560, 560);
    if (!won) { x.fillStyle = "rgba(0,0,0,0.6)"; x.fillRect(px, 60, 560, 560); }
    x.restore();
    x.strokeStyle = won ? "#f5c542" : col; x.lineWidth = won ? 10 : 5; x.strokeRect(px, 60, 560, 560);
    x.textAlign = "center"; x.textBaseline = "middle";
    x.fillStyle = "#fff"; fit(x, R[n - 1].n.toUpperCase(), px + 280, 655, 540, 54, true);
    x.fillStyle = "#c4b5fd"; fit(x, pn, px + 280, 705, 540, 32, false);
    if (won) { x.fillStyle = "#f5c542"; x.font = "bold 40px sans-serif"; x.fillText("VAINQUEUR  +" + c.bet, px + 280, 35); }
  }
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillStyle = "#f5c542"; x.font = "bold 150px sans-serif"; x.fillText("VS", W / 2, 340);
  x.fillStyle = "#fff"; x.font = "bold 36px sans-serif"; x.fillText("Mise : " + c.bet, W / 2, 450);
  return cv.toBuffer("image/png");
}

async function finir(api, tid, c) {
  if (eco.get(c.a).coins < c.bet || eco.get(c.b).coins < c.bet) return api.sendMessage("❌ Un joueur n'a plus assez de pièces. Duel annulé.", tid);
  const ra = R[c.pick[c.a] - 1], rb = R[c.pick[c.b] - 1];
  const win = Math.random() < ra.p / (ra.p + rb.p) ? c.a : c.b, lose = win === c.a ? c.b : c.a;
  eco.update(win, (u) => { u.coins += c.bet; u.lastDuel = jour(); });
  eco.update(lose, (u) => { u.coins -= c.bet; u.lastDuel = jour(); });
  const [na, nb] = await Promise.all([nom(api, c.a), nom(api, c.b)]);
  const buf = await vsImage(c, na, nb, win);
  await L.sendCard(api, tid, buf, "⚔️ " + (win === c.a ? na : nb) + " remporte le duel : +" + c.bet + " 💰");
}

async function run(api, event) {
  const id = String(event.senderID), tid = event.threadID;
  const p = (event.body || "").trim().split(/\s+/);
  const act = (p[1] || "").toLowerCase();

  if (act === "accepter" || act === "refuser") {
    const key = tid + "_" + id, d = global.duels[key];
    if (!d || Date.now() - d.t > 120000) { delete global.duels[key]; return api.sendMessage("Aucun défi en attente.", tid); }
    delete global.duels[key];
    if (act === "refuser") return api.sendMessage("🏳️ Défi refusé.", tid);
    const ex = global.combats[tid];
    if (ex && Date.now() - ex.t < 180000) return api.sendMessage("⚔️ Un duel est déjà en cours dans ce groupe.", tid);
    if (eco.get(id).coins < d.bet || eco.get(d.from).coins < d.bet) return api.sendMessage("❌ Un des deux n'a plus assez de pièces.", tid);
    global.combats[tid] = { a: d.from, b: id, bet: d.bet, t: Date.now(), pick: {} };
    return L.sendCard(api, tid, await selectImage(), "⚔️ Duel accepté ! Chacun tape le NUMÉRO de son personnage (1 à " + R.length + "). 3 min.");
  }

  const cible = Object.keys(event.mentions || {})[0] || (event.messageReply && event.messageReply.senderID);
  const bet = parseInt(p[p.length - 1]);
  if (!cible || !bet) return api.sendMessage("Utilise : .duel @user 100\nL'adversaire répond .duel accepter ou .duel refuser", tid);
  const t = String(cible);
  if (t === id) return api.sendMessage("😅 Tu ne peux pas te défier toi-même.", tid);
  if (bet < 10) return api.sendMessage("Mise minimum : 10 pièces.", tid);
  if (eco.get(id).coins < bet) return api.sendMessage("❌ Tu n'as pas assez de pièces.", tid);
  if (eco.get(t).coins < bet) return api.sendMessage("❌ Ton adversaire n'a pas assez de pièces.", tid);
  global.duels[tid + "_" + t] = { from: id, bet, t: Date.now() };
  api.sendMessage("⚔️ " + (await nom(api, id)) + " défie " + (await nom(api, t)) + " pour " + bet + " pièces !\nRéponds : .duel accepter ou .duel refuser (2 min)", tid);
}

async function handle(api, event) {
  if (event.type !== "message" && event.type !== "message_reply") return;
  const tid = event.threadID, c = global.combats[tid];
  if (!c) return;
  if (Date.now() - c.t > 180000) { delete global.combats[tid]; return api.sendMessage("⌛ Duel annulé (temps écoulé). Aucune pièce perdue.", tid); }
  const id = String(event.senderID);
  if (id !== c.a && id !== c.b) return;
  const body = (event.body || "").trim();
  if (!/^\d{1,2}$/.test(body)) return;
  const n = +body;
  if (n < 1 || n > R.length) return api.sendMessage("Choisis un numéro entre 1 et " + R.length, tid);
  const other = id === c.a ? c.b : c.a;
  if (c.pick[other] === n) return api.sendMessage("❌ Ce personnage est déjà pris, choisis-en un autre.", tid);
  c.pick[id] = n;
  api.sendMessage("✅ " + (await nom(api, id)) + " a choisi " + R[n - 1].n, tid);
  if (c.pick[c.a] && c.pick[c.b]) { delete global.combats[tid]; try { await finir(api, tid, c); } catch (e) { console.error("duel:", e.message); api.sendMessage("❌ Erreur pendant le duel.", tid); } }
}

module.exports = { name: "duel", run, handle };
