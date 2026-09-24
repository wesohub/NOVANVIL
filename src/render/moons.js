/* 卫星 */
import { ctx } from './canvas.js';
import { CX, CY } from './layout.js';
import { TAU, clamp01 } from '../core/math.js';

export function drawMoons(P,Rs,t,front){
  const L=window.__LIGHT;
  /* 屏幕平面光向（与行星 LUT 同一 y 向下约定），供巨月明暗渐变定向 */
  let lx=L.x,ly=L.y;
  const ll=Math.sqrt(lx*lx+ly*ly);
  if(ll<0.05){lx=0;ly=-1;}else{lx/=ll;ly/=ll;}
  for(const m of P.moons){
    const ph=m.ph+t*m.sp;
    const sx=CX+Math.cos(ph)*Rs*m.d;
    const sy=CY+Math.sin(ph)*Rs*m.d*m.tilt;
    const z=Math.sin(ph);
    if((z>0)!==front)continue;
    const sz=Math.max(1.2,m.sz*(Rs/170));
    const lit=clamp01(Math.cos(ph-0)*0.5+0.5)*0.6+0.4;
    ctx.beginPath();ctx.arc(sx,sy,sz,0,TAU);
    const c=m.col;
    const k=0.35+0.65*clamp01((L.x*Math.cos(ph)+L.z*0.6)*0.5+0.6);
    if(m.giant&&sz>=4){
      /* 巨月：立体渲染 —— 平涂底色 + 表面细节，再乘一层径向明暗渐变
         （亮面中心朝向光源、相位越暗高光越沉入暗侧），与星球的
         Lambert 感观一致。细节不再受 z 门控：前后两圈观感连续，
         跨越 z=0 时不会瞬间丢纹理 */
      ctx.save();
      ctx.beginPath();ctx.arc(sx,sy,sz,0,TAU);ctx.clip();
      ctx.fillStyle="rgb("+c[0]+","+c[1]+","+c[2]+")";
      ctx.fillRect(sx-sz,sy-sz,sz*2,sz*2);
      if(m.style===1){          /* 陨击坑：暗坑盘 + 背光侧被照亮的内壁 */
        const nc=2+Math.min(4,sz|0);
        for(let j=0;j<nc;j++){
          const a=m.mt*3.1+j*2.39996;
          const rr=sz*(0.10+((j*37)%10)/38);
          const ox=sx+Math.cos(a)*sz*0.55,oy=sy+Math.sin(a*1.7)*sz*0.55;
          ctx.fillStyle="rgba(255,255,255,.04)";
          ctx.beginPath();ctx.arc(ox-lx*rr*0.25,oy-ly*rr*0.25,rr*0.9,0,TAU);ctx.fill();
          ctx.fillStyle="rgba(0,0,0,.08)";
          ctx.beginPath();ctx.arc(ox,oy,rr,0,TAU);ctx.fill();
        }
      }else if(m.style===2){    /* 条纹 */
        ctx.strokeStyle="rgba(0,0,0,.20)";
        ctx.lineWidth=Math.max(1,sz*0.14);
        for(let j=-1;j<=1;j++){
          const oy=sy+j*sz*0.52;
          ctx.beginPath();ctx.moveTo(sx-sz,oy);ctx.lineTo(sx+sz,oy);ctx.stroke();
        }
      }else if(m.style===3){    /* 环带 */
        ctx.fillStyle="rgba(255,255,255,.14)";
        ctx.fillRect(sx-sz,sy-sz*0.38,sz*2,sz*0.32);
        ctx.fillStyle="rgba(0,0,0,.16)";
        ctx.fillRect(sx-sz,sy+sz*0.06,sz*2,sz*0.26);
      }
      /* 立体明暗：乘法渐变（白=亮面不变色 → 深灰=暗面压暗） */
      const off=sz*(0.30+(1-k)*0.95);
      const b=Math.min(255,Math.round(255*Math.min(1,k*1.2)));
      const d=Math.round(255*k*0.30);
      const g=ctx.createRadialGradient(sx+lx*off,sy+ly*off,0,sx,sy,sz*1.15);
      g.addColorStop(0,"rgb("+b+","+b+","+b+")");
      g.addColorStop(0.6,"rgb("+Math.round(b*0.8)+","+Math.round(b*0.8)+","+Math.round(b*0.8)+")");
      g.addColorStop(1,"rgb("+d+","+d+","+d+")");
      ctx.globalCompositeOperation="multiply";
      ctx.fillStyle=g;
      ctx.fillRect(sx-sz,sy-sz,sz*2,sz*2);
      ctx.globalCompositeOperation="source-over";
      ctx.restore();
      ctx.beginPath();ctx.arc(sx,sy,sz,0,TAU);
      ctx.strokeStyle="rgba(255,255,255,.12)";ctx.lineWidth=1;ctx.stroke();
      continue;
    }
    ctx.fillStyle="rgb("+(c[0]*k|0)+","+(c[1]*k|0)+","+(c[2]*k|0)+")";
    ctx.fill();
    if(z>0){
      /* 表面细节：硬边平涂、无模糊（与整体美术一致），仅限朝向观察者一面 */
      if(sz>=3.2&&m.style>0){
        ctx.save();
        ctx.beginPath();ctx.arc(sx,sy,sz,0,TAU);ctx.clip();
        if(m.style===1){          /* 陨击坑 */
          ctx.fillStyle="rgba(0,0,0,.18)";
          for(let j=0;j<4;j++){
            const a=m.mt*3.1+j*2.4;
            const rr=sz*(0.14+((j*37)%10)/45);
            ctx.beginPath();
            ctx.arc(sx+Math.cos(a)*sz*0.52,sy+Math.sin(a*1.7)*sz*0.52,rr,0,TAU);
            ctx.fill();
          }
        }else if(m.style===2){    /* 条纹 */
          ctx.strokeStyle="rgba(0,0,0,.20)";
          ctx.lineWidth=Math.max(1,sz*0.16);
          for(let j=-1;j<=1;j++){
            const oy=sy+j*sz*0.5;
            ctx.beginPath();ctx.moveTo(sx-sz,oy);ctx.lineTo(sx+sz,oy);ctx.stroke();
          }
        }else if(m.style===3){    /* 环带 */
          ctx.fillStyle="rgba(255,255,255,.16)";
          ctx.fillRect(sx-sz,sy-sz*0.34,sz*2,sz*0.30);
          ctx.fillStyle="rgba(0,0,0,.14)";
          ctx.fillRect(sx-sz,sy+sz*0.06,sz*2,sz*0.26);
        }
        ctx.restore();
      }
      ctx.beginPath();ctx.arc(sx,sy,sz,0,TAU);
      ctx.strokeStyle="rgba(255,255,255,.12)";ctx.lineWidth=1;ctx.stroke();
    }
  }
}
