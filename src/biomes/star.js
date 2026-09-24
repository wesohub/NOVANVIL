import { chance, rnd } from '../core/random.js';
import { clamp01, smoothstep } from '../core/math.js';
import { fbm, ridged } from '../noise/perlin.js';
import { hsl2rgb, mixc, ramp } from '../core/palette.js';
import { tmp } from '../core/scratch.js';
import { initSub } from './scheduler.js';

/* ── 15. 恒星 / 褐矮星（彩蛋） ─────────────────── */
export const star = {
  name:"恒星 / 褐矮星",en:"STELLAR",color:"#ffd24f",weight:3,
  meta:{dia:[120000,900000],dens:[0.05,0.8],temp:[1800,32000],rot:[40,900],orb:[0,0],
    atmos:["氢-氦等离子光球","电离金属谱线","分子云包层","日冕物质抛射"],
    res:["聚变燃料","高能辐射","恒星风","等离子体"],hab:0},
  init(rand,cfg){initSub(this,rand,cfg,cfg.subIndex);},
  subs:[
  {name:"米粒组织型",w:3,hs:16,
   pal:[[16,86,18],[26,92,34],[36,94,52],[46,92,70],[52,80,88],[20,80,10],[58,60,98]],
   at:[28,95,58],ats:[1.1,1.7],amb:0.26,limb:0.62,
   traits:["自发光等离子体球","核聚变核心"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const gs=rnd(rand,14,30),spots=chance(rand,0.7);
     if(spots)cfg.traits.push("星斑活动周期");
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       w(nx*gs,ny*gs,nz*gs,wo);
       const gran=clamp01(1-wo[0]*2.2);
       const conv=fbm(n,nx*2.6+cf,ny*2.6,nz*2.6,4)*0.5+0.5;
       let t=clamp01(conv*0.62+gran*0.42-0.05);
       if(spots){
         const sp=smoothstep(0.60,0.76,fbm(n,nx*3.4+cf+40,ny*3.4,nz*3.4,3)*0.5+0.5);
         t*=1-sp*0.82;
       }
       ramp(p,t,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=150+72*t;o[4]=0;o[5]=0;
     };
   }},
  {name:"黑子群型",w:3,hs:18,
   pal:[[30,88,20],[38,92,36],[46,90,54],[54,84,72],[58,72,90],[24,84,12],[60,50,96]],
   at:[34,92,56],ats:[1.0,1.6],amb:0.26,limb:0.6,
   traits:["自发光等离子体球","大型黑子群","强耀斑活动"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const gs=rnd(rand,10,20),ss=rnd(rand,2.6,5);
     const umbra=hsl2rgb(rnd(rand,20,40),70,rnd(rand,6,14));
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       w(nx*gs,ny*gs,nz*gs,wo);
       const gran=clamp01(1-wo[0]*2.2);
       const conv=fbm(n,nx*2.6+cf,ny*2.6,nz*2.6,4)*0.5+0.5;
       let t=clamp01(conv*0.6+gran*0.44-0.05);
       w(nx*ss+cf,ny*ss,nz*ss,wo);
       const sp=1-smoothstep(0.10,0.34,wo[0]);
       const pen=1-smoothstep(0.34,0.52,wo[0]);
       t*=1-pen*0.45;
       ramp(p,t,tmp);
       mixc(tmp,umbra,sp*0.92,tmp);
       const flare=smoothstep(0.86,0.98,ridged(n,nx*6+cf,ny*6,nz*6,3));
       mixc(tmp,p[6],flare*0.8,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=(150+72*t)*(1-sp*0.85)+flare*60;o[4]=0;o[5]=0;
     };
   }},
  {name:"对流条纹型",w:2,hs:20,
   pal:[[40,82,22],[48,86,38],[54,88,56],[58,80,74],[60,66,90],[36,80,14],[62,44,96]],
   at:[44,88,58],ats:[1.05,1.65],amb:0.27,limb:0.58,
   traits:["自发光等离子体球","带状对流环"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const bands=rnd(rand,6,16),cs=rnd(rand,8,18);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const warp=fbm(n,nx*1.2+cf,ny*1.2,nz*1.2,3);
       const band=Math.sin(ny*bands+warp*3)*0.5+0.5;
       w(nx*cs+cf,ny*cs*0.35,nz*cs,wo);
       const cell=clamp01(1-wo[0]*2.1);
       const t=clamp01(band*0.5+cell*0.5);
       ramp(p,t,tmp);
       const sh2=0.86+0.3*cell;
       tmp[0]*=sh2;tmp[1]*=sh2;tmp[2]*=sh2;
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=150+72*t;o[4]=0;o[5]=0;
     };
   }},
  {name:"蓝巨星型",w:2,hs:14,
   pal:[[210,80,16],[196,84,32],[186,80,52],[176,70,74],[168,50,90],[220,70,12],[200,30,98]],
   at:[198,88,60],ats:[1.1,1.7],amb:0.28,limb:0.6,
   traits:["自发光等离子体球","蓝白高温光球"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const gs=rnd(rand,16,34);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       w(nx*gs,ny*gs,nz*gs,wo);
       const gran=clamp01(1-wo[0]*2.4);
       const conv=fbm(n,nx*3.0+cf,ny*3.0,nz*3.0,4)*0.5+0.5;
       const t=clamp01(conv*0.55+gran*0.5-0.05);
       ramp(p,t,tmp);
       const flare=smoothstep(0.8,0.97,ridged(n,nx*5+cf,ny*5,nz*5,3));
       mixc(tmp,p[6],flare*0.7,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=165+70*t;o[4]=0;o[5]=0;
     };
   }}
  ]
};
