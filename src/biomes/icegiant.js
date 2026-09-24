import { rint, rnd } from '../core/random.js';
import { clamp01, smoothstep } from '../core/math.js';
import { fbm, turb } from '../noise/perlin.js';
import { hsl2rgb, mixc, ramp } from '../core/palette.js';
import { applyStorms, makeStorms } from '../core/storms.js';
import { tmp } from '../core/scratch.js';
import { initSub } from './scheduler.js';

/* ── 10. 冰巨星 ────────────────────────────────── */
export const icegiant = {
  name:"冰巨星",en:"NEPTUNIAN",color:"#5ad8ff",weight:8,
  meta:{dia:[32000,78000],dens:[0.28,0.52],temp:[-220,-150],rot:[8,22],orb:[1600,9800],
    atmos:["氢-氦-甲烷","水-氨-甲烷『冰』混合物","氢-氦+深层离子水","氦-甲烷"],
    res:["氦-3","甲烷","氨","重水","氢"],hab:0},
  init(rand,cfg){initSub(this,rand,cfg,cfg.subIndex);},
  subs:[
  {name:"静谧条纹型",w:3,hs:18,
   pal:[[196,68,20],[190,72,34],[184,66,48],[200,58,66],[210,44,84],[176,60,26],[226,50,70]],
   at:[196,80,64],ats:[0.5,0.85],amb:0.12,limb:0.32,
   traits:["甲烷吸收红光呈蓝色","内部离子水层"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const bands=rnd(rand,3,7);
     const storms=makeStorms(rand,rint(rand,0,2),0.8);
     const spot=hsl2rgb(210,rnd(rand,40,60),rnd(rand,70,84));
     return function(c,G,o){
       applyStorms(storms,G.lon,G.lat,G);
       const lat=G.lat,rc=Math.cos(lat);
       const px=Math.cos(G.lon)*rc,py=Math.sin(lat),pz=Math.sin(G.lon)*rc;
       const t1=fbm(n,px*1.3+cf,py*1.3,pz*1.3,4);
       const band=Math.sin(lat*bands+t1*1.6)*0.5+0.5;
       const det=fbm(n,px*2.2+cf,py*14,pz*2.2,4)*0.5;
       let t=clamp01(band*0.7+0.18+det*0.14);
       ramp(p,t,tmp);
       mixc(tmp,p[5],smoothstep(0.80,0.97,Math.abs(py))*0.75,tmp);
       if(G.storm>0)mixc(tmp,spot,smoothstep(0.05,0.5,G.storm)*0.7,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=0;o[5]=0;
     };
   }},
  {name:"极涡型",w:3,hs:16,
   pal:[[204,64,18],[198,70,32],[192,64,46],[210,52,62],[220,40,84],[184,56,24],[230,44,74]],
   at:[200,78,66],ats:[0.55,0.9],amb:0.12,limb:0.34,
   traits:["甲烷吸收红光呈蓝色","双极涡旋"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const bands=rnd(rand,2,5);
     const storms=makeStorms(rand,rint(rand,1,3),0.85);
     const dark=hsl2rgb(202,rnd(rand,60,80),rnd(rand,16,26));
     return function(c,G,o){
       applyStorms(storms,G.lon,G.lat,G);
       const lat=G.lat,rc=Math.cos(lat);
       const px=Math.cos(G.lon)*rc,py=Math.sin(lat),pz=Math.sin(G.lon)*rc;
       const t1=fbm(n,px*1.2+cf,py*1.2,pz*1.2,4);
       const band=Math.sin(lat*bands+t1*1.3)*0.5+0.5;
       const det=fbm(n,px*2.6+cf,py*16,pz*2.6,4)*0.5;
       let t=clamp01(band*0.66+0.2+det*0.16);
       ramp(p,t,tmp);
       // 极涡：绕极点的螺旋
       const pv=smoothstep(0.62,0.95,Math.abs(py));
       const spin=Math.sin(Math.atan2(pz,px)*2+Math.abs(py)*9)*0.5+0.5;
       mixc(tmp,p[6],pv*spin*0.8,tmp);
       mixc(tmp,dark,pv*(1-spin)*0.6,tmp);
       if(G.storm>0)mixc(tmp,dark,smoothstep(0.05,0.5,G.storm)*0.85,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=0;o[5]=0;
     };
   }},
  {name:"风暴条纹型",w:2,hs:20,
   pal:[[190,72,18],[186,76,30],[180,70,44],[200,60,62],[214,46,82],[176,64,24],[224,52,72]],
   at:[192,82,62],ats:[0.5,0.9],amb:0.12,limb:0.3,
   traits:["甲烷吸收红光呈蓝色","超音速风暴","白色风暴链"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const bands=rnd(rand,5,11);
     const storms=makeStorms(rand,rint(rand,4,9),0.85);
     const white=hsl2rgb(rnd(rand,190,215),rnd(rand,20,40),rnd(rand,86,96));
     return function(c,G,o){
       applyStorms(storms,G.lon,G.lat,G);
       const lat=G.lat,rc=Math.cos(lat);
       const px=Math.cos(G.lon)*rc,py=Math.sin(lat),pz=Math.sin(G.lon)*rc;
       const t1=turb(n,px*1.6+cf,py*1.6,pz*1.6,4);
       const band=Math.sin(lat*bands+t1*2.0)*0.5+0.5;
       const streak=fbm(n,px*2.0+cf,py*30,pz*2.0,3)*0.5;
       let t=clamp01(band*0.7+0.16+streak*0.3+t1*0.1);
       ramp(p,t,tmp);
       if(G.storm>0)mixc(tmp,white,smoothstep(0.05,0.5,G.storm)*0.85,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=0;o[5]=0;
     };
   }}
  ]
};
