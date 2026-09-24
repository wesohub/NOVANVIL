/* ═══════════════════════════════════════════════════════════════
   球面渲染：CPU 纹理生成 + WebGL2 着色器光照
   ═══════════════════════════════════════════════════════════════ */
/* 内部渲染半径：随分辨率档位等比放大（240 = 画布 900×640 下 1:1 像素密度） */
let RR=240,RW=480;
/* WebGL2 球面渲染器：CPU 生成的纹理上传为 GPU 采样器，
   光照 / 大气 / 细节层级全部在片元着色器里逐像素算（原 LUT + 取样循环） */
export const pcv=document.createElement("canvas");
const gl=pcv.getContext("webgl2",{alpha:true,antialias:false,preserveDrawingBuffer:false});
function rebuildRenderTargets(){
  RW=RR*2;
  pcv.width=RW;pcv.height=RW;
}
rebuildRenderTargets();
export const GL_VS=`#version 300 es
void main(){
  vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
  gl_Position=vec4(p*2.0-1.0,0.0,1.0);
}`;
/* ───────── 贴图解包 ─────────
   主应用（运行时）：albedo 走 RGB、emissive 走 A，spec/cloud 各占一张的第二张
   导出页（烘焙）：canvas 后备存储是预乘的，alpha=0 的像素 RGB 会被抹平，
   所以烘焙贴图不能把数据放进 alpha —— 改成两张不透明图：
     uTexA = albedo(RGB)
     uTexB = (emissive, specular, cloud)
   两种解包只有下面这几行不同，着色器主体完全共用，不存在两份实现漂移 */
const UNPACK_LIVE=`
  vec4 A=textureLod(uTexA,uv,lod);
  vec4 B=textureLod(uTexB,uv,lod);`;
const UNPACK_BAKED=`
  vec4 tA=textureLod(uTexA,uv,lod);
  vec4 tB=textureLod(uTexB,uv,lod);
  vec4 A=vec4(tA.rgb,tB.r);
  vec4 B=vec4(tB.g,tB.b,0.0,0.0);`;
