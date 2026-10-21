const fs = require("fs");
let s = fs.readFileSync("index.js", "utf8");
const target = "api.listenMqtt(async (err, event) => {";
if (s.includes("membres.js")) { console.log("deja fait"); process.exit(0); }
if (!s.includes(target)) { console.log("introuvable"); process.exit(1); }
const hook = '\n  if (!err && event) { try { require("./membres.js")(api, event); } catch (e) { console.error(e); } }';
s = s.replace(target, () => target + hook);
fs.writeFileSync("index.js", s);
console.log("ok");
