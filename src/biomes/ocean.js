import { rnd } from '../core/random.js';
import { clamp01, smoothstep } from '../core/math.js';
import { fbm, turb } from '../noise/perlin.js';
import { iceCap } from '../noise/icecap.js';
import { mixc } from '../core/palette.js';
import { tmp } from '../core/scratch.js';
import { initSub } from './scheduler.js';

/* ── 2. 全球海洋行星 ───────────────────────────── */
export const ocean = {
  name:"全球海洋行星",en:"PELAGIC",color:"#4fa8ff",weight:8,
  meta:{dia:[9000,19000],dens:[0.8,1.15],temp:[-12,58],rot:[11,60],orb:[200,700],
    atmos:["氮-水蒸气（浓雾）","富氧+高湿","氢-氦稀薄+水汽","二氧化碳-氮"],
    res:["液态水","重水","深海生物质","溶解矿物","盐晶"],hab:64},
  init(rand,cfg){initSub(this,rand,cfg,cfg.subIndex);},
  subs:[
  {name:"无陆深渊型",w:3,hs:14,
   pal:[[224,84,6],[206,64,16],[190,56,32],[176,46,52],[236,12,94],[150,28,54],[38,26,34]],
   at:[196,74,66],ats:[0.6,0.9],amb:0.08,limb:0.2,cloudP:1,cloudMul:1.1,
   traits:["无大陆深海","全球性洋流"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const sea=rnd(rand,0.72,0.86),cov=rnd(rand,0.5,0.85);
     const ic=cfg._ice;
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const sw=turb(n,nx*0.9+cf,ny*0.9,nz*0.9,3);
       let h=fbm(n,nx*1.5+sw*0.5+cf,ny*1.5,nz*1.5+sw*0.5,5)*0.5+0.5;
       const latf=Math.abs(ny);let sp=200;
       const t=smoothstep(sea-0.34,sea,h);
       mixc(p[0],p[3],t,tmp);
       mixc(tmp,p[4],smoothstep(0.86,1.0,t),tmp);
       sp=255*(1-t*0.3);
       const icv=iceCap(n,nx,ny,nz,latf,0.78,0.13,cf,true,ic);
       if(icv>0){
         mixc(tmp,p[4],icv,tmp);
         const k=1+(ic[0]-0.5)*0.20*icv;
         tmp[0]*=k;tmp[1]*=k;tmp[2]*=k;
       }
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=sp;
       const cl=fbm(n,nx*2.2+44,ny*2.2,nz*2.2,4)*0.5+0.5;
       o[5]=smoothstep(0.4,0.62,cl)*cov*255;
     };
   }},
  {name:"环礁浅海型",w:3,hs:12,
   pal:[[192,88,10],[184,62,26],[172,52,44],[56,40,42],[44,34,54],[204,22,88],[36,28,34]],
   at:[190,72,68],ats:[0.55,0.85],amb:0.09,limb:0.2,cloudP:1,cloudMul:1.2,
   traits:["环礁群岛","浅海大陆架"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const sea=rnd(rand,0.60,0.72),is=rnd(rand,7,14),cov=rnd(rand,0.45,0.8);
     const ic=cfg._ice;
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const base=fbm(n,nx*1.4+cf,ny*1.4,nz*1.4,4)*0.5+0.5;
       w(nx*is+cf,ny*is,nz*is,wo);
       const ring=Math.exp(-Math.pow((wo[0]-0.30)/0.075,2));
       const core=1-smoothstep(0.10,0.28,wo[0]);
       const land=clamp01(base*0.5+ring*0.55+core*0.55-0.34);
       let sp=0;
       if(land<sea){
         const t=smoothstep(sea-0.26,sea,land);
         mixc(p[0],p[2],t,tmp);
         mixc(tmp,p[5],smoothstep(0.6,1,t),tmp);
         sp=255*(1-t*0.3);
       }else{
         const t=clamp01((land-sea)/(1-sea));
         mixc(p[3],p[4],smoothstep(0.05,0.55,t),tmp);
         sp=30;
       }
       const seaIce=land<sea;
       const icv=iceCap(n,nx,ny,nz,Math.abs(ny),seaIce?0.80:0.70,0.12,cf,seaIce,ic);
       if(icv>0){
         mixc(tmp,p[5],icv,tmp);
         const k=1+(ic[0]-0.5)*0.20*icv;
         tmp[0]*=k;tmp[1]*=k;tmp[2]*=k;
       }
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=sp;
       const cl=fbm(n,nx*2.8+13,ny*2.8,nz*2.8,4)*0.5+0.5;
       o[5]=smoothstep(0.46,0.68,cl)*cov*255;
     };
   }},
  {name:"冰壳洋型",w:2,hs:16,
   pal:[[212,70,10],[200,50,26],[190,42,44],[204,30,74],[232,14,94],[176,34,58],[28,22,36]],
   at:[198,62,72],ats:[0.5,0.85],amb:0.09,limb:0.24,cloudP:0.8,cloudMul:1.05,
   traits:["浮冰带","两极冰盖"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const sea=rnd(rand,0.5,0.66),floe=rnd(rand,9,16),cov=rnd(rand,0.4,0.75);
     const ic=cfg._ice;
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const base=fbm(n,nx*1.6+cf,ny*1.6,nz*1.6,5)*0.5+0.5;
       const latf=Math.abs(ny);
       w(nx*floe+cf,ny*floe*0.6,nz*floe,wo);
       const floeEdge=1-smoothstep(0.015,0.09,wo[1]-wo[0]);
       let sp=0;
       if(base<sea){
         const t=smoothstep(sea-0.26,sea,base);
         mixc(p[0],p[2],t,tmp);sp=230*(1-t*0.35);
       }else{
         mixc(p[3],p[5],smoothstep(0.0,0.5,clamp01((base-sea)/(1-sea))),tmp);
         sp=120;
       }
       const icv=iceCap(n,nx,ny,nz,latf,0.40,0.11,cf,true,ic);
       const ice=clamp01(icv+floeEdge*0.45);
       if(ice>0){
         mixc(tmp,p[4],ice,tmp);
         const k=1+(ic[0]-0.5)*0.20*ice;
         tmp[0]*=k;tmp[1]*=k;tmp[2]*=k;
       }
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=sp;
       const cl=fbm(n,nx*2.4+33,ny*2.4,nz*2.4,4)*0.5+0.5;
       o[5]=smoothstep(0.48,0.7,cl)*cov*255;
     };
   }}
  ]
};
