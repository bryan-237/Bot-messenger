const fs = require("fs");
let s = fs.readFileSync("index.js", "utf8");
const reps = [
  ['["daily", "bal"]', '["daily", "bal", "pay", "work", "fishing", "baicao"]'],
  ['"dice", "slots", "pf"]', '"dice", "slots", "pf", "choose", "roll"]'],
];
let n = 0;
for (const [a, b] of reps) if (s.includes(a)) { s = s.replace(a, () => b); n++; }
fs.writeFileSync("index.js", s);
console.log(n + " changement(s)");
