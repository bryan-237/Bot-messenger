const axios = require("axios");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(process.cwd(), "data");
const HISTORY_FILE = path.join(DATA_DIR, "citations.json");

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const IMAGE_KEY = process.env.DYNAPICTURES_API_KEY;
const IMAGE_MODEL =
  process.env.DYNAPICTURES_MODEL_ID || "gpt-image-1-mini";

const THEMES = [
  "sagesse", "courage", "amour", "liberté",
  "discipline", "connaissance", "patience",
  "réussite", "vérité", "bonheur", "justice",
  "temps", "amitié", "éducation", "destin"
];

const PHILOSOPHERS = [
  "Socrate",
  "Platon",
  "Aristote",
  "Épictète",
  "Sénèque",
  "Marc Aurèle",
  "Confucius",
  "Lao Tseu",
  "René Descartes",
  "Baruch Spinoza",
  "Jean-Jacques Rousseau",
  "Friedrich Nietzsche",
  "Albert Camus",
  "Simone de Beauvoir",
  "Hannah Arendt"
];

function loadHistory() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  // Garder les 5000 dernières citations.
  fs.writeFileSync(
    HISTORY_FILE,
    JSON.stringify(history.slice(-5000), null, 2),
    "utf8"
  );
}

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hashText(text) {
  // Empreinte simple pour repérer les répétitions exactes.
  let hash = 2166136261;

  for (const char of normalize(text)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16);
}

function similarity(a, b) {
  const first = new Set(normalize(a).split(" ").filter(Boolean));
  const second = new Set(normalize(b).split(" ").filter(Boolean));

  if (!first.size || !second.size) return 0;

  let intersection = 0;

  for (const word of first) {
    if (second.has(word)) intersection++;
  }

  return intersection / (first.size + second.size - intersection);
}

async function generateQuote(theme, previousQuotes) {
  const recent = previousQuotes
    .slice(-80)
    .map(item => item.quote)
    .filter(Boolean);

  const prompt = `
Tu es un assistant spécialisé en philosophie.

Thème demandé : ${theme}

Choisis un philosophe pertinent dans l'histoire de la philosophie.
Génère une pensée originale, concise, profonde et compréhensible en français.

RÈGLES :
- N'invente jamais une citation historique attribuée à un philosophe.
- La pensée doit être nouvelle et créée pour cette demande.
- Le nom du philosophe sert à indiquer une inspiration intellectuelle,
  pas à prétendre qu'il a réellement prononcé cette phrase.
- Évite les idées et formulations trop proches de la liste précédente.
- Varie le vocabulaire, les images, la structure et l'angle philosophique.
- Écris une explication simple de la pensée.
- Le résultat doit être du JSON valide uniquement.

Philosophes possibles :
${PHILOSOPHERS.join(", ")}

Pensées déjà utilisées à éviter :
${recent.join("\n").slice(-9000)}

Réponds exactement avec cette structure :
{
  "philosophe": "Nom du philosophe",
  "citation": "Pensée originale",
  "explication": "Explication courte",
  "theme": "${theme}"
}
`;

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      temperature: 1,
      messages: [
        {
          role: "system",
          content: "Tu es un assistant de philosophie rigoureux. Réponds en JSON valide."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 60000
    }
  );

  return JSON.parse(response.data.choices[0].message.content);
}

