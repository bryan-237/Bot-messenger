const { createCanvas, loadImage } = require("@napi-rs/canvas");
const PHILOS = [
 { n:"NIETZSCHE", q:"Deviens ce que tu es.", u:"https://upload.wikimedia.org/wikipedia/commons/1/1b/Nietzsche187a.jpg" },
 { n:"SOCRATE", q:"Connais-toi toi-meme.", u:"https://upload.wikimedia.org/wikipedia/commons/b/bc/Socrates_Louvre.jpg" },
 { n:"DESCARTES", q:"Je pense, donc je suis.", u:"https://upload.wikimedia.org/wikipedia/commons/7/7a/Frans_Hals_-_Portret_van_Ren%C3%A9_Descartes.jpg" },
 { n:"PLATON", q:"Le commencement est la moitie de tout.", u:"https://upload.wikimedia.org/wikipedia/commons/8/88/Plato_Silanion_Musei_Capitolini_MC1377.jpg" }
];
function wrap(c,t,w){let a=t.split(" "),l=[],s="";for(let x of a){let z=s+x+" ";if(c.measureText(z).width>w){l.push(s.trim());s=x+" "}else s=z}l.push(s.trim());return l}
module.exports={
 config:{name:"citation",aliases:["philo"],version:"4.0",role:0,category:"fun"},
 onStart:async function({message}){
  const d=PHILOS[Math.floor(Math.random()*PHILOS.length)];
  try{
   const r=await fetch(d.u,{headers:{"User-Agent":"Mozilla/5.0"}});
   const b=Buffer.from(await r.arrayBuffer());
   const photo=await loadImage(b);
   const W=1080,H=1350,C=createCanvas(W,H),ctx=C.getContext("2d");
   ctx.drawImage(photo,0,0,W,H);
   ctx.fillStyle="rgba(15,10,30,0.78)"; ctx.beginPath(); ctx.roundRect(20,H-400,W-40,380,20); ctx.fill();
   ctx.strokeStyle="#a78bfa"; ctx.lineWidth=3; ctx.beginPath(); ctx.roundRect(20,H-400,W-40,380,20); ctx.stroke();
   ctx.fillStyle="#fff"; ctx.font="Bold 52px sans-serif"; ctx.textAlign="center";
   let lines=wrap(ctx,'"'+d.q+'"',W-120),y=H-320;
   for(let li of lines){ctx.fillText(li,W/2,y);y+=70}
   ctx.fillStyle="#a78bfa"; ctx.font="Bold 34px sans-serif"; ctx.fillText("- "+d.n+" -",W/2,H-30);
   return message.reply({attachment:C.toBuffer("image/png")});
  }catch(e){console.log("CITATION FAIL:",e); return message.reply(d.q+" - "+d.n+"\nErreur: "+e.message)}
 }
}
