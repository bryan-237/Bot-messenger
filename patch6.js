const fs = require("fs");
let s = fs.readFileSync("index.js", "utf8");
const reps = [
  ['["blague", "citation", "dice", "bal"]', '["blague", "citation", "wanted", "pin", "ia", "dice", "slots", "pf"]'],
  ['["daily"]', '["daily", "bal"]'],
  ['["groupe", "welcome", "bye"]', '["groupe", "welcome", "bye", "antiout", "notification"]'],
  ['["uid", "hello", "salut"]', '["id", "uid", "hello", "salut"]'],
];
let n = 0;
for (const [a, b] of reps) if (s.includes(a)) { s = s.replace(a, () => b); n++; }
fs.writeFileSync("index.js", s);
console.log(n + " changement(s)");
