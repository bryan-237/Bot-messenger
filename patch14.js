const fs = require("fs");
let s = fs.readFileSync("index.js", "utf8");
const a = 'if (name === "menu")';
if (!s.includes(a)) { console.log("deja fait ou introuvable"); process.exit(0); }
s = s.replace(a, () => 'if (name === "menu_old")');
fs.writeFileSync("index.js", s);
console.log("ok");
