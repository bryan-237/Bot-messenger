const fs = require("fs");
const file = "commands/pf.js";
let s = fs.readFileSync(file, "utf8");
if (s.includes("fonts.js")) { console.log("deja fait"); process.exit(0); }
const reps = [
  ['const eco = require("../eco.js");', 'const eco = require("../eco.js");\nconst F = require("../fonts.js");'],
  ['api.sendMessage("Utilise : .pf pile 100 (ou face)", tid)', 'api.sendMessage(F.panel("💡", "Pile ou face", [F.b("Utilise") + " : .pf pile 100", F.bi("ou") + " : .pf face 100"]), tid)'],
  ['api.sendMessage("Mise minimum : 10 pièces. Exemple : .pf pile 100", tid)', 'api.sendMessage(F.panel("💡", "Pile ou face", [F.b("Mise minimum") + " : 10 pièces", F.bi("Exemple") + " : .pf pile 100"]), tid)'],
  ['api.sendMessage("❌ Pas assez de pièces (" + coins + "). Tape .daily pour en gagner.", tid)', 'api.sendMessage(F.panel("❌", "Pas assez de pièces", [F.b("Solde") + " : " + coins + " pièces", F.bi("Tape .daily pour en gagner")]), tid)'],
];
let n = 0;
for (const [a, b] of reps) if (s.includes(a)) { s = s.replace(a, () => b); n++; }
fs.writeFileSync(file, s);
console.log(n + " changement(s) sur 4");
