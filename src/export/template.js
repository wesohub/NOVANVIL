/* ═══════════════════════════════════════════════════════════════
   导出页模板：生成一个自包含的单文件 HTML
   —— 两张烘焙贴图以 data URL 内嵌，运行时按视口短边归一自适应任意比例
   防漂移：星空 / 辉光 / 月球这三段绘制直接用主应用的函数源码（toString），
   在导出页里同名声明它们依赖的 ctx/CX/CY/STARS/bg/bgx/TAU/clamp01 即可；
   片元着色器也是同一份，只换解包方式（见 sphere.js）
   ═══════════════════════════════════════════════════════════════ */
import { GL_VS, GL_FS_BAKED } from '../render/sphere.js';
import { seedStars, drawBG } from '../render/background.js';
import { drawGlow } from '../render/glow.js';
import { drawMoons } from '../render/moons.js';
import { LIGHT_DEF, ELEV_DEF } from '../render/light.js';

const CSS=`
:root{--mono:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;--fluo:#3dffd0;--line:#3a3a3a}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden;background:#000}
body{color:#e8e8e8;font-family:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
canvas{display:block;touch-action:none;cursor:grab}
canvas.grab{cursor:grabbing}
.hud{position:fixed;inset:0;pointer-events:none;opacity:0;transition:opacity .5s}
body.rdy .hud{opacity:1}
body.rdy .hud.dim{opacity:0}
body.rdy .hud.dim .ctl{pointer-events:none}
.tag{position:absolute;left:14px;bottom:13px;font-family:var(--mono);font-size:10px;letter-spacing:.14em;color:rgba(255,255,255,.42)}
.hint{position:absolute;left:50%;top:12px;transform:translateX(-50%);font-family:var(--mono);font-size:10px;color:rgba(255,255,255,.26);white-space:nowrap}
.ctl{position:absolute;right:14px;bottom:12px;display:flex;align-items:center;gap:4px;pointer-events:auto}
.ctl button{width:32px;height:32px;padding:0;display:flex;align-items:center;justify-content:center;
  font-family:var(--mono);font-size:13px;line-height:1;color:#dcdcdc;background:rgba(8,8,8,.74);
  border:1px solid var(--line);cursor:pointer;transition:.14s}
.ctl button:hover{border-color:#fff;color:#fff;background:rgba(22,22,22,.9)}
.ctl button.on{border-color:var(--fluo);color:var(--fluo);background:rgba(61,255,208,.14)}
.ctl .val{font-family:var(--mono);font-size:9.5px;line-height:1;color:rgba(255,255,255,.5);min-width:26px;text-align:right}
#ld{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#000;
  color:var(--fluo);font-family:var(--mono);font-size:11.5px;letter-spacing:.14em;z-index:9}
@media (max-width:560px){.hint{display:none}}
`;

/* 导出页运行时：布局 / 星空 / 球面 / 合成 / 控件。
   与主应用 loop.js 同序：星空 → 后层卫星 → 球体 → 辉光 → 前层卫星 */
