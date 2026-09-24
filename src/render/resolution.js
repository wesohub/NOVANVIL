import { toast } from '../ui/dom.js';
import { CUR, generating } from '../runtime.js';
import { TW, TH, setTextureSize } from '../texture/size.js';
import { setRenderRadius } from './sphere.js';
import { VW, VH, OUT, setOutputScale } from './layout.js';
import { applyCanvasSize } from './canvas.js';
import { refreshRatioUI } from './aspect.js';
import { safeGenerate } from '../ui/generate.js';

/* ───────── 星球分辨率档位 ─────────
   三层必须同一个倍率一起走：只提画布输出，球面仍是 240 像素半径，放大后照样糊；
   只提球面，纹理纹素又比像素粗，细节仍是空壳。代价是内存与合成耗时按 k² 增长 */
export const RES_STEPS=[
  {k:1,  name:"标准", tex:"1024×512"},
  {k:1.5,name:"高清", tex:"1536×768"},
  {k:2,  name:"极致", tex:"2048×1024"}
];
export let resIdx=0;
/* 分段按钮选中态与逻辑档位强制一致：切换被拒时也要把 UI 拨回去 */
export function syncResUI(){
  const bs=document.querySelectorAll("#resBtns button");
  for(let j=0;j<bs.length;j++)bs[j].classList.toggle("on",j===resIdx);
}
export function setResolution(i){
  const st=RES_STEPS[i];
  if(!st)return;
  if(i===resIdx){syncResUI();return;}
  if(generating){syncResUI();toast("合成中，稍后再切换画质");return;}
  resIdx=i;
  setTextureSize(Math.round(1024*st.k),Math.round(512*st.k));
  setRenderRadius(Math.round(240*st.k));
  setOutputScale(st.k);
  applyCanvasSize();
  syncResUI();
  /* 比例下拉里的分辨率 = 比例逻辑尺寸 × 画质倍率，倍率一变必须重刷 */
  refreshRatioUI();
  toast("画质 "+st.name+" · "+st.k+"× · 纹理 "+TW+"×"+TH+" · 画布 "+Math.round(VW*OUT)+"×"+Math.round(VH*OUT));
  /* 同一颗星按新画质重合成：种子与自转相位都保持，只是更清晰 */
  if(CUR)safeGenerate(CUR.seed,{keepPhase:true,noCount:true});
}
