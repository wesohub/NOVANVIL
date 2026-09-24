import { $, toast } from './dom.js';
import { BIOMES, BIOME_KEYS } from '../biomes/index.js';
import { newSeed } from '../planet/create.js';
import { safeGenerate } from './generate.js';
import { fillSubSel, curSubChoice } from './selectors.js';
import { addArchive, renderArch, toggleEdit } from './archive.js';
import { initExportPanel } from '../export/panel.js';
import { RES_STEPS, setResolution, syncResUI } from '../render/resolution.js';
import { refreshRatioUI, setRatio } from '../render/aspect.js';
import { cv } from '../render/canvas.js';
import { OX, OX_STEP, setOffsetX } from '../render/layout.js';
import { clamp } from '../core/math.js';
import { CUR, zoom, setZoom as setZoomValue, togglePaused } from '../runtime.js';
import {
  lightAng, elev, wrapDeg, setLightAngles, setDragging, resetLightAngles,
  LIGHT_DEF, ELEV_DEF
} from '../render/light.js';

/* 光照拖拽 / 归位后把缩放数值同步回控件（光源与仰角已无滑块） */
export function syncLightUI(){
  $("vZoom").textContent=zoom.toFixed(2);
}

/* 事件绑定 */
export function initUI(){
  const sel=$("typeSel");
  sel.innerHTML='<option value="">✦ 完全随机（加权）</option>'+
    BIOME_KEYS.map(k=>'<option value="'+k+'">'+BIOMES[k].name+" · "+BIOMES[k].en+"</option>").join("");
  fillSubSel(sel.value||null);
  sel.onchange=()=>fillSubSel(sel.value||null);

  /* 标签式面板切换 */
  $("tabs").addEventListener("click",e=>{
    const b=e.target.closest("button[data-tab]");if(!b)return;
    const k=b.dataset.tab;
    for(const n of $("tabs").children)n.classList.toggle("on",n===b);
    for(const n of document.querySelectorAll(".tabpane"))n.classList.toggle("on",n.dataset.pane===k);
  });

  $("btnGen").onclick=()=>safeGenerate(newSeed(sel.value||null,curSubChoice(sel.value||null)));
  $("btnReroll").onclick=()=>{
    const t=(sel.value||(CUR?CUR.type:null));
    if(!t)return safeGenerate(newSeed(null));
    let sub=curSubChoice(t);
    // 亚型为「随机」时，主动避开当前亚型，保证重掷一定换纹理而不是只换色
    if(sub==null&&CUR&&CUR.type===t&&BIOMES[t].subs.length>1){
      let i=CUR.subIndex,guard=0;
      while(i===CUR.subIndex&&guard++<12)i=Math.floor(Math.random()*BIOMES[t].subs.length);
      sub=i;
    }
    safeGenerate(newSeed(t,sub));
  };
  $("btnSeed").onclick=()=>{
    const v=$("seedInput").value.trim();
    if(!v){toast("请先输入种子");return;}
    safeGenerate(v);
  };
  $("seedInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("btnSeed").click();});

  /* 画质：三档分段按钮（三选一）。切换会立刻按同一颗星的种子重合成（不换星、不重置自转） */
  const resBox=$("resBtns");
  resBox.innerHTML=RES_STEPS.map((r,i)=>
    '<button type="button" data-i="'+i+'" title="画质 '+r.k+"× · 纹理 "+r.tex+'">'+r.name+"</button>").join("");
  resBox.addEventListener("click",e=>{
    const b=e.target.closest("button[data-i]");
    if(b)setResolution(+b.dataset.i);
  });
  syncResUI();

  /* 画面比例：选项文案自带分辨率（= 比例逻辑尺寸 × 当前画质倍率），随画质动态刷新。
     换比例时 setAspect 会把星球位移归零，控件读数也要跟着回零 */
  const ratioSel=$("ratioSel");
  refreshRatioUI();
  ratioSel.onchange=()=>{setRatio(+ratioSel.value);$("vX").textContent="0";};

  /* 暂停 / 继续：冻结自转与卫星公转（星点闪烁保持，画面不僵死） */
  $("btnPause").onclick=e=>{
    const p=togglePaused();
    e.target.textContent=p?"▶":"⏸";
    e.target.title=p?"继续":"暂停";
    e.target.classList.toggle("on",p);
  };
  /* 光照归位：方位角与仰角回到出厂值（拖动改过的取景角度一键还原） */
  $("btnLightReset").onclick=()=>{
    resetLightAngles();
    syncLightUI();
    toast("光照已归位 · "+LIGHT_DEF+"° / "+ELEV_DEF+"°");
  };
  $("btnSave").onclick=()=>{if(CUR)toast(addArchive(CUR)?"已存入观测档案":"该星球已在档案中");};
  $("archEdit").onclick=toggleEdit;
  $("btnPng").onclick=()=>{
    if(!CUR)return;
    cv.toBlob(b=>{
      const a=document.createElement("a");
      a.href=URL.createObjectURL(b);
      a.download=CUR.name.replace(/[^\w\-]+/g,"_")+"_"+CUR.seed+".png";
      a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);
      toast("已导出 PNG");
    });
  };
  /* 缩放：预览窗内 ＋ / － 与桌面滚轮共用同一条缩放路径。
     上限放到 2.4 倍（画布 900×640 内行星可超出视野），按钮步进 12% 便于快速到位 */
  const applyZoom=z=>{
    setZoomValue(clamp(z,0.6,2.4));
    $("vZoom").textContent=zoom.toFixed(2);
  };
  $("btnZoomIn").onclick=()=>applyZoom(zoom*1.12);
  $("btnZoomOut").onclick=()=>applyZoom(zoom/1.12);

  /* 星球左右位移：只改 CX，背景 / 纹理 / 卫星 / 光辉全部自动跟随，无需重建。
     步进固定 40 逻辑像素，不受比例影响，手感可预期 */
  const offXEl=$("vX");
  const applyOffX=v=>{offXEl.textContent=(setOffsetX(v)>0?"+":"")+OX;};
  $("btnMoveLeft").onclick=()=>applyOffX(OX-OX_STEP);
  $("btnMoveRight").onclick=()=>applyOffX(OX+OX_STEP);

  /* 画布交互：拖动采用「相对位移」而不是绝对坐标，
     横向 1 屏宽 ≈ 方位角 300°、纵向 1 屏高 ≈ 仰角 110°，手感线性可预期 */
  let drag=false,sx=0,sy=0,sAng=0,sEl=0;
  const endDrag=()=>{if(!drag)return;drag=false;setDragging(false);cv.style.cursor="grab";};
  cv.addEventListener("pointerdown",e=>{
    drag=true;setDragging(true);
    cv.setPointerCapture(e.pointerId);
    sx=e.clientX;sy=e.clientY;sAng=lightAng;sEl=elev;
    cv.style.cursor="grabbing";
  });
  cv.addEventListener("pointerup",endDrag);
  cv.addEventListener("pointercancel",endDrag);
  cv.addEventListener("pointermove",e=>{
    if(!drag)return;
    const r=cv.getBoundingClientRect();
    if(!r.width||!r.height)return;
    const dx=(e.clientX-sx)/r.width,dy=(e.clientY-sy)/r.height;
    setLightAngles(wrapDeg(sAng+dx*300),clamp(sEl-dy*110,-60,70));
    syncLightUI();
  });
  cv.addEventListener("wheel",e=>{
    e.preventDefault();
    applyZoom(zoom*(e.deltaY>0?0.94:1.06));
  },{passive:false});
  cv.addEventListener("dblclick",()=>$("btnPause").click());

  $("pseed").onclick=()=>{
    const t=$("pseed").textContent;
    navigator.clipboard?.writeText(t).then(()=>toast("种子已复制："+t),()=>toast("种子："+t));
  };

  /* 手机端（竖屏 / 矮屏横屏）：高频操作按钮条从顶栏搬到预览窗正下方，
     让「同型重掷 / 随机生成新星」落进拇指区；「存入档案 / 导出 PNG」留在右上角。
     两套版式共用同一批按钮，不复制 DOM、不重复绑事件 */
  const mqMobile=matchMedia(
    "(max-width:800px) and (orientation:portrait), (orientation:landscape) and (max-height:560px)");
  const placeTools=()=>{
    const t=$("tools"),op=$("oprow"),bar=document.querySelector("header.topbar");
    if(!t||!op||!bar)return;
    if(mqMobile.matches){ if(t.parentElement!==op)op.appendChild(t); }
    else if(t.parentElement!==bar)bar.insertBefore(t,$("toolright"));
  };
  placeTools();
  mqMobile.addEventListener("change",placeTools);

  /* 导出单文件网页：面板 + 烘焙流程 */
  initExportPanel();

  /* 刷新后把已持久化的历史档案即时渲染到栏位，无需再次存档才显示 */
  renderArch();
}
