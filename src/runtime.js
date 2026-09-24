/* ═══════════════════════════════════════════════════════════════
   运行时共享状态：当前星体 / 自转相位 / 缩放 / 暂停 / 合成计数 / 档案
   只有本模块写入，其余模块经下面的 setter 修改后按 live binding 读取
   ═══════════════════════════════════════════════════════════════ */
export let CUR=null;
export let phase=0,cloudPhase=0,tSec=0;
export let zoom=1;
export let paused=false;
/* 自转：每秒转过的圈数（0.04 ≈ 25 秒一圈），方向由星球自身的 spinDir 决定 */
export let rotSpeed=0.04;
export let generating=false;
export let count=0;
/* ═══ 档案本地持久化（从零重写） ═══
   基数位：localStorage。写入失败（浏览器禁用 / file:// 配额）时
   绝不静默放弃：打印真实原因到控制台，便于定位。 */
const ARCH_KEY="planetArchives";
const ARCH_MAX=16;
export const arch=loadArch();
function loadArch(){
  let raw=null;
  try{ raw=localStorage.getItem(ARCH_KEY); }
  catch(e){ console.warn("[arch] localStorage 不可读，本次不加载历史档案:",e); return []; }
  if(!raw){ return []; }
  try{
    const list=JSON.parse(raw);
    return Array.isArray(list)?list.slice(0,ARCH_MAX):[];
  }catch(e){
    console.warn("[arch] 历史档案解析失败，已丢弃:",e);
    return [];
  }
}
function saveArch(){
  let json;
  try{ json=JSON.stringify(arch); }
  catch(e){ console.warn("[arch] 档案序列化失败:",e); return; }
  try{
    localStorage.setItem(ARCH_KEY,json);
  }catch(e){
    /* 通常因配额满（base64 缩略图偏大）。裁剪旧记录后重试一次；
       仍失败则打印原因，由用户决定是否清仓。 */
    console.warn("[arch] 首次写入失败，尝试裁剪后重写:",e);
    try{
      const trimmed=arch.slice(0,Math.max(1,Math.floor(arch.length/2)));
      localStorage.setItem(ARCH_KEY,JSON.stringify(trimmed));
    }catch(e2){
      console.warn("[arch] 裁剪写入仍失败，历史档案将无法跨刷新保留:",e2);
    }
  }
}

export function setPlanet(P){ CUR=P; }
export function rollPhases(){ phase=Math.random();cloudPhase=Math.random(); }
export function advanceTime(dt){ tSec+=dt; }
export function advanceSpin(dPhase,dCloud){
  phase+=dPhase;cloudPhase+=dCloud;
  phase-=Math.floor(phase);cloudPhase-=Math.floor(cloudPhase);
}
export function togglePaused(){ paused=!paused; return paused; }
export function setZoom(v){ zoom=v; }
export function setGenerating(v){ generating=v; }
export function bumpCount(){ count++; return count; }
export function pushArchive(rec){
  /* 同一颗星（seed 相同）不入重：默认视图下重复存档直接拒绝 */
  if(arch.some(a=>a.seed===rec.seed))return false;
  arch.unshift(rec);
  if(arch.length>ARCH_MAX)arch.pop();
  saveArch();
  return true;
}
export function removeArchive(i){
  if(i<0||i>=arch.length)return false;
  arch.splice(i,1);
  saveArch();
  return true;
}
