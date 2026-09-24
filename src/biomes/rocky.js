import { rnd } from '../core/random.js';
import { clamp01, smoothstep } from '../core/math.js';
import { fbm, ridged } from '../noise/perlin.js';
import { mixc, ramp } from '../core/palette.js';
import { tmp } from '../core/scratch.js';
import { initSub } from './scheduler.js';

/* ── 5. 荒芜岩质行星 ───────────────────────────── */
export const rocky = {
  name:"荒芜岩质行星",en:"BARREN",color:"#c0b0a0",weight:11,
  meta:{dia:[2400,10200],dens:[0.9,1.35],temp:[-120,80],rot:[20,900],orb:[60,600],
    atmos:["无大气","极稀薄外逸层","痕量钠气","二氧化碳（痕量）"],
    res:["铁镍核心","钛矿","铂族金属","稀土","氦-3"],hab:6},
  init(rand,cfg){initSub(this,rand,cfg,cfg.subIndex);},
  subs:[
  {name:"陨击型",w:4,hs:20,
   pal:[[26,16,30],[24,14,44],[20,12,58],[24,8,68],[18,10,22],[30,20,38],[22,6,14]],
   at:[30,20,60],ats:[0.05,0.18],amb:0.06,limb:0.3,
   traits:["无大气真空表面","强宇宙辐射","密集陨击地貌"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const cs=rnd(rand,5,11);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       let h=fbm(n,nx*2.2+cf,ny*2.2,nz*2.2,6)*0.5+0.5;
       const maria=smoothstep(0.30,0.48,fbm(n,nx*1.1+55,ny*1.1,nz*1.1,3)*0.5+0.5);
       ramp(p,h*0.7+0.15,tmp);
       mixc(tmp,p[6],maria*0.75,tmp);
       w(nx*cs,ny*cs,nz*cs,wo);
       const f1=wo[0];
       if(f1<0.42){
         const d=smoothstep(0.02,0.30,f1);
         const rim=Math.exp(-Math.pow((f1-0.30)/0.07,2));
         const sh2=1-(1-d)*0.42+rim*0.5;
         tmp[0]*=sh2;tmp[1]*=sh2;tmp[2]*=sh2;
       }
       w(nx*cs*2.7+3,ny*cs*2.7,nz*cs*2.7,wo);
       if(wo[0]<0.3){
         const d=smoothstep(0,0.2,wo[0]);
         const sh2=1-(1-d)*0.25;
         tmp[0]*=sh2;tmp[1]*=sh2;tmp[2]*=sh2;
       }
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=8;o[5]=0;
     };
   }},
  {name:"月海玄武岩型",w:3,hs:16,
   pal:[[24,18,26],[22,16,38],[18,14,52],[16,10,32],[30,16,22],[26,10,18],[34,14,44]],
   at:[26,24,56],ats:[0.05,0.16],amb:0.06,limb:0.32,
   traits:["玄武岩月海","古老高地"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const thr=rnd(rand,0.44,0.58);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const big=fbm(n,nx*0.9+cf,ny*0.9,nz*0.9,3)*0.5+0.5;
       const det=fbm(n,nx*3.4+11,ny*3.4,nz*3.4,4)*0.5+0.5;
       const maria=smoothstep(thr-0.07,thr+0.07,big);
       // 高地：亮、破碎；月海：暗、平缓
       ramp(p,0.06+det*0.9,tmp);
       mixc(tmp,p[3],maria*0.85,tmp);
       mixc(tmp,p[4],maria*smoothstep(0.55,0.8,det)*0.5,tmp);
       const wr=ridged(n,nx*2.6+cf,ny*2.6,nz*2.6,4);
       mixc(tmp,p[6],smoothstep(0.78,0.95,wr)*maria*0.5,tmp);
       const sp=8*(1-maria*0.5);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=sp;o[5]=0;
     };
   }},
  {name:"裂谷断层型",w:2,hs:18,
   pal:[[28,20,32],[24,16,46],[20,12,60],[16,8,72],[12,10,26],[32,18,40],[18,6,16]],
   at:[24,26,58],ats:[0.05,0.18],amb:0.06,limb:0.3,
   traits:["全球性裂谷系","断层崖"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const rf=rnd(rand,2.0,3.6);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const warp=fbm(n,nx*1.3+cf,ny*1.3,nz*1.3,3);
       const rv=ridged(n,nx*rf+warp*0.7+cf,ny*rf,nz*rf+warp*0.7,5);
       const fault=smoothstep(0.58,0.9,rv);
       const base=fbm(n,nx*2.4+7,ny*2.4,nz*2.4,5)*0.5+0.5;
       ramp(p,base*0.7+0.18,tmp);
       const sh2=0.62+0.5*fault;
       tmp[0]*=sh2;tmp[1]*=sh2;tmp[2]*=sh2;
       mixc(tmp,p[4],fault*0.8,tmp);
       const wall=Math.exp(-Math.pow((rv-0.62)/0.045,2));
       mixc(tmp,p[5],wall*0.7,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=8;o[5]=0;
     };
   }},
  {name:"风化碎石型",w:2,hs:22,
   pal:[[30,22,34],[26,18,48],[22,14,62],[34,12,72],[16,12,28],[36,20,42],[20,8,18]],
   at:[32,22,58],ats:[0.05,0.2],amb:0.07,limb:0.28,
   traits:["厚层风化壳","碎石斜坡"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const gs=rnd(rand,14,26);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const base=fbm(n,nx*1.9+cf,ny*1.9,nz*1.9,5)*0.5+0.5;
       w(nx*gs+cf,ny*gs,nz*gs,wo);
       const grit=clamp01(1-wo[0]*2.9);
       ramp(p,base*0.72+0.16,tmp);
       const sh2=0.72+0.5*grit;
       tmp[0]*=sh2;tmp[1]*=sh2;tmp[2]*=sh2;
       const slope=smoothstep(0.5,0.8,fbm(n,nx*3.2+31,ny*3.2,nz*3.2,4)*0.5+0.5);
       mixc(tmp,p[5],slope*0.45,tmp);
       mixc(tmp,p[6],smoothstep(0.25,0.1,base)*0.7,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=6;o[5]=0;
     };
   }}
  ]
};
