import { VW, VH, OUT } from './layout.js';
import { bg, bgx, drawBG } from './background.js';

export const cv=document.getElementById("scene");
export const ctx=cv.getContext("2d");
const vpEl=document.querySelector(".viewport");
/* 画布按可用空间等比缩放（上限 1:1，不放大以避免糊化），
   保证横屏下整页无需滚动即可完整呈现；
   OUT>1 时内部像素更多而 CSS 尺寸不变 → 高分屏下更锐 */
export function fitCanvas(){
  const k=Math.min(vpEl.clientWidth/cv.width,vpEl.clientHeight/cv.height,1);
  cv.style.width=Math.floor(cv.width*k)+"px";
  cv.style.height=Math.floor(cv.height*k)+"px";
}
addEventListener("resize",fitCanvas);
/* 输出倍率切换：重设内部像素 → 重置 ctx 状态 → 重设等比缩放 → 重绘星空 */
export function applyCanvasSize(){
  cv.width=Math.round(VW*OUT);cv.height=Math.round(VH*OUT);
  bg.width=cv.width;bg.height=cv.height;
  ctx.setTransform(OUT,0,0,OUT,0,0);
  bgx.setTransform(OUT,0,0,OUT,0,0);
  fitCanvas();
  drawBG();
}
