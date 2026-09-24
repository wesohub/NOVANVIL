import { rnd } from '../core/random.js';
import { clamp01, smoothstep } from '../core/math.js';
import { fbm, ridged } from '../noise/perlin.js';
import { mixc, ramp } from '../core/palette.js';
import { tmp } from '../core/scratch.js';
import { initSub } from './scheduler.js';

/* ── 3. 干旱沙漠行星 ───────────────────────────── */
export const desert = {
  name:"干旱沙漠行星",en:"ARID",color:"#ffb04f",weight:10,
  meta:{dia:[5200,12800],dens:[0.75,1.1],temp:[8,96],rot:[14,80],orb:[120,480],
    atmos:["稀薄二氧化碳","氮-二氧化碳（尘暴）","极稀薄氩-二氧化碳","无显著大气"],
    res:["硅酸盐砂","金属氧化物","地下冰层","钛铁矿","稀土"],hab:22},
  init(rand,cfg){initSub(this,rand,cfg,cfg.subIndex);},
  subs:[
  {name:"沙丘型",w:3,hs:16,
   pal:[[32,58,58],[26,64,46],[18,58,34],[40,30,62],[34,18,26],[10,42,20],[46,26,74]],
   at:[30,66,60],ats:[0.18,0.42],amb:0.1,limb:0.26,cloudP:0.4,cloudMul:1.3,
   traits:["全球沙海","极端昼夜温差"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const duneF=rnd(rand,8,22);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const base=fbm(n,nx*1.5+cf,ny*1.5,nz*1.5,5)*0.5+0.5;
       const dw=fbm(n,nx*2.6+cf,ny*2.6,nz*2.6,4);
       const st=Math.sin(dw*duneF+base*3)*0.5+0.5;
       const rock=fbm(n,nx*4.4+21,ny*4.4,nz*4.4,5)*0.5+0.5;
       ramp(p,base*0.55+st*0.25+rock*0.2,tmp);
       const sh2=0.82+0.36*st;
       tmp[0]*=sh2;tmp[1]*=sh2;tmp[2]*=sh2;
       const rv=ridged(n,nx*3.4+9,ny*3.4,nz*3.4,4);
       mixc(tmp,p[5],smoothstep(0.72,0.92,rv)*0.7,tmp);
       const salt=smoothstep(0.66,0.78,fbm(n,nx*2+60,ny*2,nz*2,3)*0.5+0.5);
       mixc(tmp,p[6],salt*0.55,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=18;
       o[5]=cfg.hasCloud?smoothstep(0.58,0.8,fbm(n,nx*3+80,ny*3,nz*3,4)*0.5+0.5)*140:0;
     };
   }},
  {name:"岩漠台地型",w:3,hs:16,
   pal:[[24,46,42],[18,52,30],[12,44,22],[28,34,52],[38,26,36],[8,34,16],[34,20,66]],
   at:[18,58,58],ats:[0.12,0.32],amb:0.1,limb:0.3,cloudP:0.25,cloudMul:1.2,
   traits:["风蚀台地","砾石戈壁"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const ms=rnd(rand,4,8);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const base=fbm(n,nx*1.6+cf,ny*1.6,nz*1.6,4)*0.5+0.5;
       w(nx*ms+cf,ny*ms,nz*ms,wo);
       // 平顶台地：细胞中心为平台，边缘为陡崖
       const mesa=1-smoothstep(0.22,0.42,wo[0]);
       const cliff=Math.exp(-Math.pow((wo[0]-0.36)/0.07,2));
       const h=clamp01(base*0.5+mesa*0.5);
       ramp(p,h,tmp);
       const sh2=1-(1-mesa)*0.34+cliff*0.32;
       tmp[0]*=sh2;tmp[1]*=sh2;tmp[2]*=sh2;
       const grit=fbm(n,nx*9+3,ny*9,nz*9,3)*0.5+0.5;
       mixc(tmp,p[6],smoothstep(0.6,0.85,grit)*0.35,tmp);
       const rv=ridged(n,nx*3.8+17,ny*3.8,nz*3.8,4);
       mixc(tmp,p[5],smoothstep(0.78,0.95,rv)*0.6,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=12;
       o[5]=cfg.hasCloud?smoothstep(0.62,0.84,fbm(n,nx*2.8+55,ny*2.8,nz*2.8,4)*0.5+0.5)*120:0;
     };
   }},
  {name:"盐碱裂壳型",w:2,hs:14,
   pal:[[44,22,72],[36,18,58],[28,14,44],[20,10,32],[200,14,86],[16,26,22],[52,16,90]],
   at:[40,30,68],ats:[0.15,0.4],amb:0.12,limb:0.24,cloudP:0.2,cloudMul:1.1,
   traits:["干涸盐湖","多边形裂壳"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const ps=rnd(rand,5,11);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const base=fbm(n,nx*1.8+cf,ny*1.8,nz*1.8,4)*0.5+0.5;
       w(nx*ps+cf,ny*ps,nz*ps,wo);
       const crack=1-smoothstep(0.006,0.055,wo[1]-wo[0]);
       w(nx*ps*2.6+9,ny*ps*2.6,nz*ps*2.6,wo);
       const crack2=1-smoothstep(0.004,0.04,wo[1]-wo[0]);
       ramp(p,base,tmp);
       mixc(tmp,p[6],clamp01(crack*0.85+crack2*0.4),tmp);
       const pan=smoothstep(0.55,0.78,fbm(n,nx*1.2+30,ny*1.2,nz*1.2,3)*0.5+0.5);
       mixc(tmp,p[4],pan*0.9,tmp);
       const dark=smoothstep(0.35,0.15,base);
       mixc(tmp,p[5],dark*0.8,tmp);
       const sp=255*(1-crack*0.8)*(0.35+0.65*pan);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=sp;
       o[5]=cfg.hasCloud?smoothstep(0.66,0.86,fbm(n,nx*3+12,ny*3,nz*3,4)*0.5+0.5)*110:0;
     };
   }},
  {name:"峡谷裂谷型",w:2,hs:18,
   pal:[[16,54,44],[10,58,32],[4,50,24],[24,42,54],[36,30,40],[8,38,18],[30,22,68]],
   at:[14,60,56],ats:[0.14,0.36],amb:0.1,limb:0.28,cloudP:0.25,cloudMul:1.15,
   traits:["深切峡谷网","层理沉积岩"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const cv=rnd(rand,2.2,4.2),layers=rnd(rand,10,26);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const warp=fbm(n,nx*1.2+cf,ny*1.2,nz*1.2,3);
       const rv=ridged(n,nx*cv+warp*0.8+cf,ny*cv,nz*cv+warp*0.8,5);
       const canyon=smoothstep(0.62,0.93,rv);
       const strata=Math.sin(fbm(n,nx*1.1+7,ny*1.1,nz*1.1,3)*6+ny*layers)*0.5+0.5;
       ramp(p,strata*0.62+0.2,tmp);
       const sh2=0.7+0.5*canyon;
       tmp[0]*=sh2;tmp[1]*=sh2;tmp[2]*=sh2;
       // 谷底阴影 + 崖壁亮边
       const wall=Math.exp(-Math.pow((rv-0.70)/0.05,2));
       mixc(tmp,p[6],wall*0.5,tmp);
       mixc(tmp,p[5],canyon*0.75,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=10;
       o[5]=cfg.hasCloud?smoothstep(0.64,0.86,fbm(n,nx*2.6+88,ny*2.6,nz*2.6,4)*0.5+0.5)*115:0;
     };
   }}
  ]
};
