/* 光源方向指示器：始终显示一个淡淡的「太阳」标记，
   拖动 / 巡航时高亮并标注角度，让拖动操作有即时反馈 */
import { ctx } from './canvas.js';
import { CX, CY } from './layout.js';
import { TAU } from '../core/math.js';
import { lightAng, elev } from './light.js';

export function drawLightGizmo(Rs,active){
  const L=window.__LIGHT;
  const sx=CX+L.x*Rs*1.78,sy=CY+L.y*Rs*1.78;
  ctx.save();
  if(active){
    ctx.setLineDash([3,5]);ctx.strokeStyle="rgba(255,225,150,.34)";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(CX+L.x*Rs*1.06,CY+L.y*Rs*1.06);ctx.lineTo(sx,sy);ctx.stroke();
    ctx.setLineDash([]);
  }
  const rad=active?17:11,a=active?0.6:0.26;
  const g=ctx.createRadialGradient(sx,sy,0,sx,sy,rad);
  g.addColorStop(0,"rgba(255,240,190,"+a+")");
  g.addColorStop(0.4,"rgba(255,200,90,"+(a*0.42)+")");
  g.addColorStop(1,"rgba(255,180,60,0)");
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,rad,0,TAU);ctx.fill();
  ctx.fillStyle="rgba(255,244,214,"+(active?0.95:0.5)+")";
  ctx.beginPath();ctx.arc(sx,sy,active?3.8:2.6,0,TAU);ctx.fill();
  if(active){
    ctx.font='11px ui-monospace,SFMono-Regular,Consolas,monospace';
    ctx.textAlign="center";ctx.textBaseline="middle";
    const label=Math.round(lightAng)+"° / "+Math.round(elev)+"°";
    const ty=sy-22<10?sy+22: sy-22;
    ctx.fillStyle="rgba(4,8,16,.72)";
    const w=ctx.measureText(label).width+12;
    ctx.fillRect(sx-w/2,ty-8,w,16);
    ctx.fillStyle="rgba(255,236,180,.95)";
    ctx.fillText(label,sx,ty);
  }
  ctx.restore();
}
