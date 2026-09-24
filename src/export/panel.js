/* ═══════════════════════════════════════════════════════════════
   导出面板：画质 + 贴图编码 → 烘焙 → 下载单文件网页
   画质默认「极致」：若当前档位更低，先按同一种子重合成到目标档
   （复用 setResolution，预览也一并留在该档，所见即所得）
   ═══════════════════════════════════════════════════════════════ */
import { $, loader, loadtxt, toast } from '../ui/dom.js';
import { CUR, generating } from '../runtime.js';
import { RES_STEPS, resIdx, setResolution } from '../render/resolution.js';
import { packTextures, collectParams, webpOK } from './bake.js';
import { buildExportHTML } from './template.js';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const fmtSize=n=>n>=1048576?(n/1048576).toFixed(1)+" MB":Math.round(n/1024)+" KB";

/* 等生成结束：generating 是 runtime 的 live binding，轮询读到的就是当前值 */
function waitIdle(){
  return new Promise(res=>{
    const t=setInterval(()=>{if(!generating){clearInterval(t);res();}},60);
  });
}
function download(text,name){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([text],{type:"text/html;charset=utf-8"}));
  a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}

export function initExportPanel(){
  const modal=$("expModal");
  if(!modal)return;
  const qBox=$("expRes"),eBox=$("expEnc"),go=$("expGo"),tip=$("expTip");
  const hasWebp=webpOK();
  let qi=RES_STEPS.length-1,enc="image/png";

  qBox.innerHTML=RES_STEPS.map((r,i)=>
    '<button type="button" data-i="'+i+'"'+(i===qi?' class="on"':"")+">"+r.name+"</button>").join("");
  eBox.innerHTML='<button type="button" data-m="image/png" class="on">PNG 无损</button>'+
    (hasWebp?'<button type="button" data-m="image/webp">WebP 压缩</button>':"");

  const syncTip=()=>{
    const k=RES_STEPS[qi].k;
    tip.textContent=RES_STEPS[qi].name+"档贴图 "+Math.round(1024*k)+"×"+Math.round(512*k)+" · "+
      (enc==="image/png"?"PNG 无损（忠实原图，文件较大）":"WebP 有损压缩（体积约 1/4）")+
      "。导出页无比例限制，按窗口短边自适应，含拖动光照 / 滚轮缩放 / 暂停 / 归位控件。"+
      (resIdx===qi?"":"当前画质低于所选档，导出前会按同一种子重合成一次。");
  };
  syncTip();

  qBox.addEventListener("click",e=>{
    const b=e.target.closest("button[data-i]");if(!b)return;
    qi=+b.dataset.i;
    for(const n of qBox.children)n.classList.toggle("on",n===b);
    syncTip();
  });
  eBox.addEventListener("click",e=>{
    const b=e.target.closest("button[data-m]");if(!b)return;
    enc=b.dataset.m;
    for(const n of eBox.children)n.classList.toggle("on",n===b);
    syncTip();
  });

  const close=()=>modal.classList.remove("on");
  $("btnHtml").onclick=()=>{
    if(!CUR){toast("先生成一颗星再导出");return;}
    if(generating){toast("合成中，稍后再导出");return;}
    modal.classList.add("on");
  };
  $("expCancel").onclick=close;
  modal.addEventListener("click",e=>{if(e.target===modal)close();});

  go.onclick=async()=>{
    if(!CUR)return;
    close();
    try{
      /* 目标档位更高时先重合成（耗时几秒），否则贴图分辨率与导出标注不符 */
      if(resIdx!==qi){
        setResolution(qi);
        if(resIdx!==qi){toast("合成中，稍后再导出");return;}
        await waitIdle();
      }
      if(!CUR)return;
      loader.classList.add("on");loadtxt.textContent="正在烘焙贴图…";
      await sleep(40);
      const bak=packTextures(CUR.tex,enc,0.95);
      loadtxt.textContent="正在拼装单文件网页…";
      await sleep(20);
      const html=buildExportHTML({texA:bak.a,texB:bak.b,params:collectParams(bak)});
      loader.classList.remove("on");
      download(html,CUR.name.replace(/[^\w\-]+/g,"_")+"_"+CUR.seed+".html");
      toast("已导出单文件网页 · "+bak.w+"×"+bak.h+" · 约 "+fmtSize(html.length));
    }catch(err){
      loader.classList.remove("on");
      console.error(err);
      toast("导出失败："+err.message);
    }
  };
}
