import { rint, rnd } from '../core/random.js';
import { TAU, clamp01, smoothstep } from '../core/math.js';
import { fbm, turb } from '../noise/perlin.js';
import { hsl2rgb, mixc, ramp } from '../core/palette.js';
import { applyStorms, makeStorms } from '../core/storms.js';
import { tmp } from '../core/scratch.js';
import { initSub } from './scheduler.js';

/* ── 9. 气态巨行星 ─────────────────────────────── */
export const gas = {
  name:"气态巨行星",en:"JOVIAN",color:"#ffb870",weight:11,
  meta:{dia:[68000,210000],dens:[0.22,0.45],temp:[-160,-40],rot:[6,18],orb:[800,5200],
    atmos:["氢-氦（含氨云）","氢-氦-甲烷","氢-氦-硫化氢","氢-氦+金属氢层"],
    res:["氦-3","氢","氨晶体","金属氢","氘"],hab:0},
  init(rand,cfg){initSub(this,rand,cfg,cfg.subIndex);},
  subs:[
  {name:"规则条带型",w:4,hs:28,
   pal:[[28,52,26],[34,60,44],[20,50,58],[42,44,72],[10,40,34]],
   at:[34,60,62],ats:[0.35,0.7],amb:0.09,limb:0.3,
   traits:["流体表面无固态地壳","超音速带状急流","强大磁层"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const bands=rnd(rand,9,20),turbA=rnd(rand,0.7,1.4);
     const storms=makeStorms(rand,rint(rand,1,4),0.72);
     const spotCol=hsl2rgb(rnd(rand,350,380),rnd(rand,60,90),rnd(rand,34,50));
     const whiteCol=hsl2rgb(40,rnd(rand,10,30),rnd(rand,80,95));
     if(storms.some(s=>s.big))cfg.traits.push("巨型反气旋风暴");
     return function(c,G,o){
       applyStorms(storms,G.lon,G.lat,G);
       const lat=G.lat,rc=Math.cos(lat);
       const px=Math.cos(G.lon)*rc,py=Math.sin(lat),pz=Math.sin(G.lon)*rc;
       const t1=turb(n,px*1.1+cf,py*1.1,pz*1.1,4);
       const band=Math.sin(lat*bands+t1*turbA)*0.5+0.5;
       const det=fbm(n,px*3.2+cf,py*26,pz*3.2,4)*0.5;
       let t=clamp01(band*0.9+0.05+det*0.16);
       t*=1-smoothstep(0.68,1.0,Math.abs(py))*0.38;
       ramp(p,t,tmp);
       if(G.storm>0){
         const s=storms[G.stormId];
         const k=smoothstep(0.05,0.55,G.storm);
         mixc(tmp,s.big?spotCol:whiteCol,k*(s.big?0.92:0.8),tmp);
       }
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=0;o[5]=0;
     };
   }},
  {name:"湍流涡旋型",w:3,hs:30,
   pal:[[210,40,22],[196,44,38],[186,50,52],[224,34,66],[200,30,30]],
   at:[200,50,60],ats:[0.35,0.7],amb:0.09,limb:0.3,
   traits:["流体表面无固态地壳","全域湍流涡旋","强大磁层"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const bands=rnd(rand,4,9),turbA=rnd(rand,2.0,3.4);
     const storms=makeStorms(rand,rint(rand,5,10),0.8);
     const whiteCol=hsl2rgb(rnd(rand,30,60),rnd(rand,20,40),rnd(rand,80,94));
     return function(c,G,o){
       applyStorms(storms,G.lon,G.lat,G);
       const lat=G.lat,rc=Math.cos(lat);
       const px=Math.cos(G.lon)*rc,py=Math.sin(lat),pz=Math.sin(G.lon)*rc;
       const t1=turb(n,px*1.8+cf,py*1.8,pz*1.8,5);
       const band=Math.sin(lat*bands+t1*turbA)*0.5+0.5;
       const det=fbm(n,px*5.5+cf,py*20,pz*5.5,4)*0.5;
       let t=clamp01(band*0.6+0.2+det*0.45+t1*0.12);
       t*=1-smoothstep(0.7,1.0,Math.abs(py))*0.34;
       ramp(p,t,tmp);
       if(G.storm>0){
         const k=smoothstep(0.05,0.5,G.storm);
         mixc(tmp,whiteCol,k*0.75,tmp);
       }
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=0;o[5]=0;
     };
   }},
  {name:"大红斑型",w:3,hs:26,
   pal:[[8,58,30],[16,64,44],[2,50,58],[30,52,72],[350,44,38]],
   at:[12,62,60],ats:[0.4,0.75],amb:0.09,limb:0.3,
   traits:["流体表面无固态地壳","巨型反气旋风暴","超音速带状急流"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const bands=rnd(rand,7,14);
     const big={lon:rand()*TAU,lat:rnd(rand,-0.34,0.34),r:rnd(rand,0.26,0.4),swirl:rnd(rand,2.2,4)*(rand()<0.5?-1:1),big:true};
     const others=makeStorms(rand,rint(rand,1,3),0.7);
     const storms=[big].concat(others);
     const spotCol=hsl2rgb(rnd(rand,2,26),rnd(rand,78,95),rnd(rand,40,54));
     return function(c,G,o){
       applyStorms(storms,G.lon,G.lat,G);
       const lat=G.lat,rc=Math.cos(lat);
       const px=Math.cos(G.lon)*rc,py=Math.sin(lat),pz=Math.sin(G.lon)*rc;
       const t1=turb(n,px*1.2+cf,py*1.2,pz*1.2,4);
       const band=Math.sin(lat*bands+t1*1.1)*0.5+0.5;
       const det=fbm(n,px*3.4+cf,py*24,pz*3.4,4)*0.5;
       let t=clamp01(band*0.86+0.07+det*0.2);
       t*=1-smoothstep(0.7,1.0,Math.abs(py))*0.36;
       ramp(p,t,tmp);
       if(G.storm>0){
         const s=storms[G.stormId];
         const k=smoothstep(0.04,0.5,G.storm);
         if(s.big)mixc(tmp,spotCol,k*0.95,tmp);
         else mixc(tmp,p[4],k*0.6,tmp);
       }
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=0;o[5]=0;
     };
   }},
  {name:"柔和薄雾型",w:2,hs:24,
   pal:[[46,36,24],[38,32,40],[52,28,56],[30,24,30],[44,40,70]],
   at:[44,34,62],ats:[0.3,0.6],amb:0.11,limb:0.32,
   traits:["流体表面无固态地壳","高层薄雾遮盖"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const bands=rnd(rand,2.5,5);
     return function(c,G,o){
       const lat=G.lat,rc=Math.cos(lat);
       const px=Math.cos(G.lon)*rc,py=Math.sin(lat),pz=Math.sin(G.lon)*rc;
       const t1=turb(n,px*0.9+cf,py*0.9,pz*0.9,4);
       const band=Math.sin(lat*bands+t1*0.8)*0.5+0.5;
       const haze=fbm(n,px*1.6+cf,py*1.6,pz*1.6,5)*0.5+0.5;
       let t=clamp01(band*0.42+haze*0.5+0.1);
       t*=1-smoothstep(0.6,1.0,Math.abs(py))*0.3;
       ramp(p,t,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=0;o[5]=0;
     };
   }}
  ]
};
