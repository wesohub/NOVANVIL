/* ═══════════════════════════════════════════════════════════════
   主循环
   ═══════════════════════════════════════════════════════════════ */
import { ctx } from './canvas.js';
import { CW, CH, CX, CY } from './layout.js';
import { bg, STARS } from './background.js';
import { pcv, renderSphere } from './sphere.js';
import { drawMoons } from './moons.js';
import { drawGlow } from './glow.js';
import { drawLightGizmo } from './gizmo.js';
import { setLight, lightAng, elev, dragLight } from './light.js';
import { CUR, phase, cloudPhase, tSec, zoom, paused, rotSpeed, advanceTime, advanceSpin } from '../runtime.js';

let last=performance.now();

export function drawFrame(){
  if(!CUR)return;
  setLight(lightAng,elev);
  const Rs=170*zoom;
  ctx.clearRect(0,0,CW,CH);
  ctx.drawImage(bg,0,0,CW,CH);
  drawMoons(CUR,Rs,tSec/1000,false);
  renderSphere(CUR,phase,Rs);
  ctx.drawImage(pcv,CX-Rs,CY-Rs,Rs*2,Rs*2);
  drawGlow(CUR,Rs);
  drawMoons(CUR,Rs,tSec/1000,true);
  drawLightGizmo(Rs,dragLight);
}
export function frame(now){
  const dt=Math.min(80,now-last);last=now;
  if(!paused)advanceTime(dt);
  if(CUR){
    if(!paused){
      advanceSpin(rotSpeed*(dt/1000)*CUR.spinDir,rotSpeed*(dt/1000)*CUR.cloudMul*CUR.cloudDir);
    }
    for(const s of STARS)s.tw+=dt/1000*s.sp;
    drawFrame();
  }
  requestAnimationFrame(frame);
}
