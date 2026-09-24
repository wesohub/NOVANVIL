import { chance, rnd } from '../core/random.js';
import { PI, clamp01, smoothstep } from '../core/math.js';
import { fbm, ridged } from '../noise/perlin.js';
import { hsl2rgb, mixc, ramp } from '../core/palette.js';
import { tmp } from '../core/scratch.js';
import { initSub } from './scheduler.js';

/* ── 13. 生物质行星（幻想） ────────────────────── */
export const organic = {
  name:"生物质行星",en:"BIOSPHERE",color:"#ff7ad0",weight:5,
  meta:{dia:[7400,19000],dens:[0.8,1.15],temp:[-20,70],rot:[12,300],orb:[150,1100],
    atmos:["氧-孢子悬浮","甲烷-氨生物大气","含孢子的氮氧","腐殖质雾"],
    res:["活性生物质","共生菌群","生物聚合物","神经毒素","酶制剂"],hab:32},
  init(rand,cfg){initSub(this,rand,cfg,cfg.subIndex);},
  subs:[
  {name:"菌丝脉络型",w:3,hs:30,
   pal:[[318,42,20],[300,44,32],[286,38,44],[340,48,34],[96,36,26],[54,48,30],[16,50,26]],
   at:[300,64,62],ats:[0.4,0.8],amb:0.1,limb:0.18,cloudP:0.4,cloudMul:1.2,
   traits:["全球活体表面","行星级生命活动"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const spore=chance(rand,0.7),pores=chance(rand,0.6);
     const sporeCol=hsl2rgb(rnd(rand,120,330),90,rnd(rand,62,80));
     if(spore)cfg.traits.push("发光孢子云");
     if(pores)cfg.traits.push("巨型呼吸气孔");
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const w1=fbm(n,nx*1.4+cf,ny*1.4,nz*1.4,3);
       const h=fbm(n,nx*2.2+w1*0.9+cf,ny*2.2,nz*2.2+w1*0.9,5)*0.5+0.5;
       ramp(p,clamp01((h-0.5)*1.7+0.5),tmp);
       const vein=ridged(n,nx*5.2+cf,ny*5.2,nz*5.2,4);
       mixc(tmp,p[6],smoothstep(0.66,0.9,vein)*0.75,tmp);
       let em=0;
       if(pores){
         w(nx*3.1,ny*3.1,nz*3.1,wo);
         if(wo[0]<0.30){
           const d=1-smoothstep(0.02,0.30,wo[0]);
           mixc(tmp,p[0],d*0.85,tmp);em=Math.max(em,d*70);
         }
       }
       if(spore){
         w(nx*14+cf,ny*14,nz*14,wo);
         if(wo[0]<0.16){
           const d=1-smoothstep(0.02,0.16,wo[0]);
           em=Math.max(em,d*225);
           tmp[0]+=sporeCol[0]*d*0.3;tmp[1]+=sporeCol[1]*d*0.3;tmp[2]+=sporeCol[2]*d*0.3;
         }
       }
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=em;o[4]=h*45;
       o[5]=cfg.hasCloud?smoothstep(0.56,0.78,fbm(n,nx*2.9+5,ny*2.9,nz*2.9,4)*0.5+0.5)*130:0;
     };
   }},
  {name:"细胞组织型",w:3,hs:28,
   pal:[[344,44,24],[328,48,34],[310,42,44],[292,38,34],[270,36,26],[14,44,28],[36,50,36]],
   at:[330,60,60],ats:[0.45,0.85],amb:0.11,limb:0.16,cloudP:0.35,cloudMul:1.15,
   traits:["细胞状组织表面","半透明质膜"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const cs=rnd(rand,4,10);
     const nucleus=hsl2rgb(rnd(rand,300,350),rnd(rand,60,85),rnd(rand,20,34));
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       w(nx*cs+cf,ny*cs,nz*cs,wo);
       const f1=wo[0],f2=wo[1],id=wo[2];
       const memb=1-smoothstep(0.01,0.09,f2-f1);   // 细胞膜
       const nuc=1-smoothstep(0.04,0.24,f1);       // 细胞核
       const cyto=smoothstep(0.10,0.34,f1);
       const base=fbm(n,nx*2.4+cf,ny*2.4,nz*2.4,4)*0.5+0.5;
       ramp(p,base*0.5+0.25+id*0.15,tmp);
       const sh2=0.55+0.6*cyto+0.3*memb;
       tmp[0]*=sh2;tmp[1]*=sh2;tmp[2]*=sh2;
       mixc(tmp,nucleus,nuc*0.85,tmp);
       mixc(tmp,p[6],memb*0.7,tmp);
       const em=Math.pow(nuc,1.5)*90+Math.pow(memb,2)*40;
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=em;o[4]=40+cyto*120;
       o[5]=cfg.hasCloud?smoothstep(0.58,0.8,fbm(n,nx*2.6+27,ny*2.6,nz*2.6,4)*0.5+0.5)*120:0;
     };
   }},
  {name:"甲壳分节型",w:2,hs:26,
   pal:[[26,40,22],[16,46,30],[8,42,40],[350,38,32],[338,34,44],[44,36,26],[58,30,52]],
   at:[20,48,56],ats:[0.4,0.75],amb:0.1,limb:0.2,cloudP:0.3,cloudMul:1.1,
   traits:["分节甲壳","几丁质外壳"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const seg=rnd(rand,6,14),cs=rnd(rand,8,18);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const segv=Math.abs(Math.sin(G.v*Math.PI*seg));
       const joint=smoothstep(0.86,1.0,segv);
       w(nx*cs+cf,ny*cs*0.6,nz*cs,wo);
       const scale=smoothstep(0.01,0.10,wo[1]-wo[0]);
       const base=fbm(n,nx*2.6+cf,ny*2.6,nz*2.6,4)*0.5+0.5;
       ramp(p,base*0.55+0.2,tmp);
       const sh2=0.5+0.7*segv+0.25*scale;
       tmp[0]*=sh2;tmp[1]*=sh2;tmp[2]*=sh2;
       mixc(tmp,p[5],joint*0.8,tmp);
       mixc(tmp,p[6],scale*0.45,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=30+segv*110;
       o[5]=cfg.hasCloud?smoothstep(0.6,0.82,fbm(n,nx*2.8+41,ny*2.8,nz*2.8,4)*0.5+0.5)*115:0;
     };
   }}
  ]
};
