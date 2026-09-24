/* 逻辑坐标系基准由 RATIOS 当前档决定（短边恒 640）：取景半径、卫星、光圈全部按它书写。
   画布输出倍率 OUT 只改内部像素数与 ctx 缩放 ——
   布局、取景、DOM 叠加层（角标 / 提示 / 内嵌控件）都不用跟着改 */
export let OUT=1;
export function setOutputScale(k){ OUT=k; }

/* ───────── 画面比例档位 ─────────
   短边恒为 640，只让长边伸缩。取景半径 Rs=170 本就是相对短边定的，因此无需改动，
   球在任意比例下视觉大小一致；archive.js 的 min(CW,CH) 缩略取景也跨比例稳定。
   与「画质」正交：切比例不动纹理、不动离屏球半径，只重铺星空 + 重设画布，近乎瞬时 */
export const RATIOS=[
  {id:"21:9", w:1493, h:640 },
  {id:"16:10",w:1024, h:640 },
  {id:"16:9", w:1138, h:640 },
  {id:"4:3",  w:853,  h:640 },
  {id:"1:1",  w:640,  h:640 },
  {id:"9:16", w:640,  h:1138}
];
export let ratioIdx=2;
/* 逻辑坐标 = 当前比例档，避免「下拉显示 16:10 而画布仍是旧尺寸」的初始错位 */
export let VW=RATIOS[ratioIdx].w,VH=RATIOS[ratioIdx].h;
export let CW=VW,CH=VH,CX=VW/2,CY=VH/2;

/* ───────── 星球水平位移 ─────────
   只挪 CX 一个值：星空留底不动，而光辉、卫星、光照指示器、球面贴图全部按 CX/CY 书写，
   因此一次赋值全场跟随；纹理与离屏球都不重建，下一帧即生效。
   上限 ±35% 画布宽度（球心落在 15%~85% 区间），避免窄画布把球整个推出视野。
   上限对齐到步进倍数：否则夹取会落在 40 的网格之外（如 1138×0.35=398），
   往回走一格就永远回不到 0 */
export const OX_STEP=40;
export let OX=0;
export function oxMax(){ return Math.round(VW*0.35/OX_STEP)*OX_STEP; }
export function setOffsetX(v){
  OX=Math.max(-oxMax(),Math.min(oxMax(),Math.round(v)));
  CX=VW/2+OX;
  return OX;
}
export function setAspect(i){
  const r=RATIOS[i];
  if(!r)return false;
  ratioIdx=i;
  VW=r.w;VH=r.h;
  CW=VW;CH=VH;CX=VW/2;CY=VH/2;
  OX=0;   /* 换比例即回中：旧偏移在新画布上可能把球推出画面 */
  return true;
}
