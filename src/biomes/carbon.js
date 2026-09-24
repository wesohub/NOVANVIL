import { rnd } from '../core/random.js';
import { smoothstep } from '../core/math.js';
import { fbm, ridged } from '../noise/perlin.js';
import { mixc, ramp } from '../core/palette.js';
import { tmp, tmp2 } from '../core/scratch.js';
import { initSub } from './scheduler.js';

/* ── 7. 碳质黑曜行星 ───────────────────────────── */
export const carbon = {
  name:"碳质黑曜行星",en:"CARBON",color:"#ff8a3d",weight:6,
  meta:{dia:[4200,11500],dens:[1.0,1.35],temp:[180,780],rot:[10,500],orb:[8,150],
    atmos:["二氧化碳-一氧化碳","碳氢雾霭","硫-碳化合物","石墨尘暴"],
    res:["石墨","金刚石矿脉","碳纳米结构","烃类沉积","硫"],hab:3},
  init(rand,cfg){initSub(this,rand,cfg,cfg.subIndex);},
  subs:[
  {name:"黑曜玻璃型",w:3,hs:10,
   pal:[[20,10,7],[26,14,13],[14,26,22],[28,70,40],[38,84,62],[44,90,80],[18,18,10]],
   at:[24,80,48],ats:[0.4,0.7],amb:0.13,limb:0.14,cloudP:0.45,cloudMul:0.9,
   traits:["黑曜石地壳","高温还原性大气"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const glass=fbm(n,nx*2.4+cf,ny*2.4,nz*2.4,5)*0.5+0.5;
       const t=glass*0.82+0.09;
       if(t<0.42)mixc(p[0],p[1],t/0.42,tmp);
       else mixc(p[1],p[2],(t-0.42)/0.58,tmp);
       const rv=ridged(n,nx*4.6+cf,ny*4.6,nz*4.6,5);
       const flow=smoothstep(0.68,0.95,rv);
       mixc(tmp,p[3],flow*0.85,tmp);
       mixc(tmp,p[4],smoothstep(0.80,0.95,rv),tmp);
       mixc(tmp,p[5],smoothstep(0.93,1.0,rv),tmp);
       const ash=smoothstep(0.55,0.8,fbm(n,nx*1.8+40,ny*1.8,nz*1.8,3)*0.5+0.5);
       mixc(tmp,p[6],ash*0.6,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];
       o[3]=Math.pow(flow,1.5)*230;o[4]=glass*70;
       o[5]=cfg.hasCloud?smoothstep(0.58,0.82,fbm(n,nx*2.5+12,ny*2.5,nz*2.5,4)*0.5+0.5)*100:0;
     };
   }},
  {name:"石墨尘原型",w:2,hs:8,
   pal:[[24,6,8],[20,8,14],[16,6,20],[200,20,70],[210,30,84],[30,4,4],[44,10,30]],
   at:[26,40,42],ats:[0.45,0.75],amb:0.14,limb:0.1,cloudP:0.6,cloudMul:1.0,
   traits:["石墨粉尘覆盖","金刚石矿脉"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const vf=rnd(rand,3.2,5.6);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const dust=fbm(n,nx*1.7+cf,ny*1.7,nz*1.7,4)*0.5+0.5;
       ramp(p,dust*0.8+0.1,tmp);
       const vein=smoothstep(0.74,0.94,ridged(n,nx*vf+cf,ny*vf,nz*vf,4));
       mixc(tmp,p[3],vein*0.9,tmp);
       mixc(tmp,p[4],smoothstep(0.9,1.0,ridged(n,nx*vf*1.9+cf,ny*vf*1.9,nz*vf*1.9,3))*0.8,tmp);
       const dune=Math.sin(fbm(n,nx*2.2+5,ny*2.2,nz*2.2,3)*9)*0.5+0.5;
       const sh2=0.78+0.4*dune;
       tmp[0]*=sh2;tmp[1]*=sh2;tmp[2]*=sh2;
       mixc(tmp,p[5],smoothstep(0.3,0.1,dust)*0.8,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];
       o[3]=vein*40;o[4]=vein*120+dust*20;
       o[5]=cfg.hasCloud?smoothstep(0.55,0.8,fbm(n,nx*2.2+31,ny*2.2,nz*2.2,4)*0.5+0.5)*130:0;
     };
   }},
  {name:"焦油湖型",w:2,hs:12,
   pal:[[28,16,8],[24,20,12],[18,14,18],[32,34,26],[40,44,36],[12,10,8],[46,50,44]],
   at:[30,60,40],ats:[0.5,0.85],amb:0.14,limb:0.12,cloudP:0.5,cloudMul:0.9,
   traits:["烃类焦油湖","沥青质平原"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const lvl=rnd(rand,0.48,0.62);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const q=fbm(n,nx*1.1+cf,ny*1.1,nz*1.1,3);
       const s=fbm(n,nx*1.8+q*0.6+cf,ny*1.8,nz*1.8+q*0.6,4)*0.5+0.5;
       const lake=smoothstep(lvl-0.06,lvl+0.06,s);
       const solid=1-lake;
       const land=fbm(n,nx*3.4+17,ny*3.4,nz*3.4,4)*0.5+0.5;
       ramp(p,0.04+land*0.92,tmp);
       // 焦油：黑亮，带虹彩
       const iri=Math.sin(s*30+q*10)*0.5+0.5;
       tmp2[0]=p[3][0]+p[5][0]*iri*0.5;tmp2[1]=p[3][1]+p[4][1]*iri*0.4;tmp2[2]=p[3][2]+p[4][2]*iri*0.6;
       mixc(tmp,tmp2,lake*0.95,tmp);
       const sp=255*lake*0.9+ (1-lake)*20;
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=sp;
       o[5]=cfg.hasCloud?smoothstep(0.58,0.82,fbm(n,nx*2.3+63,ny*2.3,nz*2.3,4)*0.5+0.5)*110:0;
     };
   }}
  ]
};
