import { chance, rint, rnd } from '../core/random.js';
import { clamp01, smoothstep } from '../core/math.js';
import { fbm, ridged, turb } from '../noise/perlin.js';
import { mixc, ramp } from '../core/palette.js';
import { applyStorms, makeStorms } from '../core/storms.js';
import { tmp } from '../core/scratch.js';
import { initSub } from './scheduler.js';

/* ── 8. 酸雾毒气行星 ───────────────────────────── */
export const toxic = {
  name:"酸雾毒气行星",en:"TOXIC",color:"#b6ff5a",weight:7,
  meta:{dia:[6800,15000],dens:[0.85,1.2],temp:[120,480],rot:[18,240],orb:[40,320],
    atmos:["硫酸云层","二氧化碳-硫化氢","氯-氟化合物","高压氨-甲烷"],
    res:["硫化物","硫酸","重金属雾","耐极端酶","卤素"],hab:1},
  init(rand,cfg){initSub(this,rand,cfg,cfg.subIndex);},
  subs:[
  {name:"硫酸云海型",w:3,hs:24,
   pal:[[72,70,32],[58,62,22],[88,58,44],[46,72,30],[30,50,18],[96,44,58],[20,40,26]],
   at:[80,64,56],ats:[0.7,1.0],amb:0.2,limb:0.12,
   traits:["浓厚酸云","表面高压高温"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const storms=makeStorms(rand,rint(rand,2,5),0.75);
     const surf=chance(rand,0.5);
     if(surf)cfg.traits.push("云隙可见地表");
     return function(c,G,o){
       applyStorms(storms,G.lon,G.lat,G);
       const lon=G.lon,lat=G.lat,rc=Math.cos(lat);
       const px=Math.cos(lon)*rc,py=Math.sin(lat),pz=Math.sin(lon)*rc;
       const sw=turb(n,px*1.4+cf,py*1.4,pz*1.4,4);
       let t=fbm(n,px*2.3+sw*0.9,py*2.3,pz*2.3+sw*0.9,5)*0.5+0.5;
       t=clamp01(t*0.8+0.1+sw*0.12);
       ramp(p,t,tmp);
       if(surf&&G.storm<0.2){
         const gap=smoothstep(0.72,0.9,fbm(n,px*1.6+cf,py*1.6,pz*1.6,3)*0.5+0.5);
         mixc(tmp,p[6],gap*0.8,tmp);
       }
       if(G.storm>0)mixc(tmp,p[5],G.storm*0.65,tmp);
       const sh2=1-smoothstep(0.72,1.0,Math.abs(py))*0.3;
       tmp[0]*=sh2;tmp[1]*=sh2;tmp[2]*=sh2;
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=0;o[5]=0;
     };
   }},
  {name:"硫磺地壳型",w:3,hs:20,
   pal:[[54,82,34],[48,88,48],[42,76,64],[38,60,30],[28,48,20],[96,50,58],[18,40,24]],
   at:[56,72,54],ats:[0.55,0.9],amb:0.18,limb:0.16,
   traits:["硫磺沉积层","火山喷气孔"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const vs=rnd(rand,5,10);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const base=fbm(n,nx*2.0+cf,ny*2.0,nz*2.0,5)*0.5+0.5;
       ramp(p,base*0.8+0.1,tmp);
       w(nx*vs+cf,ny*vs,nz*vs,wo);
       const vent=1-smoothstep(0.02,0.20,wo[0]);
       const crust=smoothstep(0.55,0.8,fbm(n,nx*3.6+9,ny*3.6,nz*3.6,4)*0.5+0.5);
       mixc(tmp,p[5],crust*0.7,tmp);
       mixc(tmp,p[6],smoothstep(0.35,0.12,base)*0.8,tmp);
       const sh2=1-vent*0.4;
       tmp[0]*=sh2;tmp[1]*=sh2;tmp[2]*=sh2;
       const em=Math.pow(vent,1.4)*180;
       mixc(tmp,p[3],vent*0.8,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=em;o[4]=crust*40;o[5]=0;
     };
   }},
  {name:"酸雨侵蚀型",w:2,hs:24,
   pal:[[80,64,28],[68,58,20],[56,52,34],[40,46,24],[30,38,18],[100,40,52],[22,34,22]],
   at:[74,60,52],ats:[0.6,0.95],amb:0.19,limb:0.14,
   traits:["持续酸雨侵蚀","溶蚀沟槽"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const gr=rnd(rand,3.0,6.0);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const warp=fbm(n,nx*1.2+cf,ny*1.2,nz*1.2,3);
       const gut=smoothstep(0.66,0.92,ridged(n,nx*gr+warp*0.7+cf,ny*gr,nz*gr+warp*0.7,5));
       const base=fbm(n,nx*2.2+cf,ny*2.2,nz*2.2,5)*0.5+0.5;
       ramp(p,clamp01((base-0.5)*1.6+0.5),tmp);
       const sh2=0.68+0.5*gut;
       tmp[0]*=sh2;tmp[1]*=sh2;tmp[2]*=sh2;
       mixc(tmp,p[6],gut*0.75,tmp);
       mixc(tmp,p[5],smoothstep(0.8,0.95,base)*0.4,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=gut*30;o[4]=gut*90;o[5]=0;
     };
   }}
  ]
};
