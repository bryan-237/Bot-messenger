const fs = require("fs");
const path = require("path");
const axios = require("axios");
module.exports = { name: "traduire", run: async (api, event) => {
  const tid = event.threadID;
  const p = (event.body || "").trim().split(/\s+/);
  const lang = p[1];
  let texte = p.slice(2).join(" ");
  if (!texte && event.messageReply) texte = event.messageReply.body || "";
  if (!lang || !texte) return api.sendMessage("Utilise : .traduire en Bonjour\nou réponds à un message : .traduire fr", tid);
  let key;
  try { key = fs.readFileSync(path.join(__dirname, "..", "groq.key"), "utf8").trim(); } catch { return api.sendMessage("❌ groq.key introuvable.", tid); }
  try {
    const r = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages: [
        { role: "system", content: "Tu es un traducteur. Traduis le texte de l'utilisateur vers la langue demandée. Réponds uniquement avec la traduction, sans explication." },
        { role: "user", content: "Langue cible : " + lang + "\n\nTexte :\n" + texte },
      ],
    }, { headers: { Authorization: "Bearer " + key }, timeout: 30000 });
    api.sendMessage("🌍 " + r.data.choices[0].message.content.trim(), tid);
  } catch (e) {
    console.error("traduire:", e.message);
    api.sendMessage("❌ Erreur de traduction (clé Groq ou modèle).", tid);
  }
}};
