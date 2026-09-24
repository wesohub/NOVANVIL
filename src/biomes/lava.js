import { rnd } from '../core/random.js';
import { smoothstep } from '../core/math.js';
import { fbm, ridged } from '../noise/perlin.js';
import { mixc } from '../core/palette.js';
import { tmp } from '../core/scratch.js';
import { initSub } from './scheduler.js';

/* ── 6. 熔岩炼狱行星 ───────────────────────────── */
export const lava = {
  name:"熔岩炼狱行星",en:"MOLTEN",color:"#ff5a2a",weight:8,
  meta:{dia:[5600,14000],dens:[1.0,1.4],temp:[620,1650],rot:[8,400],orb:[4,90],
    atmos:["硅酸盐蒸气","二氧化碳-硫化物","金属蒸气云","钠-硅蒸气"],
    res:["熔融金属","硅酸盐熔体","硫化物矿","地热能","稀有重金属"],hab:2},
  init(rand,cfg){initSub(this,rand,cfg,cfg.subIndex);},
  subs:[
  {name:"熔岩海型",w:3,hs:12,
   pal:[[16,44,6],[14,60,14],[24,88,40],[34,96,56],[44,96,74],[8,40,4],[20,80,90]],
   at:[16,90,52],ats:[0.5,0.85],amb:0.16,limb:0.1,cloudP:0.5,cloudMul:0.8,
   traits:["全球性熔融表面","熔岩海"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const lvl=rnd(rand,0.62,0.76);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const s=fbm(n,nx*1.3+cf,ny*1.3,nz*1.3,4)*0.5+0.5;
       const heat=smoothstep(lvl-0.12,lvl+0.08,s);
       const crust=fbm(n,nx*3.4+30,ny*3.4,nz*3.4,5)*0.5+0.5;
       const rock=0.5+crust*0.55;
       tmp[0]=p[1][0]*rock;tmp[1]=p[1][1]*rock;tmp[2]=p[1][2]*rock;
       mixc(tmp,p[0],smoothstep(0.35,0.7,crust),tmp);
       // 结壳浮块：靠近熔岩面处的深色浮渣
       const raft=Math.exp(-Math.pow((s-lvl)/0.055,2));
       mixc(tmp,p[6],(1-heat)*raft*0.8,tmp);
       mixc(tmp,p[2],smoothstep(0.4,0.66,heat),tmp);
       mixc(tmp,p[3],smoothstep(0.6,0.8,heat),tmp);
       mixc(tmp,p[4],smoothstep(0.82,1.0,heat),tmp);
       const wave=0.88+0.24*Math.sin(s*22+crust*6);
       tmp[0]*=wave;tmp[1]*=wave;tmp[2]*=wave;
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];
       o[3]=Math.pow(heat,1.25)*250;o[4]=heat*40;
       o[5]=cfg.hasCloud?smoothstep(0.6,0.84,fbm(n,nx*2.6+70,ny*2.6,nz*2.6,4)*0.5+0.5)*90:0;
     };
   }},
  {name:"裂隙喷发型",w:3,hs:10,
   pal:[[14,46,6],[12,58,12],[22,86,38],[32,94,54],[42,94,72],[8,38,4],[18,78,88]],
   at:[14,92,50],ats:[0.45,0.8],amb:0.15,limb:0.12,cloudP:0.5,cloudMul:0.85,
   traits:["全球性熔融表面","剧烈火山活动"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const cr=ridged(n,nx*3.0+cf,ny*3.0,nz*3.0,5);
       let heat=smoothstep(0.58,0.90,cr);
       const crust=fbm(n,nx*3.6+30,ny*3.6,nz*3.6,5)*0.5+0.5;
       const rock=0.55+crust*0.5;
       tmp[0]=p[1][0]*rock;tmp[1]=p[1][1]*rock;tmp[2]=p[1][2]*rock;
       mixc(tmp,p[0],smoothstep(0.35,0.7,crust),tmp);
       const shell=smoothstep(0.34,0.62,cr)*(1-smoothstep(0.62,0.8,cr));
       mixc(tmp,p[1],shell*0.6,tmp);
       mixc(tmp,p[2],smoothstep(0.42,0.66,heat),tmp);
       mixc(tmp,p[3],smoothstep(0.62,0.82,heat),tmp);
       mixc(tmp,p[4],smoothstep(0.84,1.0,heat),tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];
       o[3]=Math.pow(heat,1.3)*255;o[4]=heat*40;
       o[5]=cfg.hasCloud?smoothstep(0.6,0.84,fbm(n,nx*2.6+70,ny*2.6,nz*2.6,4)*0.5+0.5)*90:0;
     };
   }},
  {name:"火山群型",w:2,hs:12,
   pal:[[18,40,6],[16,52,12],[26,78,34],[36,88,50],[46,90,68],[6,34,4],[22,70,84]],
   at:[18,86,48],ats:[0.55,0.9],amb:0.16,limb:0.12,cloudP:0.7,cloudMul:0.9,
   traits:["超级火山群","火山灰沉降"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const vs=rnd(rand,4,9);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       w(nx*vs+cf,ny*vs,nz*vs,wo);
       // 火山锥：细胞中心为口，边缘为锥坡
       const cone=1-smoothstep(0.05,0.42,wo[0]);
       const caldera=1-smoothstep(0.0,0.10,wo[0]);
       const base=fbm(n,nx*2.2+cf,ny*2.2,nz*2.2,5)*0.5+0.5;
       const rock=0.55+base*0.5;
       tmp[0]=p[1][0]*rock;tmp[1]=p[1][1]*rock;tmp[2]=p[1][2]*rock;
       mixc(tmp,p[0],smoothstep(0.4,0.72,base),tmp);
       const sh2=1-cone*0.34+Math.exp(-Math.pow((wo[0]-0.34)/0.06,2))*0.3;
       tmp[0]*=sh2;tmp[1]*=sh2;tmp[2]*=sh2;
       const ash=smoothstep(0.55,0.8,fbm(n,nx*1.6+22,ny*1.6,nz*1.6,3)*0.5+0.5);
       mixc(tmp,p[6],ash*0.6,tmp);
       let heat=caldera*0.95;
       mixc(tmp,p[2],smoothstep(0.3,0.6,heat),tmp);
       mixc(tmp,p[3],smoothstep(0.55,0.8,heat),tmp);
       mixc(tmp,p[4],smoothstep(0.8,1.0,heat),tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];
       o[3]=Math.pow(heat,1.4)*245;o[4]=heat*30;
       o[5]=cfg.hasCloud?smoothstep(0.55,0.8,fbm(n,nx*2.4+51,ny*2.4,nz*2.4,4)*0.5+0.5)*130:0;
     };
   }},
  {name:"板块结壳型",w:2,hs:10,
   pal:[[12,48,5],[10,60,11],[20,84,34],[30,92,50],[40,92,70],[6,36,3],[16,74,86]],
   at:[12,90,50],ats:[0.45,0.8],amb:0.15,limb:0.12,cloudP:0.45,cloudMul:0.8,
   traits:["漂浮地壳板块","板块间熔岩上涌"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const ps=rnd(rand,3,6);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       w(nx*ps+cf,ny*ps,nz*ps,wo);
       const gap=1-smoothstep(0.02,0.16,wo[1]-wo[0]);   // 板块缝隙
       const crust=fbm(n,nx*3.2+30,ny*3.2,nz*3.2,5)*0.5+0.5;
       const rock=0.5+crust*0.55;
       tmp[0]=p[1][0]*rock;tmp[1]=p[1][1]*rock;tmp[2]=p[1][2]*rock;
       mixc(tmp,p[0],smoothstep(0.35,0.72,crust),tmp);
       mixc(tmp,p[6],(1-gap)*0.25,tmp);
       mixc(tmp,p[2],smoothstep(0.3,0.62,gap),tmp);
       mixc(tmp,p[3],smoothstep(0.55,0.82,gap),tmp);
       mixc(tmp,p[4],smoothstep(0.82,1.0,gap),tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];
       o[3]=Math.pow(gap,1.2)*250;o[4]=gap*35;
       o[5]=cfg.hasCloud?smoothstep(0.6,0.84,fbm(n,nx*2.6+70,ny*2.6,nz*2.6,4)*0.5+0.5)*90:0;
     };
   }}
  ]
};
