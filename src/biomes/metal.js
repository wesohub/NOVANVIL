import { chance, rint, rnd } from '../core/random.js';
import { PI, clamp01, smoothstep } from '../core/math.js';
import { fbm } from '../noise/perlin.js';
import { hsl2rgb, mixc, ramp } from '../core/palette.js';
import { tmp } from '../core/scratch.js';
import { initSub } from './scheduler.js';

/* ── 11. 机械造物（科幻） ──────────────────────── */
export const metal = {
  name:"机械造物天体",en:"MECHANOS",color:"#9fd8ff",weight:5,
  meta:{dia:[3600,32000],dens:[0.9,2.6],temp:[-140,180],rot:[4,120],orb:[10,1800],
    atmos:["人工大气（可控）","无大气（真空）","冷却剂蒸气","电离气体外壳"],
    res:["合金外壳","核聚变燃料","纳米机械群","废弃电路稀土","超导材料"],hab:4},
  init(rand,cfg){initSub(this,rand,cfg,cfg.subIndex);},
  subs:[
  {name:"装甲板型",w:3,hs:22,
   pal:[[210,10,26],[208,8,42],[204,6,58],[212,12,72],[200,16,34],[196,40,44],[190,60,60]],
   at:[190,50,60],ats:[0.1,0.35],amb:0.14,limb:0.22,
   traits:["人造壳体结构","模块化外壳"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     const Nu=rint(rand,16,54),Nv=Math.floor(Nu/2);
     const glowCol=hsl2rgb(rnd(rand,170,200),90,rnd(rand,55,72));
     const hasSea=chance(rand,0.4),panelVar=rnd(rand,0.1,0.3);
     if(hasSea)cfg.traits.push("冷却剂循环海");
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const gu=G.u*Nu,gv=G.v*Nv;
       const fu=Math.abs((gu%1)-0.5)*2,fv=Math.abs((gv%1)-0.5)*2;
       const seam=smoothstep(0.74,0.97,Math.max(fu,fv));
       const plate=fbm(n,nx*1.7+cf,ny*1.7,nz*1.7,4)*0.5+0.5;
       const cid=n(Math.floor(gu)*3.7+cf,Math.floor(gv)*3.7,11.5);
       ramp(p,plate*0.45+0.28+cid*panelVar,tmp);
       const grime=fbm(n,nx*5+cf,ny*5,nz*5,4)*0.5+0.5;
       tmp[0]*=0.82+grime*0.36;tmp[1]*=0.82+grime*0.36;tmp[2]*=0.82+grime*0.36;
       tmp[0]*=1-seam*0.62;tmp[1]*=1-seam*0.62;tmp[2]*=1-seam*0.62;
       let em=0,sp=90;
       if(cid>0.08)em=seam*(cid-0.08)/0.5*255;
       if(hasSea){
         const s=smoothstep(0.62,0.76,fbm(n,nx*1.3+33,ny*1.3,nz*1.3,3)*0.5+0.5);
         mixc(tmp,p[6],s*0.85,tmp);
         sp=Math.max(sp*(1-s),40);em*=(1-s);
       }
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=em;o[4]=sp;o[5]=0;
       if(em>0){o[0]+=glowCol[0]*em/255*0.35;o[1]+=glowCol[1]*em/255*0.35;o[2]+=glowCol[2]*em/255*0.35;}
     };
   }},
  {name:"电路板型",w:3,hs:26,
   pal:[[132,72,14],[138,76,22],[126,64,10],[148,82,28],[118,56,8],[46,22,18],[176,80,56]],
   at:[140,84,38],ats:[0.22,0.50],amb:0.13,limb:0.18,
   traits:["印刷电路地表","导电迹线网络"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     // 网格密度（沿经纬网格：Nx 列、Ny 行）
     const Nx=rint(rand,28,44);
     const Ny=rint(rand,16,24);
     /* ── 走线发光色（板载 LED / 通电信号） ── */
     const glowCol=hsl2rgb(rnd(rand,90,160),95,rnd(rand,52,70));
     /* ── 铜色走线 / 焊盘 ── */
     const copper=hsl2rgb(rnd(rand,30,48),rnd(rand,82,98),rnd(rand,46,60));
     /* ── 丝印白色 ── */
     const silk=hsl2rgb(60,rnd(rand,6,16),rnd(rand,86,94));
     /* ── 偶发指示灯高亮色 ── */
     const hiLit=hsl2rgb(rnd(rand,20,200),rnd(rand,80,100),rnd(rand,55,72));
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const U=G.u*Nx, V=G.v*Ny;
       const cu=Math.floor(U), cv=Math.floor(V);
       const fu=U-cu, fv=V-cv;

       /* ── 基础：阻焊层绿（油墨绿，带微纹理） ── */
       const base=fbm(n,nx*1.4+cf,ny*1.4,nz*1.4,3)*0.5+0.5;
       ramp(p,base*0.40+0.26,tmp);
       const micro=fbm(n,nx*9.0+cf*1.3,ny*9.0,nz*9.0,3)*0.5+0.5;
       tmp[0]*=0.86+micro*0.20;tmp[1]*=0.86+micro*0.20;tmp[2]*=0.86+micro*0.20;

       /* ── 主走线（曼哈顿走线，强制正交） ──
          用 cell hash 决定哪些行/列启用走线；
          走线宽度 = cell 宽度的固定比例，硬边。 */
       const hMask=n(cu*0.71+cf*0.13, cv*0.71+cf*0.13+11, 0.13)>0.05?1:0;
       const vMask=n(cu*0.71+cf*0.13+22, cv*0.71+cf*0.13, 0.71)>0.05?1:0;
       const mainH=hMask*smoothstep(0.04,0.015,Math.abs(fv-0.5));
       const mainV=vMask*smoothstep(0.04,0.015,Math.abs(fu-0.5));

       /* ── 次级走线（更细、更窄） ── */
       const fineHN=n(cu*0.91+cf*0.31+7, cv*0.91+cf*0.31, 1.31);
       const fineVN=n(cu*0.91+cf*0.31, cv*0.91+cf*0.31+7, 1.91);
       const fineH=fineHN>0.40?smoothstep(0.010,0.005,Math.abs(fv-0.25)):0;
       const fineV=fineVN>0.40?smoothstep(0.010,0.005,Math.abs(fu-0.25)):0;

       /* ── 焊盘 / 过孔 ── */
       const viaOn=n(cu*0.83+cf*0.13, cv*0.83+cf*0.13, 0.51)>0.42?1:0;
       const viaD=Math.sqrt((fu-0.5)*(fu-0.5)+(fv-0.5)*(fv-0.5));
       const via=viaOn*smoothstep(0.14,0.07,viaD);
       const viaRing=viaOn*(smoothstep(0.16,0.14,viaD)-smoothstep(0.13,0.10,viaD));

       /* ── 元器件焊盘（锚点定位，保证多 cell 元器件一致）──
          用 anchor block 的 hash 决定元器件位置与尺寸；
          所有组成 cell 通过 anchor 查到同一组属性。 */
       // anchor：以 2x1 block 为单位（成对 cell），锚点行 = cv
       const anchorX=Math.floor(cu/2)*2;
       const anchorY=cv;
       const aSeed=n(anchorX*0.91+cf*0.31+33, anchorY*0.91+cf*0.31, 0.83);
       const aShape=n(anchorX*0.91+cf*0.31, anchorY*0.91+cf*0.31+33, 1.73);
       const aSeedNext=n(anchorX*0.91+cf*0.31+33, (anchorY+1)*0.91+cf*0.31, 0.83);
       const compW=(aShape>0.55)?2:1;
       const compH=(aShape<-0.20 && aSeedNext>0.45)?2:1;
       // 当前 cell 是否属于某元器件
       const inFirstRow=cu===anchorX || cu===anchorX+1;
       const inSecondRow=compH===2 && cu===anchorX && cv===anchorY+1;
       const inSecondRowR=compH===2 && cu===anchorX+1 && cv===anchorY+1;
       const isComp=aSeed>0.58 && (inFirstRow || inSecondRow || inSecondRowR);
       // 像素在元器件内的相对位置（lx∈[0,compW), ly∈[0,compH)）
       const lx=fu+(cu-anchorX);
       const ly=((cv===anchorY+1) && compH===2)?1+fv:fv;
       const dx=Math.min(lx, compW-lx), dy=Math.min(ly, compH-ly);
       const padEdge=Math.min(dx, dy);
       // 焊盘主体：内部实心，边缘抗锯齿
       const comp=isComp?smoothstep(0.02,0.10,padEdge):0;
       // 焊盘中心略亮（凸起感）
       const compCore=isComp?smoothstep(0.18,0.28,padEdge):0;
       // 焊盘内边缘细暗带
       const compRim=isComp?Math.max(0,smoothstep(0.08,0.10,padEdge)-smoothstep(0.10,0.13,padEdge)):0;

       /* ── 丝印：每个元器件附近的白色标记（小圆点）── */
       const silkSeed=n(cu*1.5+cf*0.7, cv*1.5+cf*0.7, 1.51);
       const silkD=Math.sqrt((fu-0.86)*(fu-0.86)+(fv-0.14)*(fv-0.14));
       const sil=silkSeed>0.30&&silkD<0.06?smoothstep(0.06,0.02,silkD)*0.7:0;

       /* ── 合成覆层（铜色：走线、过孔、SMD 焊盘）── */
       const metal=Math.max(mainH,mainV,fineH,fineV,via,comp*0.85);
       if(metal>0)mixc(tmp,copper,metal*0.82,tmp);
       // 过孔焊环（银白色）
       if(viaRing>0)mixc(tmp,silk,viaRing*0.55,tmp);
       // 元器件焊盘芯（浅镀锡）
       if(compCore>0)mixc(tmp,silk,compCore*0.45,tmp);
       // 元器件边缘暗框
       if(compRim>0){
         tmp[0]*=1-compRim*0.55;tmp[1]*=1-compRim*0.55;tmp[2]*=1-compRim*0.55;
       }
       // 丝印白
       if(sil>0)mixc(tmp,silk,sil,tmp);

       /* ── 发光：通电的走线 / 过孔 / 偶发指示灯 ── */
       const live=Math.max(mainH*0.85,mainV*0.85,via*0.7);
       const em=clamp01(live+fineH*0.35+fineV*0.35)*225;
       // 偶发指示灯：极少数元器件中心点亮
       const ledOn=isComp&&aSeed>0.92&&cu===anchorX;
       const ledD=Math.sqrt((fu-0.5)*(fu-0.5)+(fv-0.5)*(fv-0.5));
       const blink=ledOn?smoothstep(0.10,0.02,ledD)*180:0;
       tmp[0]+=glowCol[0]*em/255*0.55+hiLit[0]*blink/255*0.4;
       tmp[1]+=glowCol[1]*em/255*0.55+hiLit[1]*blink/255*0.4;
       tmp[2]+=glowCol[2]*em/255*0.55+hiLit[2]*blink/255*0.4;

       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=em+blink;o[4]=58+metal*135;o[5]=0;
     };
   }},
  {name:"管道环带型",w:3,hs:20,
   pal:[[204,12,24],[200,10,38],[196,8,52],[210,14,68],[190,18,32],[30,44,40],[186,66,62]],
   at:[196,46,58],ats:[0.12,0.34],amb:0.14,limb:0.22,
   traits:["环绕管道网","冷却回路"],
   build(rand,cfg,p){
     const n=cfg.noise,cf=rnd(rand,0,50);
     let Nu=rint(rand,20,44);if(Nu%2)Nu++;
     const Nv=rint(rand,8,20);
     const glowCol=hsl2rgb(rnd(rand,180,215),90,rnd(rand,55,72));
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       const rib=Math.abs(Math.sin(G.v*Math.PI*Nv));
       const pipe=Math.abs(Math.sin(G.u*Math.PI*Nu));
       const ribL=smoothstep(0.88,1.0,rib),pipeL=smoothstep(0.90,1.0,pipe);
       const tube=smoothstep(0.55,0.95,rib)*0.7+0.3;
       const plate=fbm(n,nx*1.9+cf,ny*1.9,nz*1.9,4)*0.5+0.5;
       ramp(p,plate*0.55+0.1+pipe*0.14,tmp);
       const rust=fbm(n,nx*4.4+13,ny*4.4,nz*4.4,4)*0.5+0.5;
       tmp[0]*=0.84+rust*0.32;tmp[1]*=0.84+rust*0.32;tmp[2]*=0.84+rust*0.32;
       tmp[0]*=1-ribL*0.5;tmp[1]*=1-ribL*0.5;tmp[2]*=1-ribL*0.5;
       mixc(tmp,p[5],clamp01(ribL*0.8+pipeL*0.6),tmp);
       const em=clamp01(ribL*0.9+pipeL*0.5)*225;
       mixc(tmp,p[6],em/255*0.75,tmp);
       tmp[0]+=glowCol[0]*em/255*0.3;tmp[1]+=glowCol[1]*em/255*0.3;tmp[2]+=glowCol[2]*em/255*0.3;
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=em;o[4]=70+tube*90;o[5]=0;
     };
   }},
  {name:"蜂窝单元型",w:3,hs:24,
   pal:[[196,14,16],[192,12,26],[200,10,38],[188,16,52],[204,20,24],[36,50,36],[178,70,56]],
   at:[196,44,56],ats:[0.1,0.3],amb:0.15,limb:0.2,
   traits:["蜂窝式单元舱","分区环境控制"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const cs=rnd(rand,6,13);
     const glowCol=hsl2rgb(rnd(rand,150,210),90,rnd(rand,52,72));
     const lit=chance(rand,0.5)?rnd(rand,0.45,0.62):rnd(rand,0.2,0.4);
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       w(nx*cs+cf,ny*cs,nz*cs,wo);
       const f1=wo[0],f2=wo[1],id=wo[2];
       const wall=1-smoothstep(0.02,0.10,f2-f1);     // 壁
       const cell=smoothstep(0.06,0.22,f1);          // 内部
       const dome=1-smoothstep(0.0,0.26,f1);
       const plate=fbm(n,nx*2.2+cf,ny*2.2,nz*2.2,3)*0.5+0.5;
       ramp(p,plate*0.42+0.14+id*0.12,tmp);
       const sh2=0.36+0.62*cell+0.24*dome;
       tmp[0]*=sh2;tmp[1]*=sh2;tmp[2]*=sh2;
       mixc(tmp,p[5],wall*0.8,tmp);
       const on=id>lit?1:0;
       const em=clamp01(on*cell*0.9+wall*0.35)*230;
       mixc(tmp,p[6],on*cell*0.6,tmp);
       tmp[0]+=glowCol[0]*on*cell*0.22;tmp[1]+=glowCol[1]*on*cell*0.22;tmp[2]+=glowCol[2]*on*cell*0.22;
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=em;o[4]=50+cell*140;o[5]=0;
     };
   }},
  {name:"破碎壳体型",w:2,hs:22,
   pal:[[208,8,22],[204,6,36],[200,4,50],[212,10,64],[196,12,30],[28,60,40],[40,90,58]],
   at:[200,40,54],ats:[0.12,0.36],amb:0.16,limb:0.2,
   traits:["破损外壳","内部结构外露","熔毁内芯"],
   build(rand,cfg,p){
     const n=cfg.noise,w=cfg.worley,wo=cfg._wo,cf=rnd(rand,0,50);
     const ps=rnd(rand,3,7);
     const coreCol=hsl2rgb(rnd(rand,16,44),95,rnd(rand,52,66));
     return function(c,G,o){
       const nx=G.nx,ny=G.ny,nz=G.nz;
       w(nx*ps+cf,ny*ps,nz*ps,wo);
       const f1=wo[0],f2=wo[1],id=wo[2];
       const gap=smoothstep(0.02,0.20,f1);            // 0=缝隙 1=板内
       const panel=smoothstep(0.20,0.42,f1);
       const plate=fbm(n,nx*2.0+cf,ny*2.0,nz*2.0,4)*0.5+0.5;
       ramp(p,plate*0.4+0.22+id*0.1,tmp);
       const sh2=0.3+0.8*panel;
       tmp[0]*=sh2;tmp[1]*=sh2;tmp[2]*=sh2;
       // 缺失板块 → 露出熔融内芯
       const missing=id<0.28?1:0;
       const hole=missing*(1-smoothstep(0.0,0.12,f1));
       const hot=fbm(n,nx*3.2+17,ny*3.2,nz*3.2,3)*0.5+0.5;
       mixc(tmp,p[6],hole*0.95,tmp);
       mixc(tmp,p[5],hole*hot*0.6,tmp);
       const em=clamp01(hole*0.95+(1-gap)*0.25)*245;
       tmp[0]+=coreCol[0]*hole*0.45;tmp[1]+=coreCol[1]*hole*0.45;tmp[2]+=coreCol[2]*hole*0.45;
       o[0]=tmp[0];o[1]=tmp[1];o[2]=tmp[2];o[3]=em;o[4]=60+panel*90;o[5]=0;
     };
   }}
  ]
};
