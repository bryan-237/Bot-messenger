const G = require("../games.js");
const eco = require("../eco.js");
const L = require("../lib.js");
const C = require("../cards.js");
const F = require("../fonts.js");
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
function winner(b) {
  for (const [x, y, z] of LINES) if (b[x] && b[x] === b[y] && b[x] === b[z]) return b[x];
  return b.every(Boolean) ? "draw" : null;
}
function minimax(b, turn) {
  const w = winner(b);
  if (w === "O") return 1;
  if (w === "X") return -1;
  if (w === "draw") return 0;
  let best = turn === "O" ? -2 : 2;
  for (let i = 0; i < 9; i++) if (!b[i]) {
    b[i] = turn;
    const s = minimax(b, turn === "O" ? "X" : "O");
    b[i] = "";
    best = turn === "O" ? Math.max(best, s) : Math.min(best, s);
  }
  return best;
}
function botMove(b) {
  const free = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  if (Math.random() < 0.25) return free[Math.floor(Math.random() * free.length)];
  let bestI = free[0], bestS = -2;
  for (const i of free) { b[i] = "O"; const s = minimax(b, "X"); b[i] = ""; if (s > bestS) { bestS = s; bestI = i; } }
  return bestI;
}
function draw(b, title, color) {
  const W = 700, H = 780, S = 520, X0 = 90, Y0 = 150, cell = S / 3;
  const { canvas, ctx } = C.base(W, H, "#140a2d", "#3b1d8f", null, 21);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f5c542";
  ctx.font = "bold 46px sans-serif";
  ctx.fillText("MORPION", W / 2, 70);
  ctx.fillStyle = color;
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(title, W / 2, 120);
  ctx.strokeStyle = "#a78bfa";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  for (let i = 1; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(X0 + i * cell, Y0 + 10); ctx.lineTo(X0 + i * cell, Y0 + S - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X0 + 10, Y0 + i * cell); ctx.lineTo(X0 + S - 10, Y0 + i * cell); ctx.stroke();
  }
  b.forEach((v, i) => {
    const cx = X0 + (i % 3) * cell + cell / 2, cy = Y0 + Math.floor(i / 3) * cell + cell / 2;
    if (v === "X") {
      ctx.strokeStyle = "#ff6b9d"; ctx.lineWidth = 14;
      ctx.beginPath(); ctx.moveTo(cx - 40, cy - 40); ctx.lineTo(cx + 40, cy + 40); ctx.moveTo(cx + 40, cy - 40); ctx.lineTo(cx - 40, cy + 40); ctx.stroke();
    } else if (v === "O") {
      ctx.strokeStyle = "#4cc9f0"; ctx.lineWidth = 14;
      ctx.beginPath(); ctx.arc(cx, cy, 42, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.font = "bold 40px sans-serif"; ctx.fillText(String(i + 1), cx, cy + 14);
    }
  });
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "24px sans-serif";
  ctx.fillText("Toi = X  •  Bot = O  •  Tape un chiffre de 1 à 9", W / 2, 720);
  ctx.fillText("Tape « stop » pour arrêter", W / 2, 755);
  return canvas.toBuffer("image/png");
}

module.exports = {
  name: "ttt",
  run: (api, event) => {
    const tid = String(event.threadID), uid = String(event.senderID);
    const board = Array(9).fill("");
    const w = G.add({
      tid, uid, ttl: 300000,
      on: (api2, ev) => {
        const t = (ev.body || "").trim().toLowerCase();
        if (t === "stop") { G.remove(w); api2.sendMessage(F.panel("🛑", "Morpion", ["Partie arrêtée."]), tid); return true; }
        if (!/^[1-9]$/.test(t)) return false;
        const i = parseInt(t, 10) - 1;
        if (board[i]) { api2.sendMessage("⚠️ " + F.bi("Case déjà prise !"), tid); return true; }
        board[i] = "X";
        let r = winner(board);
        if (!r) { board[botMove(board)] = "O"; r = winner(board); }
        w.exp = Date.now() + 300000;
        if (!r) { L.sendCard(api2, tid, draw(board, "À toi de jouer", "#ffffff"), "Morpion"); return true; }
        G.remove(w);
        let title = "ÉGALITÉ  +20", color = "#c4b5fd", gain = 20;
        if (r === "X") { title = "VICTOIRE  +200"; color = "#7CFC9A"; gain = 200; }
        else if (r === "O") { title = "DÉFAITE"; color = "#ff6b6b"; gain = 0; }
        if (gain) eco.update(uid, (u) => { u.coins += gain; });
        L.sendCard(api2, tid, draw(board, title, color), "Morpion : " + title);
        return true;
      },
    });
    L.sendCard(api, event.threadID, draw(board, "À toi de jouer", "#ffffff"), "Morpion");
  },
};
