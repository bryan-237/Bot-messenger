const F = require("../fonts.js");
const U = require("../utils.js");
const CODES = [[0, "Ciel dégagé", "☀️"], [1, "Plutôt dégagé", "🌤️"], [2, "Partiellement nuageux", "⛅"], [3, "Couvert", "☁️"], [45, "Brouillard", "🌫️"], [51, "Bruine", "🌦️"], [61, "Pluie", "🌧️"], [65, "Forte pluie", "🌧️"], [71, "Neige", "🌨️"], [75, "Forte neige", "❄️"], [80, "Averses", "🌦️"], [82, "Averses violentes", "⛈️"], [95, "Orage", "⛈️"]];
const desc = (c) => { let best = CODES[0]; for (const x of CODES) if (x[0] <= c) best = x; return best; };
const get = async (u) => { const r = await fetch(u, { signal: AbortSignal.timeout(10000) }); if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); };
module.exports = {
  name: "weather",
  run: async (api, event) => {
    const tid = event.threadID;
    const city = U.args(event).join(" ").trim();
    if (!city) return api.sendMessage(F.panel("💡", "Météo", [F.b("Utilise") + " : .weather Paris"]), tid);
    try {
      const g = await get("https://geocoding-api.open-meteo.com/v1/search?count=1&language=fr&format=json&name=" + encodeURIComponent(city));
      const p = g.results && g.results[0];
      if (!p) return api.sendMessage(F.panel("❌", "Météo", ["Ville introuvable : " + city]), tid);
      const w = await get("https://api.open-meteo.com/v1/forecast?latitude=" + p.latitude + "&longitude=" + p.longitude + "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1");
      const c = w.current, d = desc(c.weather_code);
      api.sendMessage(F.panel(d[2], "Météo", [
        "📍 " + F.b(p.name) + (p.country ? ", " + p.country : ""),
        "☁️ " + d[1],
        "🌡️ " + F.b(Math.round(c.temperature_2m) + "°C") + " (ressenti " + Math.round(c.apparent_temperature) + "°C)",
        "📈 " + F.bi("Min / Max") + " : " + Math.round(w.daily.temperature_2m_min[0]) + "° / " + Math.round(w.daily.temperature_2m_max[0]) + "°",
        "💧 " + F.bi("Humidité") + " : " + c.relative_humidity_2m + " %",
        "💨 " + F.bi("Vent") + " : " + Math.round(c.wind_speed_10m) + " km/h",
      ]), tid);
    } catch (e) {
      console.error(e.message);
      api.sendMessage(F.panel("❌", "Météo", ["Service indisponible, réessaie plus tard."]), tid);
    }
  },
};
