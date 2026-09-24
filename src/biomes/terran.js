import { rnd } from '../core/random.js';
import { clamp01, smoothstep } from '../core/math.js';
import { fbm, ridged } from '../noise/perlin.js';
import { iceCap } from '../noise/icecap.js';
import { mixc } from '../core/palette.js';
import { tmp } from '../core/scratch.js';
import { initSub } from './scheduler.js';

/* ── 1. 类地生机行星 ───────────────────────────── */
export const terran = {
  name:"类地生机行星",en:"TERRAN",color:"#6fe36f",weight:12,
  meta:{dia:[8600,16800],dens:[0.85,1.25],temp:[-38,42],rot:[9,52],orb:[180,560],
    atmos:["氮-氧大气（可呼吸）","氮-氧-氩混合","富氧大气（含微量甲烷）","氮氧+高湿度"],
    res:["稀有金属","液态水","稀土矿脉","生物质","贵金属","硅酸盐"],hab:78},
  init(rand,cfg){initSub(this,rand,cfg,cfg.subIndex);},
  subs:[
  {name:"大陆型",w:4,hs:16,
   pal:[[212,76,11],[96,40,32],[64,38,26],[38,42,46],[220,14,93],[198,44,60],[30,16,40]],
   at:[206,72,64],ats:[0.5,0.75],amb:0.07,limb:0.18,cloudP:1,cloudMul:1.18,
   traits:["液态水海洋","板块活动活跃"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const sea=rnd(rand,0.44,0.56),iceLat=rnd(rand,0.64,0.86),cov=rnd(rand,0.3,0.7);
     const ic=cfg._ice;
     if(sea<0.5)cfg.traits.push("广袤浅海");
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const wx=fbm(n,nx*2.1+cf,ny*2.1,nz*2.1,3),wz=fbm(n,nx*2.1+5,ny*2.1+3,nz*2.1+cf,3);
       let h=fbm(n,nx*2.0+wx*0.42,ny*2.0,nz*2.0+wz*0.42,6)*0.5+0.5;
       const cont=fbm(n,nx*0.85+31,ny*0.85,nz*0.85,3)*0.5+0.5;
       h=h*0.68+cont*0.32;
       const latf=Math.abs(ny);let sp=0;
       if(h<sea){
         const t=smoothstep(sea-0.17,sea,h);
         mixc(p[0],p[5],t*0.1,tmp);sp=255*(1-t*0.5);
       }else{
         const t=(h-sea)/(1-sea);
         mixc(p[1],p[2],smoothstep(0.02,0.34,t),tmp);
         const dryN=fbm(n,nx*3+70,ny*3,nz*3,3)*0.5+0.5;
         const dry=smoothstep(0.2,0.44,latf)*(1-smoothstep(0.5,0.72,latf));
         mixc(tmp,p[3],clamp01(dry*smoothstep(0.35,0.62,dryN)*1.5),tmp);
         mixc(tmp,p[6],smoothstep(0.42,0.7,t),tmp);
         const rock=fbm(n,nx*7+13,ny*7,nz*7,4)*0.5;
         tmp[0]*=1+rock*0.22;tmp[1]*=1+rock*0.22;tmp[2]*=1+rock*0.22;
         mixc(tmp,p[4],smoothstep(0.5,0.72,t+latf*0.55),tmp);
       }
       const seaIce=h<sea;
       const icv=iceCap(n,nx,ny,nz,latf,seaIce?iceLat+0.05:iceLat-0.04,0.12,cf,seaIce,ic);
       if(icv>0){
         mixc(tmp,p[4],icv,tmp);
         const k=1+(ic[0]-0.5)*0.20*icv;   // 冰面穹顶起伏
         tmp[0]*=k;tmp[1]*=k;tmp[2]*=k;
       }
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=sp;
       const cl=fbm(n,nx*2.7+90,ny*2.7,nz*2.7,5)*0.5+0.5;
       const band=0.55+0.45*Math.cos(G.lat*5.4);
       o[5]=smoothstep(0.46,0.66,cl)*cov*band*255;
     };
   }},
  {name:"群岛型",w:3,hs:14,
   pal:[[196,86,9],[188,58,28],[172,48,50],[58,44,40],[46,38,54],[204,24,86],[38,30,34]],
   at:[192,70,66],ats:[0.55,0.85],amb:0.08,limb:0.2,cloudP:1,cloudMul:1.28,
   traits:["破碎岛链","广阔浅海大陆架"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const sea=rnd(rand,0.56,0.66),cov=rnd(rand,0.5,0.85);
     const arcF=rnd(rand,1.5,2.3),arcW=rnd(rand,0.18,0.30);
     const brk=rnd(rand,4.5,7.5),brkD=rnd(rand,0.14,0.24);
     const ic=cfg._ice;
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       /* ① 地形骨架：域扭曲 fbm + 低频板块，与大陆型同源 → 海岸线蜿蜒不规则 */
       const wx=fbm(n,nx*2.3+cf,ny*2.3,nz*2.3,3),wz=fbm(n,nx*2.3+9,ny*2.3+2,nz*2.3+cf,3);
       let h=fbm(n,nx*2.3+wx*0.55,ny*2.3,nz*2.3+wz*0.55,6)*0.5+0.5;
       const cont=fbm(n,nx*0.85+31,ny*0.85,nz*0.85,3)*0.5+0.5;
       h=h*0.70+cont*0.30;
       /* ② 岛弧带：脊状噪声在陆核上抬升 → 沿脊线蜿蜒的长条岛链 */
       const belt=ridged(n,nx*arcF+cf*0.5,ny*arcF*1.9+7,nz*arcF,4,2.0,0.55);
       h+=smoothstep(0.52,0.88,belt)*smoothstep(0.40,0.68,cont)*arcW;
       /* ③ 破碎：Worley 细胞边界成网状海峡（再经域扭曲去掉直线感），高频脊切一道 → 陆块裂成小岛 */
       w(nx*brk+cf+wx*0.55,ny*brk*1.35,nz*brk+wz*0.55,wo);
       const inner=smoothstep(0.0,0.30,wo[1]-wo[0]);
       h-=(1-inner)*brkD;
       h-=smoothstep(0.42,0.90,ridged(n,nx*brk*2.7+wx+5,ny*brk*2.7,nz*brk*2.7+wz,3,2.0,0.5))*brkD*0.5;
       const land=h;
       let sp=0;
       if(land<sea){
         const t=smoothstep(sea-0.20,sea,land);
         mixc(p[0],p[2],t*0.1,tmp);
         const reef=fbm(n,nx*11+45,ny*11,nz*11,3)*0.5+0.5;
         mixc(tmp,p[5],smoothstep(0.62,1,t)*0.1*smoothstep(0.5,0.78,reef),tmp);
         sp=255*(1-t*0.35);
       }else{
         const t=clamp01((land-sea)/(1-sea));
         mixc(p[3],p[4],smoothstep(0.04,0.5,t),tmp);
         mixc(tmp,p[6],smoothstep(0.55,0.9,t),tmp);
         const rg=fbm(n,nx*9+7,ny*9,nz*9,3)*0.5;
         tmp[0]*=1+rg*0.3;tmp[1]*=1+rg*0.3;tmp[2]*=1+rg*0.3;
         sp=34;
       }
       const seaIce=land<sea;
       const icv=iceCap(n,nx,ny,nz,Math.abs(ny),seaIce?0.76:0.64,0.12,cf,seaIce,ic);
       if(icv>0){
         mixc(tmp,p[5],icv,tmp);
         const k=1+(ic[0]-0.5)*0.20*icv;
         tmp[0]*=k;tmp[1]*=k;tmp[2]*=k;
       }
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=sp;
       const cl=fbm(n,nx*3.1+21,ny*3.1,nz*3.1,4)*0.5+0.5;
       o[5]=smoothstep(0.48,0.7,cl)*cov*255;
     };
   }},
  {name:"苔原型",w:3,hs:18,
   pal:[[206,58,14],[188,30,34],[52,26,36],[40,22,48],[210,16,84],[26,18,28],[150,14,52]],
   at:[200,52,70],ats:[0.4,0.7],amb:0.09,limb:0.22,cloudP:0.75,cloudMul:1.1,
   traits:["永久冻土带","低矮苔原植被"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const sea=rnd(rand,0.36,0.48),ps=rnd(rand,4,8),cov=rnd(rand,0.35,0.7);
     const ic=cfg._ice;
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const latf=Math.abs(ny);
       /* ① 地形骨架：域扭曲 fbm + 低频板块，与大陆型同源 → 有机海岸线 */
       const wx=fbm(n,nx*2.6+cf,ny*2.6,nz*2.6,3),wz=fbm(n,nx*2.6+9,ny*2.6+4,nz*2.6+cf,3);
       let h=fbm(n,nx*2.4+wx*0.6,ny*2.4,nz*2.4+wz*0.6,6)*0.5+0.5;
       const cont=fbm(n,nx*1.1+31,ny*1.1,nz*1.1,3)*0.5+0.5;
       h=h*0.72+cont*0.28;
       /* ② 冻原斑块：域扭曲 Worley，按细胞 id 在苔藓绿 / 裸土褐之间连续过渡；
            边界处降对比（soft）→ 有机镶嵌，不再是全球均匀的多边形网格线 */
       w(nx*ps+cf+wx*0.8,ny*ps+wz*0.8,nz*ps+wx*0.40,wo);
       const myc=wo[2];
       const edge=smoothstep(0.0,0.16,wo[1]-wo[0]);
       const soft=0.40+0.60*edge;
       let sp=0;
       if(h<sea){
         const t=smoothstep(sea-0.2,sea,h);
         mixc(p[0],p[5],t,tmp);sp=220*(1-t*0.5);
       }else{
         const t=clamp01((h-sea)/(1-sea));
         mixc(p[2],p[6],smoothstep(0.05,0.5,t+latf*0.25),tmp);
         /* 斑块分派：苔藓斑 / 裸土斑 */
         mixc(tmp,p[1],smoothstep(0.34,0.86,myc)*0.42*soft,tmp);
         mixc(tmp,p[3],smoothstep(0.22,0.03,myc)*0.42*soft,tmp);
         /* ③ 苔藓绒斑：高频 fbm 打散，大小不一 */
         const moss=fbm(n,nx*6+17,ny*6,nz*6,3)*0.5+0.5;
         mixc(tmp,p[1],smoothstep(0.52,0.80,moss)*0.30,tmp);
         mixc(tmp,p[4],smoothstep(0.24,0.44,latf)*0.7,tmp);
         /* ④ 热喀斯特小湖群：低平处散布水洼（苔原标志地貌） */
         const flat=1-smoothstep(0.10,0.34,t);
         const fine=fbm(n,nx*11+23,ny*11,nz*11,3)*0.5+0.5;
         const pond=flat*smoothstep(0.60,0.84,fine)*(1-smoothstep(0.72,0.92,t));
         if(pond>0.01)mixc(tmp,p[0],pond*0.72,tmp);
         /* ⑤ 冻土龟裂：仅低平区断续出现，不再铺满全球 */
         const fine2=fbm(n,nx*9.5+83,ny*9.5+31,nz*9.5,2)*0.5+0.5;
         const crack=clamp01(flat*(1-edge)*smoothstep(0.68,0.92,fine2)*1.6);
         if(crack>0.02)mixc(tmp,p[4],crack*0.55,tmp);
         sp=18;
       }
       const seaIce=h<sea;
       const icv=iceCap(n,nx,ny,nz,latf,seaIce?0.64:0.54,0.13,cf,seaIce,ic);
       if(icv>0){
         mixc(tmp,p[4],icv,tmp);
         const k=1+(ic[0]-0.5)*0.20*icv;
         tmp[0]*=k;tmp[1]*=k;tmp[2]*=k;
       }
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=0;o[4]=sp;
       const cl=fbm(n,nx*2.5+61,ny*2.5,nz*2.5,4)*0.5+0.5;
       o[5]=smoothstep(0.5,0.72,cl)*cov*255;
     };
   }},
  {name:"丛林湿地型",w:3,hs:14,
   pal:[[196,82,8],[178,64,22],[128,48,26],[96,56,34],[74,62,20],[212,30,60],[46,44,16]],
   at:[168,64,60],ats:[0.65,0.95],amb:0.1,limb:0.16,cloudP:1,cloudMul:1.35,
   traits:["全球雨林覆盖","大型三角洲水系"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const sea=rnd(rand,0.38,0.5),cov=rnd(rand,0.6,0.92),rf=rnd(rand,2.6,4.4);
     const ic=cfg._ice;
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       let h=fbm(n,nx*1.7+cf,ny*1.7,nz*1.7,5)*0.5+0.5;
       const river=smoothstep(0.66,0.9,ridged(n,nx*rf+cf,ny*rf,nz*rf,4));
       h-=river*0.16;
       const latf=Math.abs(ny);let sp=0,em=0;
       if(h<sea){
         const t=smoothstep(sea-0.18,sea,h);
         mixc(p[0],p[5],t*0.1,tmp);sp=235*(1-t*0.4);
       }else{
         const t=clamp01((h-sea)/(1-sea));
         mixc(p[3],p[2],smoothstep(0.02,0.3,t),tmp);
         const veg=fbm(n,nx*5.5+3,ny*5.5,nz*5.5,4)*0.5+0.5;
         mixc(tmp,p[1],smoothstep(0.35,0.72,veg)*0.85,tmp);
         const swamp=smoothstep(0.6,0.78,fbm(n,nx*1.3+44,ny*1.3,nz*1.3,3)*0.5+0.5);
         mixc(tmp,p[6],swamp*0.7,tmp);
         mixc(tmp,p[4],smoothstep(0.45,0.75,t+latf*0.4),tmp);
         sp=24*(1-swamp);
       }
       const seaIce=h<sea;
       const icv=iceCap(n,nx,ny,nz,latf,seaIce?0.93:0.87,0.10,cf,seaIce,ic);
       if(icv>0){
         const iv=icv*0.38;          // 湿热星球：冰盖缩减至极区且稀薄半透
         mixc(tmp,p[5],iv,tmp);
         const k=1+(ic[0]-0.5)*0.20*iv;
         tmp[0]*=k;tmp[1]*=k;tmp[2]*=k;
       }
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=em;o[4]=sp;
       const cl=fbm(n,nx*2.3+9,ny*2.3,nz*2.3,5)*0.5+0.5;
       o[5]=smoothstep(0.4,0.62,cl)*cov*255;
     };
   }}
  ]
};
