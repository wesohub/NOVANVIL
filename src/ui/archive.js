import { $ } from './dom.js';
import { cv } from '../render/canvas.js';
import { CW, CH, CX, CY, OUT, OX, setOffsetX } from '../render/layout.js';
import { drawFrame } from '../render/loop.js';
import { arch, pushArchive, removeArchive, zoom, setZoom } from '../runtime.js';
import { generate } from './generate.js';

/* 档案编辑态：默认关闭，删除按钮不展示，防止误删；点「✎ 编辑」进入编辑态才出现删除 */
let editing=false;
export function toggleEdit(){
  editing=!editing;
  const b=$("archEdit");
  if(b){
    b.textContent=editing?"✓ 完成":"✎ 编辑";
    b.classList.toggle("on",editing);
  }
  renderArch();
}

/* 档案 */
export function addArchive(P){
  /* 存档照片统一用默认取景（缩放 1 倍 + 球心居中），
     不随当前窗口的缩放 / 拖动而改变，保证每颗球照片构图一致 */
  const realZoom=zoom,realOX=OX;
  setZoom(1);
  setOffsetX(0);
  drawFrame();
  const c=document.createElement("canvas");c.width=112;c.height=112;
  const x=c.getContext("2d");
  const s=Math.min(CW,CH)*0.42;
  const sw=s*2;
  /* 源矩形按画布内部像素取（逻辑尺寸 × OUT），否则输出倍率一高就只截到左上角 */
  let sx=CX-s,sy=CY-s;
  /* 星球可左右位移，取景窗口必须夹在画布内，
     否则源矩形出界会截出错位的缩略图（窄画布 + 大偏移时必现） */
  if(sx<0)sx=0;else if(sx+sw>CW)sx=CW-sw;
  if(sy<0)sy=0;else if(sy+sw>CH)sy=CH-sw;
  x.drawImage(cv,sx*OUT,sy*OUT,sw*OUT,sw*OUT,0,0,112,112);
  /* 还原用户当前视图 */
  setZoom(realZoom);
  setOffsetX(realOX);
  drawFrame();
  const ok=pushArchive({seed:P.seed,name:P.name,type:P.biome.name,color:P.biome.color,url:c.toDataURL("image/png")});
  renderArch();
  return ok;
}
export function renderArch(){
  const el=$("arch");
  if(!arch.length){el.innerHTML='<div class="empty">暂无记录</div>';return;}
  el.innerHTML=arch.map((a,i)=>
    '<div class="arc" data-i="'+i+'" title="'+a.name+" · "+a.type+"\nSEED: "+a.seed+'">'+
    '<img src="'+a.url+'" alt="'+a.name+'">'+
    (editing?'<button class="del" aria-label="删除" title="删除">×</button>':"")+
    '<span>'+a.name+"</span></div>").join("");
  el.querySelectorAll(".arc").forEach(n=>{
    n.onclick=()=>{const a=arch[+n.dataset.i];$("seedInput").value=a.seed;generate(a.seed);};
    const b=n.querySelector(".del");
    if(b)b.onclick=e=>{
      e.stopPropagation();
      removeArchive(+n.dataset.i);
      renderArch();
    };
  });
}