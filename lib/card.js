const { createCanvas, loadImage } = require("@napi-rs/canvas");
const fs = require("fs"); const path = require("path");
const W=900,H=500; const clean=s=>String(s).replace(/[\u00a0\u202f]/g," ");
async function fetchImage(u){if(!u)return null;try{const r=await fetch(u);if(!r.ok)return null;return await loadImage(Buffer.from(await r.arrayBuffer()));}catch{return null;}}
function avatarUrl(a,i){return new Promise(r=>{a.getUserInfo(i,(e,inf)=>{if(e||!inf||!inf[i])return r(null);r(inf[i].thumbSrc||null);});});}
function fit(c,t,m,s,w="bold"){let x=s;do{c.font=`${w} ${x}px sans-serif`;x-=2;}while(c.measureText(t).width>m&&x>20);}
async function makeCard(api,userID,{title,name,big,lines=[]}){
  const canvas=createCanvas(W,H);const ctx=canvas.getContext("2d");
  const img=await fetchImage(await avatarUrl(api,userID));
  if(img){const r=Math.max(W/img.width,H/img.height);const w=img.width*r,h=img.height*r;ctx.drawImage(img,(W-w)/2,(H-h)/2,w,h);}else{const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,"#1e1b4b");g.addColorStop(1,"#7c3aed");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
  const o=ctx.createLinearGradient(0,0,W,0);o.addColorStop(0,"rgba(0,0,0,0.82)");o.addColorStop(1,"rgba(0,0,0,0.40)");ctx.fillStyle=o;ctx.fillRect(0,0,W,H);
  const cx=170,cy=250,r=105;if(img){ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.closePath();ctx.clip();const s=Math.max((2*r)/img.width,(2*r)/img.height);ctx.drawImage(img,cx-(img.width*s)/2,cy-(img.height*s)/2,img.width*s,img.height*s);ctx.restore();}
  ctx.lineWidth=6;ctx.strokeStyle="#fff";ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
  const X=330,MAXW=W-X-40;ctx.fillStyle="#c4b5fd";fit(ctx,clean(title),MAXW,30);ctx.fillText(clean(title),X,120);
  ctx.fillStyle="#fff";fit(ctx,clean(name),MAXW,46);ctx.fillText(clean(name),X,190);
  ctx.fillStyle="#fbbf24";fit(ctx,clean(big),MAXW,80);ctx.fillText(clean(big),X,295);
  ctx.fillStyle="#e5e7eb";lines.forEach((l,i)=>{fit(ctx,clean(l),MAXW,26,"normal");ctx.fillText(clean(l),X,355+i*38);});
  const file=path.join(__dirname,"..","data",`card_${userID}_${Date.now()}.png`);fs.writeFileSync(file,await canvas.encode("png"));setTimeout(()=>fs.unlink(file,()=>{}),60000);return file;
}
module.exports={makeCard};
