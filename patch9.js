const fs = require("fs");
let s = fs.readFileSync("reactions.js", "utf8");
if (s.includes("messageID, threadID")) { console.log("deja fait"); process.exit(0); }
s = s.replace("function react(api, emoji, messageID) {", "function react(api, emoji, messageID, threadID) {");
s = s.replace("api.setMessageReaction(emoji, messageID, () => {}, true)", "api.setMessageReaction(emoji, messageID, threadID, () => {}, true)");
s = s.replace(/react\(api, EMO\.start, event\.messageID\)/g, "react(api, EMO.start, event.messageID, tid)");
s = s.replace("EMO.err : EMO.ok, c.id)", "EMO.err : EMO.ok, c.id, key)");
fs.writeFileSync("reactions.js", s);
console.log("ok");
