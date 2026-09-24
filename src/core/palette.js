import { clamp01 } from './math.js';

/* ───────── 调色板 ───────── */
export function hsl2rgb(h,s,l){
  // 兼容两种写法：0-1 小数 与 0-100 百分比。
  // （旧代码里大气色 / 辉光色都写成 72、64 这类百分比，
  //   被 clamp01 直接截成 1 → l=1 时 c=0，所有颜色都变成纯白）
  if(s>1)s/=100;
  if(l>1)l/=100;
  h=((h%360)+360)%360;s=clamp01(s);l=clamp01(l);
  const c=(1-Math.abs(2*l-1))*s,hp=h/60,x=c*(1-Math.abs(hp%2-1));
  let r=0,g=0,b=0;
  if(hp<1){r=c;g=x;}else if(hp<2){r=x;g=c;}else if(hp<3){g=c;b=x;}
  else if(hp<4){g=x;b=c;}else if(hp<5){r=x;b=c;}else{r=c;b=x;}
  const m=l-c/2;
  return [Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)];
}
export function mixc(a,b,t,o){
  o[0]=a[0]+(b[0]-a[0])*t;o[1]=a[1]+(b[1]-a[1])*t;o[2]=a[2]+(b[2]-a[2])*t;return o;
}

/* 用 HSL 定义便于随机色相偏移 */
export function Pal(list,shift,sat,lum){
  shift=shift||0;sat=sat===undefined?1:sat;lum=lum===undefined?1:lum;
  return list.map(c=>{
    // 色域约束：亮度封顶 0.94 —— 再高 hsl2rgb 会把 l 夹成 1，颜色退化成
    // 纯白、丢掉色相（随机上调明度时最容易踩）。对现有色板（lum ≤ 94）幂等。
    let l=c[2]/100*lum;
    if(l>0.94)l=0.94;else if(l<0)l=0;
    return hsl2rgb(c[0]+shift,clamp01(c[1]/100*sat),l);
  });
}

export function ramp(pal,t,o){
  t=clamp01(t)*(pal.length-1);
  const i=Math.min(pal.length-2,Math.floor(t));
  return mixc(pal[i],pal[i+1],t-i,o);
}
