const fs = require("fs");
let s = fs.readFileSync("index.js", "utf8");
const a = "api.setOptions({ listenEvents: true });";
if (!s.includes(a)) { console.log("deja fait ou introuvable"); process.exit(0); }
s = s.replace(a, () => "api.setOptions({ listenEvents: true, autoMarkDelivery: false, autoMarkRead: false, updatePresence: false });");
fs.writeFileSync("index.js", s);
console.log("ok");
