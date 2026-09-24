/* 大气外辉光 */
import { ctx } from './canvas.js';
import { CX, CY } from './layout.js';
import { TAU } from '../core/math.js';

export function drawGlow(P,Rs){
  const a=P.atmos.col,st=P.atmos.str;
  ctx.save();
  ctx.globalCompositeOperation="lighter";
  ctx.translate(CX,CY);
  const g=ctx.createRadialGradient(0,0,Rs*0.9,0,0,Rs*(1.35+st*0.55));
  g.addColorStop(0,"rgba("+a[0]+","+a[1]+","+a[2]+","+(0.30*st)+")");
  g.addColorStop(0.45,"rgba("+a[0]+","+a[1]+","+a[2]+","+(0.11*st)+")");
  g.addColorStop(1,"rgba("+a[0]+","+a[1]+","+a[2]+",0)");
  ctx.fillStyle=g;
  ctx.beginPath();ctx.arc(0,0,Rs*(1.4+st*0.6),0,TAU);ctx.fill();
  ctx.restore();
}
