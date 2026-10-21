const fs = require("fs");
let s = fs.readFileSync("index.js", "utf8");
const target = 'if (name === "list")';
const block = String.raw`if (name === "list") {
  const all = [...new Set([...commands.values()].map(nameOf))];
  const cats = [
    ["🎮 Fun", ["blague", "citation", "dice", "bal"]],
    ["💰 Économie", ["daily"]],
    ["👥 Groupe", ["groupe", "welcome", "bye"]],
    ["🛠️ Outils", ["uid", "hello", "salut"]],
  ];
  const used = new Set();
  const lines = ["🤖 BRYAN BOT", ""];
  for (const [title, names] of cats) {
    const here = names.filter((n) => all.includes(n));
    here.forEach((n) => used.add(n));
    if (here.length) lines.push(title + " : " + here.join(", "));
  }
  const rest = all.filter((n) => !used.has(n));
  if (rest.length) lines.push("✨ Autres : " + rest.join(", "));
  lines.push("", "📌 " + all.length + " commandes • préfixe " + PREFIX);
  return send(lines.join("\n"));
}
if (name === "list_old")`;
if (!s.includes(target)) { console.log("introuvable"); process.exit(1); }
s = s.replace(target, () => block);
fs.writeFileSync("index.js", s);
console.log("ok");
