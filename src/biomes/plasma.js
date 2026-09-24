import { chance, rnd } from '../core/random.js';
import { PI, clamp01, smoothstep } from '../core/math.js';
import { fbm, ridged, turb } from '../noise/perlin.js';
import { mixc, ramp } from '../core/palette.js';
import { tmp } from '../core/scratch.js';
import { initSub } from './scheduler.js';

/* ── 14. 等离子能量体（科幻） ──────────────────── */
export const plasma = {
  name:"等离子能量体",en:"PLASMA",color:"#ff4fa8",weight:4,
  meta:{dia:[9000,42000],dens:[0.05,0.3],temp:[2800,26000],rot:[3,40],orb:[20,900],
    atmos:["等离子体外壳","磁约束等离子","无（纯能量态）","电离氢冕"],
    res:["高能等离子","反物质痕量","磁能","稀有同位素"],hab:0},
  init(rand,cfg){initSub(this,rand,cfg,cfg.subIndex);},
  subs:[
  {name:"湍流电弧型",w:3,hs:40,
   pal:[[280,60,6],[292,80,24],[316,90,44],[198,92,52],[172,96,68],[330,90,80],[48,96,86]],
   at:[300,90,62],ats:[0.8,1.3],amb:0.42,limb:0.05,
   traits:["纯能量态天体","强磁流体动力学","无固态表面"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const core=chance(rand,0.5);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const t1=turb(n,nx*1.1+cf,ny*1.1,nz*1.1,4);
       const flow=ridged(n,nx*2.3+t1*0.8+cf,ny*2.3,nz*2.3+t1*0.8,5);
       let e=smoothstep(0.44,0.86,flow);
       const pulse=fbm(n,nx*1.6+cf,ny*1.6,nz*1.6,3)*0.5+0.5;
       e=clamp01(e*0.8+pulse*0.28-0.06);
       if(core)e=Math.max(e,smoothstep(0.55,0.85,pulse)*0.9);
       ramp(p,e,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=Math.pow(e,1.05)*248;o[4]=0;o[5]=0;
     };
   }},
  {name:"冕环型",w:3,hs:36,
   pal:[[268,70,8],[284,88,24],[302,92,42],[196,90,52],[176,92,70],[326,88,78],[42,94,88]],
   at:[292,88,60],ats:[0.75,1.25],amb:0.4,limb:0.06,
   traits:["磁力线冕环","环形等离子流"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const loops=rnd(rand,6,16);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const warp=fbm(n,nx*1.3+cf,ny*1.3,nz*1.3,3);
       const arc=Math.sin(Math.abs(ny)*loops*Math.PI+warp*3)*0.5+0.5;
       const loop=smoothstep(0.78,0.99,arc);
       const base=turb(n,nx*1.5+cf,ny*1.5,nz*1.5,4)*0.5+0.5;
       const e=clamp01(base*0.45+loop*0.6);
       ramp(p,e,tmp);
       mixc(tmp,p[6],Math.pow(loop,2)*0.8,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=Math.pow(e,1.1)*245;o[4]=0;o[5]=0;
     };
   }},
  {name:"脉动核心型",w:2,hs:40,
   pal:[[300,64,6],[318,86,22],[340,94,44],[20,92,54],[46,96,72],[280,90,80],[56,98,88]],
   at:[320,92,62],ats:[0.85,1.35],amb:0.45,limb:0.04,
   traits:["同心能量脉动","中心聚变核"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const rings=rnd(rand,10,26);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const warp=fbm(n,nx*1.1+cf,ny*1.1,nz*1.1,3);
       const rad=Math.sqrt(nx*nx+ny*ny+nz*nz);
       const ripple=Math.sin(rad*rings*Math.PI+warp*5)*0.5+0.5;
       const hot=1-smoothstep(0.0,0.55,fbm(n,nx*1.7+cf,ny*1.7,nz*1.7,4)*0.5+0.5);
       const e=clamp01(ripple*0.55+hot*0.55);
       ramp(p,e,tmp);
       mixc(tmp,p[6],Math.pow(smoothstep(0.85,1.0,ripple),1.5)*0.85,tmp);
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=Math.pow(e,1.0)*250;o[4]=0;o[5]=0;
     };
   }}
  ]
};