async function generateImage(philosophe, theme) {
  const prompt = `
Create a premium vertical philosophical portrait poster.
Subject: an artistic, historically inspired portrait of ${philosophe}.
Theme: ${theme}.
The philosopher's face must be large, clearly visible, centered,
with realistic facial features, cinematic lighting and refined details.
Elegant dark background, subtle gold accents, dramatic chiaroscuro,
luxury editorial photography, sophisticated philosophical atmosphere.
Leave clean negative space in the lower third for text to be added later.
No text, no letters, no watermark, no logo.
Vertical portrait composition, 2:3 aspect ratio.
This is an artistic interpretation, not a claim of exact historical likeness.
`;

  const started = await axios.post(
    "https://api.dynapictures.com/ai/generate",
    {
      modelId: IMAGE_MODEL,
      prompt,
      ratio: "2:3"
    },
    {
      headers: {
        Authorization: `Bearer ${IMAGE_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 60000
    }
  );

  const jobUid = started.data.jobUid;

  if (!jobUid) {
    throw new Error("DynaPictures n'a pas retourné de jobUid.");
  }

  // Attendre au maximum environ 90 secondes.
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 3000));

    const result = await axios.get(
      `https://api.dynapictures.com/ai/generate/${encodeURIComponent(jobUid)}`,
      {
        headers: {
          Authorization: `Bearer ${IMAGE_KEY}`
        },
        timeout: 30000
      }
    );

    if (result.data.status === "done" && result.data.resultUrl) {
      return result.data.resultUrl;
    }

    if (result.data.status === "error") {
      throw new Error(
        result.data.error || "Échec de génération du portrait."
      );
    }
  }

  throw new Error("La génération de l'image prend trop de temps.");
}

module.exports = {
  config: {
    name: "citation",
    aliases: ["quote", "philo", "sagesse"],
    version: "2.0.0",
    author: "King Bot",
    countDown: 20,
    role: 0,
    shortDescription: "Citation philosophique avec portrait IA",
    category: "fun",
    guide: "{pn} [thème]"
  },

  onStart: async function ({ message, args }) {
    if (!OPENAI_KEY) {
      return message.reply(
        "❌ OPENAI_API_KEY est absent du fichier .env."
      );
    }

    if (!IMAGE_KEY) {
      return message.reply(
        "❌ DYNAPICTURES_API_KEY est absent du fichier .env."
      );
    }

    const requestedTheme = args.join(" ").trim();
    const theme = requestedTheme ||
      THEMES[Math.floor(Math.random() * THEMES.length)];

    const history = loadHistory();

    try {
      await message.reply(
        `⚔️ KING BOT — PHILOSOPHIE\n\n` +
        `🧠 Thème : ${theme}\n` +
        `✨ Création d'une nouvelle pensée...\n` +
        `🖼️ Préparation du portrait IA.`
      );

      let data;
      let unique = false;

      // Plusieurs tentatives si une pensée ressemble trop à l'historique.
      for (let attempt = 0; attempt < 4; attempt++) {
        data = await generateQuote(theme, history);

        if (!data.citation || !data.philosophe) {
          throw new Error("La réponse de l'IA est incomplète.");
        }

        const normalizedHash = hashText(data.citation);

        const exactDuplicate = history.some(
          item => item.hash === normalizedHash
        );

        const similarDuplicate = history
          .slice(-250)
          .some(item => similarity(item.quote, data.citation) >= 0.78);

        if (!exactDuplicate && !similarDuplicate) {
          unique = true;
          break;
        }
      }

      if (!unique) {
        throw new Error(
          "Impossible de trouver une pensée suffisamment différente. Réessaie."
        );
      }

      const imageUrl = await generateImage(data.philosophe, theme);

      history.push({
        hash: hashText(data.citation),
        quote: data.citation,
        philosopher: data.philosophe,
        theme,
        date: new Date().toISOString()
      });

      saveHistory(history);

      const caption =
        `⚔️ 𝕶𝖎𝖓𝖌 𝕭𝖔𝖙 ⚔️\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `📜 CITATION PHILOSOPHIQUE\n\n` +
        `💭 « ${data.citation} »\n\n` +
        `👤 Philosophe : ${data.philosophe}\n` +
        `🎯 Thème : ${data.theme || theme}\n\n` +
        `🧠 Explication : ${data.explication || "Une invitation à réfléchir."}\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `✨ Pensée originale inspirée de la philosophie.\n` +
        `⚔️ Created by King Bot`;

      // L'API du bot doit accepter une URL d'image.
      return message.reply({
        body: caption,
        attachment: await axios.get(imageUrl, {
          responseType: "stream",
          timeout: 60000
        }).then(response => response.data)
      });

    } catch (error) {
      console.error(
        "[CITATION ERROR]",
        error.response?.data || error.message
      );

      return message.reply(
        "❌ Impossible de terminer la citation.\n" +
        "Vérifie les clés API, le modèle DynaPictures, " +
        "les crédits d'image et la compatibilité de ton bot avec les pièces jointes."
      );
    }
  }
};
