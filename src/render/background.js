/* ═══════════════════════════════════════════════════════════════
   背景：纯黑星空
   ═══════════════════════════════════════════════════════════════ */
import { TAU } from '../core/math.js';
import { CW, CH } from './layout.js';

export const bg=document.createElement("canvas");
export const bgx=bg.getContext("2d");
export const STARS=[];
/* 基准星数对应 1138×640 的铺满密度；
   导出页按视口面积等比换算（4K 下不稀疏），主应用不传参即用基准值 */
export const STAR_BASE=360;
/* 星点按当前逻辑尺寸铺满：画面比例切换后必须重铺，
   否则变宽时右侧留空白，变窄时星点溢出可视区 */
export function seedStars(count){
  const n=count>0?count:STAR_BASE;
  STARS.length=0;
  for(let i=0;i<n;i++){
    STARS.push({x:Math.random()*CW,y:Math.random()*CH,r:Math.random()*0.95+0.25,
      a:Math.random()*0.7+0.3,tw:Math.random()*TAU,sp:Math.random()*1.4+0.3,
      c:Math.random()<0.12?"#cfe0ff":"#ffffff"});
  }
}
seedStars();
export function drawBG(){
  bgx.clearRect(0,0,CW,CH);
  bgx.fillStyle="#000";bgx.fillRect(0,0,CW,CH);
  for(const s of STARS){
    const a=s.a*(0.7+0.3*Math.sin(s.tw));
    bgx.globalAlpha=a;bgx.fillStyle=s.c;
    bgx.beginPath();bgx.arc(s.x,s.y,s.r,0,TAU);bgx.fill();
  }
  bgx.globalAlpha=1;
}
