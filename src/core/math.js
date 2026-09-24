/* ───────── 数学 ───────── */
export const TAU=Math.PI*2, PI=Math.PI;
export const clamp=(v,a,b)=>v<a?a:v>b?b:v;
export const clamp01=v=>v<0?0:v>1?1:v;
export const lerp=(a,b,t)=>a+(b-a)*t;
export function smoothstep(a,b,x){ x=clamp01((x-a)/(b-a)); return x*x*(3-2*x); }
