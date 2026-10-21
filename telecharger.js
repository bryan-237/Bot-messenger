const axios = require("axios");
const fs = require("fs");
const Q = ("Naruto Uzumaki,Sasuke Uchiha,Sakura Haruno,Kakashi Hatake,Itachi Uchiha,Madara Uchiha,Obito Uchiha,Minato Namikaze,Jiraiya,Tsunade," +
  "Orochimaru,Gaara,Rock Lee,Neji Hyuuga,Hinata Hyuuga,Shikamaru Nara,Temari,Kiba Inuzuka,Shino Aburame,Tenten," +
  "Choji Akimichi,Ino Yamanaka,Might Guy,Hashirama Senju,Tobirama Senju,Hiruzen Sarutobi,Pain,Konan,Kisame Hoshigaki,Deidara," +
  "Sasori,Hidan,Kakuzu,Zabuza Momochi,Haku,Killer Bee,A (Fourth Raikage),Onoki,Mei Terumi,Danzo Shimura," +
  "Kabuto Yakushi,Boruto Uzumaki,Kaguya Otsutsuki,Hagoromo Otsutsuki,Kushina Uzumaki,Yamato,Konohamaru Sarutobi,Jugo,Suigetsu Hozuki,Karin").split(",");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const query = "query($s:String){Character(search:$s){name{full} image{large}}}";

(async () => {
  for (let i = 0; i < Q.length; i++) {
    const f = "persos/" + (i + 1) + ".png";
    if (fs.existsSync(f)) { console.log(i + 1, "déjà là"); continue; }
    try {
      const r = await axios.post("https://graphql.anilist.co", { query, variables: { s: Q[i] } },
        { headers: { "Content-Type": "application/json" }, timeout: 20000 });
      const c = r.data.data.Character;
      if (!c || !c.image.large) { console.log(i + 1, Q[i], "→ introuvable"); continue; }
      const img = await axios.get(c.image.large, { responseType: "arraybuffer", timeout: 20000 });
      fs.writeFileSync(f, Buffer.from(img.data));
      console.log(i + 1, Q[i], "→ OK (" + c.name.full + ")");
    } catch (e) { console.log(i + 1, Q[i], "→ erreur", e.message); }
    await wait(3000);
  }
  console.log("Terminé");
})();
