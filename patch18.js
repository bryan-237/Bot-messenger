const fs = require("fs");
let s = fs.readFileSync("commands/duel.js", "utf8");
if (s.includes("u.wins")) { console.log("deja fait"); process.exit(0); }
s = s.replace("u.coins += c.bet; u.lastDuel = jour();", "u.coins += c.bet; u.lastDuel = jour(); u.wins = (u.wins || 0) + 1;");
s = s.replace("u.coins -= c.bet; u.lastDuel = jour();", "u.coins -= c.bet; u.lastDuel = jour(); u.losses = (u.losses || 0) + 1;");
fs.writeFileSync("commands/duel.js", s);
console.log("ok");