function runtime(P){
  return `
var cv=document.getElementById("scene"),ctx=cv.getContext("2d");
var bg=document.createElement("canvas"),bgx=bg.getContext("2d");
var STARS=[];
var CW=0,CH=0,CX=0,CY=0,VW=0,VH=0,OUT=1,Rs=0,RR=0;
var zoom=P.zoom,OX=P.ox,lightAng=P.lightAng,elev=P.elev;
var phase=P.phase,cloudPhase=P.cloudPhase,paused=false,tSec=0;
window.__LIGHT={x:0,y:0,z:1};

function setLight(a0,e0){
  var a=a0*PI/180,e=e0*PI/180;
  window.__LIGHT={x:Math.cos(e)*Math.sin(a),y:-Math.sin(e),z:Math.cos(e)*Math.cos(a)};
}

var pcv=document.createElement("canvas");
var gl=pcv.getContext("webgl2",{alpha:true,antialias:false});
var ld=document.getElementById("ld");
if(!gl){ld.textContent="当前浏览器不支持 WebGL2，无法渲染";return;}

function sh(t,src){var s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
var prog=gl.createProgram();
gl.attachShader(prog,sh(gl.VERTEX_SHADER,GL_VS));
gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,GL_FS));
gl.linkProgram(prog);
if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(prog));
var UNAMES=["uRot","uRR","uAmb","uLimb","uAtmS","uHasCloud","uAA","uTexWH","uLight","uAtm","uTexA","uTexB"],U={},i;
for(i=0;i<UNAMES.length;i++)U[UNAMES[i]]=gl.getUniformLocation(prog,UNAMES[i]);
var txA=gl.createTexture(),txB=gl.createTexture();

function bindTex(t,unit,img){
  gl.activeTexture(gl.TEXTURE0+unit);
  gl.bindTexture(gl.TEXTURE_2D,t);
  /* 贴图是数值通道不是色彩图：禁止浏览器的色彩空间转换，保持字节原样 */
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,img);
  gl.generateMipmap(gl.TEXTURE_2D);
}

/* 布局：短边恒定为取景基准 —— S=min(VW,VH)/640，星球占短边比例与主应用一致，
   因此从 21:9 到 9:16 任意窗口都不裁切、不溢出 */
function layout(reseed){
  VW=Math.max(1,window.innerWidth);VH=Math.max(1,window.innerHeight);
  OUT=Math.min(window.devicePixelRatio||1,2);
  cv.width=Math.round(VW*OUT);cv.height=Math.round(VH*OUT);
  cv.style.width=VW+"px";cv.style.height=VH+"px";
  ctx.setTransform(OUT,0,0,OUT,0,0);
  CW=VW;CH=VH;
  bg.width=cv.width;bg.height=cv.height;
  bgx.setTransform(OUT,0,0,OUT,0,0);
  var S=Math.min(VW,VH)/640;
  Rs=170*zoom*S;
  CX=VW/2+OX;CY=VH/2;
  /* 离屏球按设备像素 1:1（上限 1024 半径，防超宽屏爆显存），uAA 随之收敛到 1 */
  RR=clamp(Math.round(Rs*OUT),32,1024);
  pcv.width=RR*2;pcv.height=RR*2;
  /* 赋 width/height 一定会清空画布：星点可以不重铺，但背景必须重绘 */
  if(reseed!==false)seedStars(Math.max(140,Math.round(360*VW*VH/728320)));
  drawBG();
}
function oxMax(){return Math.round(VW*0.35/40)*40;}
function setOX(v){
  OX=clamp(Math.round(v),-oxMax(),oxMax());CX=VW/2+OX;
  document.getElementById("vX").textContent=(OX>0?"+":"")+OX;
}
function setZoom(v){
  zoom=clamp(v,0.6,2.4);layout(false);
  document.getElementById("vZoom").textContent=zoom.toFixed(2);
}
function render(ph){
  gl.viewport(0,0,RR*2,RR*2);
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(prog);
  gl.uniform1i(U.uTexA,0);gl.uniform1i(U.uTexB,1);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,txA);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,txB);
  var L=window.__LIGHT,at=P.atmos.col;
  gl.uniform1f(U.uRot,ph);
  gl.uniform1f(U.uRR,RR);
  gl.uniform1f(U.uAA,clamp(RR/(Rs*OUT),0.6,3));
  gl.uniform1f(U.uAmb,P.ambient);
  gl.uniform1f(U.uLimb,P.limb);
  gl.uniform1f(U.uAtmS,P.atmos.str);
  gl.uniform1f(U.uHasCloud,P.hasCloud?1:0);
  gl.uniform2f(U.uTexWH,P.texW,P.texH);
  gl.uniform3f(U.uLight,L.x,L.y,L.z);
  gl.uniform3f(U.uAtm,at[0]/255,at[1]/255,at[2]/255);
  gl.drawArrays(gl.TRIANGLES,0,3);
}

var last=performance.now();
function frame(now){
  var dt=Math.min(80,now-last);last=now;
  if(!paused){
    tSec+=dt;
    phase+=P.rotSpeed*(dt/1000)*P.spinDir;
    cloudPhase+=P.rotSpeed*(dt/1000)*P.cloudMul*P.cloudDir;
    phase-=Math.floor(phase);cloudPhase-=Math.floor(cloudPhase);
  }
  for(var k=0;k<STARS.length;k++)STARS[k].tw+=dt/1000*STARS[k].sp;
  setLight(lightAng,elev);
  ctx.clearRect(0,0,CW,CH);
  ctx.drawImage(bg,0,0,CW,CH);
  drawMoons(P,Rs,tSec/1000,false);
  render(phase);
  ctx.drawImage(pcv,CX-Rs,CY-Rs,Rs*2,Rs*2);
  drawGlow(P,Rs);
  drawMoons(P,Rs,tSec/1000,true);
  requestAnimationFrame(frame);
}

var hud=document.getElementById("hud"),hideT=0;
function poke(){
  hud.classList.remove("dim");
  clearTimeout(hideT);
  hideT=setTimeout(function(){hud.classList.add("dim");},3200);
}
addEventListener("pointermove",poke);addEventListener("pointerdown",poke);
addEventListener("keydown",poke);

var dragging=false,sx=0,sy=0,sAng=0,sEl=0;
function endDrag(){dragging=false;cv.classList.remove("grab");}
cv.addEventListener("pointerdown",function(e){
  poke();dragging=true;sx=e.clientX;sy=e.clientY;sAng=lightAng;sEl=elev;
  cv.setPointerCapture(e.pointerId);cv.classList.add("grab");
});
cv.addEventListener("pointerup",endDrag);
cv.addEventListener("pointercancel",endDrag);
cv.addEventListener("pointermove",function(e){
  if(!dragging)return;
  var r=cv.getBoundingClientRect();
  if(!r.width||!r.height)return;
  lightAng=wrapDeg(sAng+(e.clientX-sx)/r.width*300);
  elev=clamp(sEl-(e.clientY-sy)/r.height*110,-60,70);
});
cv.addEventListener("wheel",function(e){
  e.preventDefault();poke();setZoom(zoom*(e.deltaY>0?0.94:1.06));
},{passive:false});
function togglePause(){
  paused=!paused;
  var b=document.getElementById("bPause");
  b.textContent=paused?"▶":"⏸";b.classList.toggle("on",paused);
}
cv.addEventListener("dblclick",togglePause);
document.getElementById("bPause").onclick=togglePause;
document.getElementById("bReset").onclick=function(){
  lightAng=${LIGHT_DEF};elev=${ELEV_DEF};poke();
};
document.getElementById("bZoomIn").onclick=function(){poke();setZoom(zoom*1.12);};
document.getElementById("bZoomOut").onclick=function(){poke();setZoom(zoom/1.12);};
document.getElementById("bLeft").onclick=function(){poke();setOX(OX-40);};
document.getElementById("bRight").onclick=function(){poke();setOX(OX+40);};

var rT=0;
addEventListener("resize",function(){clearTimeout(rT);rT=setTimeout(function(){layout();},120);});
addEventListener("orientationchange",function(){setTimeout(function(){layout();},250);});

function loadImg(u){
  return new Promise(function(res,rej){
    var im=new Image();
    im.onload=function(){res(im);};
    im.onerror=function(){rej(new Error("贴图解码失败"));};
    im.src=u;
  });
}
Promise.all([loadImg(TEXA),loadImg(TEXB)]).then(function(ims){
  bindTex(txA,0,ims[0]);bindTex(txB,1,ims[1]);
  layout(true);
  document.getElementById("vZoom").textContent=zoom.toFixed(2);
  document.getElementById("vX").textContent=(OX>0?"+":"")+OX;
  ld.parentNode.removeChild(ld);
  document.body.classList.add("rdy");
  poke();
  requestAnimationFrame(frame);
}).catch(function(e){ld.textContent="载入失败："+e.message;});
`;
}

