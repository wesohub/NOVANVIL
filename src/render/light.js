import { PI } from '../core/math.js';

window.__LIGHT={x:-0.6,y:-0.3,z:0.74};
export function setLight(angDeg,elevDeg){
  const a=angDeg*PI/180,e=elevDeg*PI/180;
  window.__LIGHT={x:Math.cos(e)*Math.sin(a),y:-Math.sin(e),z:Math.cos(e)*Math.cos(a)};
}
/* 光照出厂值：方位角 / 仰角，供「光照归位」按钮回位 */
export const LIGHT_DEF=-38,ELEV_DEF=18;
export let lightAng=LIGHT_DEF,elev=ELEV_DEF;
export let dragLight=false;
export function setLightAngles(a,e){ lightAng=a; elev=e; }
export function resetLightAngles(){ lightAng=LIGHT_DEF; elev=ELEV_DEF; }
export function setDragging(v){ dragLight=v; }

export const wrapDeg=d=>{let x=((d+180)%360+360)%360-180;return x;};
