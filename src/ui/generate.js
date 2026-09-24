import { $, loader, toast } from './dom.js';
import { createPlanet } from '../planet/create.js';
import { updateInfo } from './info.js';
import { drawBG } from '../render/background.js';
import { CUR, setPlanet, rollPhases, generating, setGenerating, count, bumpCount } from '../runtime.js';

export async function generate(seedStr,opts){
  if(generating)return;
  const o=opts||{};
  setGenerating(true);
  const btn=$("btnGen");btn.disabled=true;
  loader.classList.add("on");
  $("vptag").textContent="SCAN // 合成中";
  loadtxt.textContent="正在合成星体… 0%";
  await new Promise(r=>setTimeout(r,24));
  const P=await createPlanet(seedStr,p=>{
    loadtxt.textContent="正在合成星体… "+Math.round(p*100)+"%";
  });
  setPlanet(P);
  /* 换分辨率重合成时保留自转相位与合成计数：画面不跳、计数不虚增 */
  if(!o.keepPhase)rollPhases();
  drawBG();
  updateInfo(P);
  $("seedInput").value=seedStr;
  if(!o.noCount)$("cnt").textContent=bumpCount();
  $("vptag").textContent="SCAN // "+P.biome.en+" · "+P.name;
  loader.classList.remove("on");
  btn.disabled=false;setGenerating(false);
}

/* 安全版生成：任何异常都不会让按钮永久卡死 */
export function safeGenerate(seedStr,opts){
  generate(seedStr,opts).catch(err=>{
    console.error(err);
    loader.classList.remove("on");
    $("btnGen").disabled=false;
    setGenerating(false);
    toast("生成失败，已恢复操作");
  });
}