const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
export function buildExportHTML(o){
  const P=o.params;
  /* 种子/名称可以手输，JSON 里的 < 一律转义（防 </script> 截断）；HTML 文本位另行转义 */
  const pj=JSON.stringify(P).replace(/</g,"\\u003c");
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(P.name)} · ${esc(P.seed)}</title>
<style>${CSS}</style>
</head>
<body>
<canvas id="scene"></canvas>
<div class="hud" id="hud">
  <div class="tag">${esc(P.cn)} · ${esc(P.en)} ｜ SEED ${esc(P.seed)}</div>
  <div class="hint">拖动=光照 · 滚轮=缩放 · 双击=暂停</div>
  <div class="ctl">
    <button id="bPause" title="暂停 / 继续">⏸</button>
    <button id="bReset" title="光照归位（方位 ${LIGHT_DEF}° · 仰角 ${ELEV_DEF}°）">☉</button>
    <span class="val" id="vZoom">1.00</span>
    <button id="bZoomOut" title="缩小">－</button>
    <button id="bZoomIn" title="放大">＋</button>
    <span class="val" id="vX">0</span>
    <button id="bLeft" title="星球左移">◀</button>
    <button id="bRight" title="星球右移">▶</button>
  </div>
</div>
<div id="ld">正在装载星体…</div>
<script>
(function(){
"use strict";
var TEXA=${JSON.stringify(o.texA)};
var TEXB=${JSON.stringify(o.texB)};
var P=${pj};
var TAU=Math.PI*2,PI=Math.PI;
/* seedStars 在 count<=0 时会回落到 STAR_BASE，这里补上同名常量 */
var STAR_BASE=360;
var clamp=function(v,a,b){return v<a?a:(v>b?b:v);};
var clamp01=function(v){return v<0?0:(v>1?1:v);};
var wrapDeg=function(d){return ((d+180)%360+360)%360-180;};
var seedStars=${seedStars.toString()};
var drawBG=${drawBG.toString()};
var drawGlow=${drawGlow.toString()};
var drawMoons=${drawMoons.toString()};
var GL_VS=${JSON.stringify(GL_VS)};
var GL_FS=${JSON.stringify(GL_FS_BAKED)};
${runtime(P)}
})();
</script>
</body>
</html>
`;
}
