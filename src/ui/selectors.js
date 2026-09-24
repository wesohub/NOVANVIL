import { $ } from './dom.js';
import { BIOMES } from '../biomes/index.js';
/* ── 亚型（细分形态）下拉 ── */
export function fillSubSel(tkey,keep){
  const sub=$("subSel");
  const bm=BIOMES[tkey];
  if(!bm){
    sub.innerHTML='<option value="">✦ 亚型随机（随大类）</option>';
    sub.disabled=true;sub.title="先选择具体大类，才能指定亚型";
    return;
  }
  sub.disabled=false;sub.title="指定该大类下的细分形态";
  sub.innerHTML='<option value="">✦ 亚型随机</option>'+
    bm.subs.map((s,i)=>'<option value="'+i+'">'+(i+1)+". "+s.name+"</option>").join("");
  if(keep!=null&&keep!==undefined&&bm.subs[keep])sub.value=String(keep);
}
/* 当前 UI 上选中的亚型（null = 随机） */
export function curSubChoice(tkey){
  const sub=$("subSel");
  if(!tkey||sub.disabled||sub.value==="")return null;
  const i=+sub.value;
  return (BIOMES[tkey]&&BIOMES[tkey].subs[i])?i:null;
}
