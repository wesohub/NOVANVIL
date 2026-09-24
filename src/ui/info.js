import { $, fmt } from './dom.js';
import { habLabel, hazLabel } from '../planet/stats.js';
export function updateInfo(P){
  const bm=P.biome,s=P.stats;
  const tt=$("typetag");
  tt.style.color=bm.color;
  tt.querySelector("span").textContent=bm.name+" · "+bm.en+(P.sub?" · "+P.sub:"");
  $("pname").textContent=P.name;
  $("pepi").textContent=P.epi;
  $("pseed").textContent=P.seed;
  $("pdesc").textContent=describe(P);

  const rows=[
    ["直径 DIAMETER",fmt(s.dia)+" <small>km</small>"],
    ["质量 MASS",s.mass<0.01?s.mass.toExponential(2):s.mass.toFixed(s.mass<10?2:1)+" <small>M⊕</small>"],
    ["表面重力",s.grav.toFixed(2)+" <small>g</small>"],
    ["平均温度",s.temp+" <small>°C</small>"],
    ["自转周期",s.rot+" <small>h</small>"],
    ["轨道周期",s.orb?s.orb+" <small>d</small>":"—"],
    ["卫星数量",s.moons+" <small>颗</small>"]
  ];
  let html="";
  for(const [k,v] of rows)html+='<div class="st"><div class="k">'+k+'</div><div class="v">'+v+"</div></div>";
  html+='<div class="st wide"><div class="k">大气成分 ATMOSPHERE</div><div class="v" style="font-size:13px">'+s.atmos+"</div></div>";
  html+='<div class="st wide"><div class="k">主要资源 RESOURCES</div><div class="v" style="font-size:13px">'+s.res.join(" · ")+"</div></div>";
  $("stats").innerHTML=html;

  $("habV").textContent=s.hab+" / 100 · "+habLabel(s.hab);
  $("habBar").style.width=s.hab+"%";
  $("hazV").textContent=hazLabel(s.haz);
  $("hazBar").style.width=s.haz+"%";

  const cls=["","",""];
  $("traits").innerHTML=P.traits.map((t,i)=>{
    const c=i%5===0?"gold":(i%3===0?"warn":(i%4===0?"good":""));
    return '<span class="chip '+c+'">'+t+"</span>";
  }).join("");
}
export function describe(P){
  const s=P.stats,bm=P.biome;
  const parts=[];
  parts.push("一颗"+bm.name+(P.sub?"（"+P.sub+"）":""));
  if(s.dia>50000)parts.push("体积远超标准类地行星");
  else if(s.dia<5000)parts.push("尺寸小于多数类地世界");
  parts.push("地表平均温度 "+s.temp+"°C");
  parts.push(s.atmos);
  if(s.hab>60)parts.push("具备直接殖民潜力");
  else if(s.hab>30)parts.push("需加压密闭设施方可驻留");
  else parts.push("环境极端，仅适合无人探测");
  parts.push("。");
  return parts.join("，").replace("，，","，");
}
