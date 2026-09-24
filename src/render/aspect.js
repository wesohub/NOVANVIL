import { $, toast } from '../ui/dom.js';
import { RATIOS, ratioIdx, setAspect, VW, VH, OUT } from './layout.js';
import { applyCanvasSize } from './canvas.js';
import { seedStars } from './background.js';

/* ───────── 画面比例（构图）─────────
   只改逻辑坐标系与画布内部尺寸，不改纹理、不改离屏球半径，所以切换无需重合成。
   与「画质」正交：文案里的分辨率 = 比例逻辑尺寸 × 当前画质倍率，随画质动态刷新 */

/* 下拉文案带出真实导出像素，方便直接判断能出多大的图 */
export function ratioLabel(i){
  const r=RATIOS[i];
  return "比例 "+r.id+" · "+Math.round(r.w*OUT)+"×"+Math.round(r.h*OUT);
}
/* 画质切换后必须重刷：同一比例的导出像素随倍率变 */
export function refreshRatioUI(){
  const sel=$("ratioSel");
  if(!sel)return;
  const cur=sel.value;
  sel.innerHTML=RATIOS.map((r,i)=>'<option value="'+i+'">'+ratioLabel(i)+"</option>").join("");
  sel.value=cur===""?String(ratioIdx):cur;
}
export function setRatio(i){
  const sel=$("ratioSel");
  if(i===ratioIdx){if(sel)sel.value=String(ratioIdx);return;}
  if(!setAspect(i))return;
  seedStars();
  applyCanvasSize();
  if(sel)sel.value=String(ratioIdx);
  toast("画面比例 "+RATIOS[i].id+" · "+Math.round(VW*OUT)+"×"+Math.round(VH*OUT));
}
