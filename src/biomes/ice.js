import { chance, rnd } from '../core/random.js';
import { clamp01, smoothstep } from '../core/math.js';
import { fbm, ridged } from '../noise/perlin.js';
import { mixc, ramp } from '../core/palette.js';
import { tmp } from '../core/scratch.js';
import { initSub } from './scheduler.js';

/* ── 4. 冰封世界 ───────────────────────────────── */
export const ice = {
  name:"冰封世界",en:"CRYO",color:"#a8e8ff",weight:9,
  meta:{dia:[4800,12400],dens:[0.7,1.05],temp:[-190,-28],rot:[16,300],orb:[240,1400],
    atmos:["氮-甲烷（稀薄）","二氧化碳霜雾","极稀薄水蒸气","无大气（真空冰面）"],
    res:["水冰","甲烷冰","氨晶体","金属氢","冻结核燃料"],hab:14},
  init(rand,cfg){initSub(this,rand,cfg,cfg.subIndex);},
  subs:[
  {name:"裂隙冰原型",w:3,hs:16,
   pal:[[204,42,88],[196,50,76],[210,58,58],[220,46,40],[16,44,16],[188,38,92],[130,30,44]],
   at:[196,58,74],ats:[0.3,0.6],amb:0.09,limb:0.24,cloudP:0.35,cloudMul:0.9,
   traits:["全球冰盖","深层地下海洋"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const subs=chance(rand,0.55);
     if(subs)cfg.traits.push("冰下液态水层");
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const base=fbm(n,nx*1.9+cf,ny*1.9,nz*1.9,5)*0.5+0.5;
       const cr=ridged(n,nx*4.2+cf,ny*4.2,nz*4.2,4);
       const crack=smoothstep(0.62,0.88,cr);
       ramp(p,base*0.75+0.2,tmp);
       mixc(tmp,p[2],crack*0.85,tmp);
       mixc(tmp,p[4],smoothstep(0.28,0.1,base)*0.9,tmp);
       if(subs){
         const lake=smoothstep(0.70,0.84,fbm(n,nx*2.2+40,ny*2.2,nz*2.2,3)*0.5+0.5);
         mixc(tmp,p[6],lake*0.7,tmp);
       }
       const sp=255*(1-crack*0.7)*(0.3+0.7*smoothstep(0.35,0.6,base));
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=sp;
       o[5]=cfg.hasCloud?smoothstep(0.62,0.82,fbm(n,nx*2.8+15,ny*2.8,nz*2.8,4)*0.5+0.5)*110:0;
     };
   }},
  {name:"冰川条纹型",w:3,hs:14,
   pal:[[198,50,84],[192,56,70],[186,62,56],[202,48,44],[210,36,92],[176,44,64],[14,40,18]],
   at:[194,60,76],ats:[0.32,0.62],amb:0.09,limb:0.22,cloudP:0.4,cloudMul:0.95,
   traits:["流动冰川","冰流线理"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const fl=rnd(rand,1.0,2.2);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const q=fbm(n,nx*1.1+cf,ny*1.1,nz*1.1,3);
       // 沿经线拉伸的流线：域扭曲后做条带
       const flow=Math.sin(ny*7+q*fl*6+nx*0.6)*0.5+0.5;
       const base=fbm(n,nx*2.0+cf,ny*2.0,nz*2.0,4)*0.5+0.5;
       ramp(p,clamp01(base*0.55+flow*0.35+0.1),tmp);
       const shear=smoothstep(0.72,0.95,ridged(n,nx*3.2+q,ny*3.2,nz*3.2,4));
       mixc(tmp,p[4],shear*0.7,tmp);
       mixc(tmp,p[5],smoothstep(0.7,0.9,flow)*0.5,tmp);
       const sp=255*(0.35+0.65*flow)*(1-shear*0.5);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=sp;
       o[5]=cfg.hasCloud?smoothstep(0.6,0.82,fbm(n,nx*2.6+71,ny*2.6,nz*2.6,4)*0.5+0.5)*105:0;
     };
   }},
  {name:"霜晶型",w:2,hs:18,
   pal:[[200,36,90],[194,44,78],[204,52,64],[186,40,52],[210,28,94],[176,36,70],[16,34,20]],
   at:[198,52,78],ats:[0.28,0.58],amb:0.1,limb:0.26,cloudP:0.3,cloudMul:0.85,
   traits:["霜晶结壳","升华-再凝结循环"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const cs=rnd(rand,6,13);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const base=fbm(n,nx*1.8+cf,ny*1.8,nz*1.8,5)*0.5+0.5;
       w(nx*cs+cf,ny*cs,nz*cs,wo);
       const f1=wo[0],edge=smoothstep(0.006,0.05,wo[1]-wo[0]);
       w(nx*cs*2.4+5,ny*cs*2.4,nz*cs*2.4,wo);
       const e2=smoothstep(0.004,0.035,wo[1]-wo[0]);
       ramp(p,base*0.7+0.15,tmp);
       const shade=0.66+0.44*(1-clamp01(f1*2.4))+0.22*edge+0.12*e2;
       tmp[0]*=shade;tmp[1]*=shade;tmp[2]*=shade;
       mixc(tmp,p[5],e2*0.6,tmp);
       mixc(tmp,p[6],smoothstep(0.3,0.12,base)*0.85,tmp);
       const sp=255*clamp01(edge*0.7+e2*0.5+0.25);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=sp;
       o[5]=cfg.hasCloud?smoothstep(0.62,0.84,fbm(n,nx*3+25,ny*3,nz*3,4)*0.5+0.5)*100:0;
     };
   }},
  {name:"薄冰斑驳型",w:2,hs:16,
   pal:[[206,40,86],[196,48,72],[188,54,56],[32,30,30],[24,24,22],[214,30,92],[136,26,44]],
   at:[200,54,72],ats:[0.3,0.62],amb:0.09,limb:0.24,cloudP:0.45,cloudMul:1.0,
   traits:["薄冰覆盖","裸露基岩"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const thr=rnd(rand,0.42,0.6);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const base=fbm(n,nx*2.1+cf,ny*2.1,nz*2.1,5)*0.5+0.5;
       const patch=smoothstep(thr-0.06,thr+0.06,base);
       const rockN=fbm(n,nx*4.6+19,ny*4.6,nz*4.6,4)*0.5+0.5;
       ramp(p,0.2+rockN*0.6,tmp);         // 基岩
       mixc(tmp,p[0],patch*0.92,tmp);      // 覆冰
       mixc(tmp,p[2],patch*smoothstep(0.62,0.85,rockN)*0.5,tmp);
       const crack=smoothstep(0.74,0.93,ridged(n,nx*5.4+cf,ny*5.4,nz*5.4,4));
       mixc(tmp,p[6],crack*patch*0.7,tmp);
       const sp=255*(patch*(1-crack*0.6)*0.9+(1-patch)*0.12);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=sp;
       o[5]=cfg.hasCloud?smoothstep(0.6,0.82,fbm(n,nx*2.9+47,ny*2.9,nz*2.9,4)*0.5+0.5)*110:0;
     };
   }}
  ]
};
