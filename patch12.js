const fs = require("fs");
let s = fs.readFileSync("reactions.js", "utf8");
if (s.includes("levels.js")) { console.log("reactions : deja fait"); }
else {
  const a = "  patch(api);";
  if (!s.includes(a)) { console.log("reactions : introuvable"); process.exit(1); }
  const add = [
    '  try { require("./games.js").onMessage(api, event); } catch (e) { console.error(e); }',
    '  try { const lv = require("./levels.js").add(String(event.threadID), String(event.senderID)); if (lv) setTimeout(() => require("./levels.js").announce(api, event, lv).catch((e) => console.error(e)), 2500); } catch (e) { console.error(e); }',
  ].join("\n");
  s = s.replace(a, () => a + "\n" + add);
  fs.writeFileSync("reactions.js", s);
  console.log("reactions : ok");
}
let t = fs.readFileSync("index.js", "utf8");
const reps = [
  ["const cats = [", 'const cats = [\n    ["📈 Niveaux", ["rank", "rankup", "setrankup", "checktt"]],'],
  ['"pf", "choose", "roll"]', '"pf", "choose", "roll", "ttt", "fast"]'],
  ['"antiout", "notification"]', '"antiout", "notification", "kick", "setname"]'],
  ['"hello", "salut"]', '"hello", "salut", "weather", "wiki", "math", "qr", "getlink", "unsend", "uptime", "system", "sleep", "wake", "say"]'],
];
let n = 0;
for (const [x, y] of reps) if (t.includes(x) && !t.includes(y)) { t = t.replace(x, () => y); n++; }
fs.writeFileSync("index.js", t);
console.log("index.js : " + n + " changement(s) sur 4");
