const fs = require("fs");
const path = require("path");
const KEY_FILE = path.join(__dirname, "..", "groq.key");
const MODEL = "openai/gpt-oss-120b";
const COOLDOWN_MS = 4000;
const lastUse = {};
const mask = (s) => String(s).replace(/gsk_[A-Za-z0-9]+/g, "[clé masquée]");

function getKey() {
  try {
    const m = fs.readFileSync(KEY_FILE, "utf8").match(/gsk_[A-Za-z0-9]+/);
    return m ? m[0] : "";
  } catch { return process.env.GROQ_API_KEY || ""; }
}

function system() {
  const d = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return "Tu es Bryan Bot, un assistant IA dans un groupe Messenger. Nous sommes le " + d + ". Réponds dans la langue de l'utilisateur (français par défaut), clairement et brièvement, en texte simple sans markdown ni astérisques, en moins de 1200 caractères. Tes connaissances peuvent être dépassées : pour l'actualité récente (classements, résultats, prix), précise que l'information peut être périmée et n'invente jamais de faits.";
}

async function askAI(question, context) {
  const key = getKey();
  if (!key) throw new Error("NO_KEY");
  const content = context ? "Message cité : " + context + "\n\nQuestion : " + question : question;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 25000);
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: ctl.signal,
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL, max_tokens: 900, temperature: 0.6, reasoning_effort: "low",
        messages: [{ role: "system", content: system() }, { role: "user", content }],
      }),
    });
    const j = await r.json();
    if (!r.ok) {
      const e = new Error((j.error && j.error.message) || "HTTP " + r.status);
      e.status = r.status;
      throw e;
    }
    const m = j.choices && j.choices[0] && j.choices[0].message;
    return ((m && m.content) || "").trim();
  } finally { clearTimeout(timer); }
}

const tidy = (t) => t.replace(/\*\*/g, "").replace(/^#+\s*/gm, "").replace(/^\s*[-*]\s+/gm, "• ");

module.exports = {
  name: "ia",
  run: async (api, event) => {
    const tid = event.threadID;
    const question = (event.body || "").trim().split(/\s+/).slice(1).join(" ").trim();
    const quoted = event.messageReply && event.messageReply.body ? event.messageReply.body.slice(0, 1500) : "";
    if (!question && !quoted) return api.sendMessage("Utilise : .ia ta question", tid);
    const uid = String(event.senderID);
    const now = Date.now();
    if (lastUse[uid] && now - lastUse[uid] < COOLDOWN_MS)
      return api.sendMessage("⏳ Patiente quelques secondes avant de reposer une question.", tid);
    lastUse[uid] = now;
    try { api.sendTypingIndicator(tid); } catch {}
    try {
      const text = tidy(await askAI(question || "Peux-tu répondre à ce message ?", quoted));
      if (!text) return api.sendMessage("🤔 Pas de réponse, réessaie.", tid);
      for (let i = 0; i < text.length; i += 1800)
        await new Promise((res) => api.sendMessage(text.slice(i, i + 1800), tid, () => res()));
    } catch (e) {
      console.error(mask(e.message));
      let msg = "❌ Erreur IA : " + mask(e.message).slice(0, 150);
      if (e.message === "NO_KEY" || e.status === 401) msg = "⚠️ Clé Groq manquante ou invalide : l'admin doit mettre à jour groq.key.";
      else if (e.status === 429) msg = "⏳ Trop de demandes, réessaie dans une minute.";
      else if (e.name === "AbortError") msg = "⏳ L'IA met trop de temps à répondre, réessaie.";
      api.sendMessage(msg, tid);
    }
  },
};
