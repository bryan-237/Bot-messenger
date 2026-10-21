const fs = require("fs");
let s = fs.readFileSync("commands/claude.js", "utf8");
const a = 'try { return fs.readFileSync(KEY_FILE, "utf8").trim(); } catch { return process.env.ANTHROPIC_API_KEY || ""; }';
const a2 = 'try { const m = fs.readFileSync(KEY_FILE, "utf8").match(/sk-ant-[A-Za-z0-9_-]+/); return m ? m[0] : ""; } catch { return process.env.ANTHROPIC_API_KEY || ""; }';
const b = 'String(e.message).slice(0, 200)';
const b2 = 'String(e.message).replace(/sk-ant-[A-Za-z0-9_-]+/g, "[clé masquée]").slice(0, 200)';
if (!s.includes(a) || !s.includes(b)) { console.log("introuvable"); process.exit(1); }
s = s.replace(a, () => a2).replace(b, () => b2);
fs.writeFileSync("commands/claude.js", s);
console.log("ok");