const FS_BODY=`#version 300 es
precision highp float;
uniform sampler2D uTexA;   /* rgb=albedo  a=emissive */
uniform sampler2D uTexB;   /* r=spec      g=cloud    */
uniform float uRot,uRR,uAmb,uLimb,uAtmS,uHasCloud,uAA;
uniform vec2 uTexWH;
uniform vec3 uLight,uAtm;
out vec4 fragColor;
void main(){
  float dx=(gl_FragCoord.x-uRR)/uRR;
  float dy=(uRR-gl_FragCoord.y)/uRR;
  float rlen=length(vec2(dx,dy));
  /* 解析抗锯齿：径向覆盖率替代硬 discard。
     bw=过渡带宽度(rlen 计)，至少覆盖 uAA 个内部像素（uAA 由屏幕缩放反推） */
  float bw=max(fwidth(rlen),1e-6)*uAA;
  float cov=clamp((1.0-rlen)/bw+0.5,0.0,1.0);
  if(cov<=0.0)discard;
  /* 球外那圈像素：径向回投到单位圆取样，让颜色向外延续而不是截断 */
  if(rlen>1.0){float inv=1.0/rlen;dx*=inv;dy*=inv;}
  float cp=max(sqrt(max(0.0,1.0-dy*dy)),1e-6);
  float s=clamp(dx/cp,-1.0,1.0);
  float rz=min(rlen,1.0);
  float nz=sqrt(max(0.0,1.0-rz*rz));
  float texW=uTexWH.x,texH=uTexWH.y;
  float uu=fract(asin(s)/6.2831853+uRot)*texW;
  float vv=min((0.5-asin(dy)/3.1415927)*texH,texH-1.0);
  vec2 uv=vec2((uu+0.5)/texW,(vv+0.5)/texH);
  /* 解析 LOD：正交投影下每个屏幕像素覆盖的纹素数随 |s| 与 1/cp 发散，
     对应原 CPU 版的两级边缘降采样 */
  float dH=texW/(6.2831853*cp*sqrt(max(1e-4,1.0-s*s)))/uRR;
  float dV=texH/(3.1415927*cp)/uRR;
  float lod=log2(max(1.0,max(dH,dV)));
__UNPACK__
  vec3 n=vec3(dx,dy,nz);
  float ndl=dot(n,uLight);
  float lam=uAmb+(1.0-uAmb)*pow(clamp((ndl+0.12)/1.12,0.0,1.0),0.85);
  float rr=1.0-nz;
  float rim=pow(rr,2.6)*(0.25+0.75*clamp(ndl,0.0,1.0));
  vec3 hv=normalize(vec3(uLight.xy,uLight.z+1.0));
  float sd=clamp(dot(n,hv),0.0,1.0);
  float spec=pow(sd,5.5)*clamp(ndl*3.0,0.0,1.0)*0.3;
  float e=A.a*(1.0-uLimb*pow(rr,1.5));
  float ee=e*e*0.4627451;
  vec3 col=A.rgb*(lam+e*1.06)+vec3(ee+B.r*spec);
  if(uHasCloud>0.5&&B.g>0.004)
    col=mix(col,vec3(0.9803922,0.9882353,1.0)*(lam*1.06),B.g);
  col+=uAtm*rim*uAtmS;
  /* canvas 是 premultipliedAlpha，边缘必须预乘 */
  fragColor=vec4(clamp(col,0.0,1.0)*cov,cov);
}`;
export const GL_FS=FS_BODY.replace("__UNPACK__",UNPACK_LIVE);
export const GL_FS_BAKED=FS_BODY.replace("__UNPACK__",UNPACK_BAKED);
function glShader(type,src){
  const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);
  if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));
  return sh;
}
const glProg=gl.createProgram();
gl.attachShader(glProg,glShader(gl.VERTEX_SHADER,GL_VS));
gl.attachShader(glProg,glShader(gl.FRAGMENT_SHADER,GL_FS));
gl.linkProgram(glProg);
if(!gl.getProgramParameter(glProg,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(glProg));
const GLU={};
for(const nm of["uRot","uRR","uAmb","uLimb","uAtmS","uHasCloud","uAA","uTexWH","uLight","uAtm","uTexA","uTexB"])
  GLU[nm]=gl.getUniformLocation(glProg,nm);
const glTexA=gl.createTexture(),glTexB=gl.createTexture();
for(const t of[glTexA,glTexB]){
  gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
}
gl.uniform1i(GLU.uTexA,0);gl.uniform1i(GLU.uTexB,1);
let glBoundTex=null;
/* 纹理上传：alb+em 打包进一张 RGBA，spec+cld 打包进另一张，一次生成完整 mip 链 */
function uploadSphereTexture(tex){
  const n=tex.w*tex.h;
  const a=new Uint8Array(n*4),b=new Uint8Array(n*4);
  for(let i=0;i<n;i++){
    const i3=i*3,i4=i<<2;
    a[i4]=tex.alb[i3];a[i4+1]=tex.alb[i3+1];a[i4+2]=tex.alb[i3+2];a[i4+3]=tex.em[i];
    b[i4]=tex.spec[i];b[i4+1]=tex.cld[i];
  }
  for(const[t,data]of[[glTexA,a],[glTexB,b]]){
    gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,tex.w,tex.h,0,gl.RGBA,gl.UNSIGNED_BYTE,data);
    gl.generateMipmap(gl.TEXTURE_2D);
  }
  glBoundTex=tex;
}
export function renderSphere(P,phase,screenR){
  if(pcv.width!==RW){pcv.width=RW;pcv.height=RW;}
  if(glBoundTex!==P.tex)uploadSphereTexture(P.tex);
  gl.viewport(0,0,RW,RW);
  gl.clearColor(0,0,0,0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(glProg);
  gl.uniform1i(GLU.uTexA,0);gl.uniform1i(GLU.uTexB,1);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,glTexA);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,glTexB);
  const at=P.atmos.col,L=window.__LIGHT;
  gl.uniform1f(GLU.uRot,phase);
  gl.uniform1f(GLU.uRR,RR);
  /* 1 屏幕像素跨越几个内部像素：AA 过渡带按此展宽，抵消离屏降采样 */
  const sr=screenR>0?screenR:RR;
  gl.uniform1f(GLU.uAA,Math.min(3,Math.max(0.6,RR/sr)));
  gl.uniform1f(GLU.uAmb,P.ambient);
  gl.uniform1f(GLU.uLimb,P.limb);
  gl.uniform1f(GLU.uAtmS,P.atmos.str);
  gl.uniform1f(GLU.uHasCloud,P.hasCloud?1:0);
  gl.uniform2f(GLU.uTexWH,P.tex.w,P.tex.h);
  gl.uniform3f(GLU.uLight,L.x,L.y,L.z);
  gl.uniform3f(GLU.uAtm,at[0]/255,at[1]/255,at[2]/255);
  gl.drawArrays(gl.TRIANGLES,0,3);
}
export function setRenderRadius(r){ RR=r; rebuildRenderTargets(); }
