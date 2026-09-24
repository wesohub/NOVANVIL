import { clamp } from '../core/math.js';
import { pick, pickMany, rnd, rint } from '../core/random.js';
/* ═══════════════════════════════════════════════════════════════
   档案数据生成：直径/质量/重力/温度/周期/资源
   ═══════════════════════════════════════════════════════════════ */
export function genStats(rand,bm,traits){
  const m=bm.meta;
  const dia=Math.round(rnd(rand,m.dia[0],m.dia[1])/10)*10;
  const dens=rnd(rand,m.dens[0],m.dens[1]);
  const dr=dia/12742;
  const mass=dens*Math.pow(dr,3);
  const grav=mass/(dr*dr);
  const temp=Math.round(rnd(rand,m.temp[0],m.temp[1]));
  const rot=+rnd(rand,m.rot[0],m.rot[1]).toFixed(rotFmt(m.rot));
  const orb=m.orb[1]>0?Math.round(rnd(rand,m.orb[0],m.orb[1])):0;
  const atmos=pick(rand,m.atmos);
  const res=pickMany(rand,m.res,rint(rand,2,Math.min(4,m.res.length)));
  // 宜居：基础 - 温度偏离惩罚 - 随机
  let hab=m.hab;
  hab-=clamp(Math.abs(temp-15)/3.2,0,55);
  hab+=rnd(rand,-8,10);
  if(traits.some(t=>t.indexOf("辐射")>=0))hab-=14;
  hab=Math.round(clamp(hab,0,99));
  let haz=100-hab;
  haz=Math.round(clamp(haz+rnd(rand,-6,8),1,100));
  return {dia:dia,mass:mass,grav:grav,temp:temp,rot:rot,orb:orb,atmos:atmos,res:res,hab:hab,haz:haz};
}
export function rotFmt(r){return r[1]<10?2:(r[1]<100?1:0);}
export function hazLabel(h){
  if(h<20)return"极低 · I 级";if(h<40)return"低 · II 级";
  if(h<60)return"中等 · III 级";if(h<80)return"高 · IV 级";return"极端 · V 级";
}
export function habLabel(h){
  if(h<10)return"不适宜居住";if(h<30)return"需全封闭基地";
  if(h<55)return"需生命维持";if(h<75)return"可改造殖民地";return"类地宜居住";
}
