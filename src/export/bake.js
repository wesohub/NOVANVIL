/* ═══════════════════════════════════════════════════════════════
   烘焙：把当前星的贴图烘成两张不透明 PNG，并收集导出页所需参数
   导出页不再需要噪声 / 生物群系 / worker —— 生成结果全在这两张图里
   ═══════════════════════════════════════════════════════════════ */
import { CUR, phase, cloudPhase, zoom, rotSpeed } from '../runtime.js';
import { OX } from '../render/layout.js';
import { lightAng, elev } from '../render/light.js';

/* 6 个通道正好铺满两张不透明图：albedo RGB | em,spec,cloud
   （不能用 alpha 承载数据：canvas 是预乘存储，alpha=0 的像素 RGB 会被抹平） */
export function packTextures(tex,mime,q){
  const n=tex.w*tex.h;
  const ca=document.createElement("canvas"),cb=document.createElement("canvas");
  ca.width=cb.width=tex.w;ca.height=cb.height=tex.h;
  const xa=ca.getContext("2d"),xb=cb.getContext("2d");
  const ia=xa.createImageData(tex.w,tex.h),ib=xb.createImageData(tex.w,tex.h);
  const da=ia.data,db=ib.data;
  for(let i=0;i<n;i++){
    const i3=i*3,i4=i<<2;
    da[i4]=tex.alb[i3];da[i4+1]=tex.alb[i3+1];da[i4+2]=tex.alb[i3+2];da[i4+3]=255;
    db[i4]=tex.em[i];db[i4+1]=tex.spec[i];db[i4+2]=tex.cld[i];db[i4+3]=255;
  }
  xa.putImageData(ia,0,0);xb.putImageData(ib,0,0);
  const opt=mime==="image/webp"?[mime,q]:[mime];
  return {a:ca.toDataURL.apply(ca,opt),b:cb.toDataURL.apply(cb,opt),w:tex.w,h:tex.h};
}
/* 浏览器不支持 webp 编码时静默退回 PNG（面板据此隐藏该选项） */
export function webpOK(){
  try{return document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp")===0;}
  catch(e){return false;}
}
/* 打开导出页时的初始状态 = 导出瞬间的预览，所见即所得 */
export function collectParams(texWH){
  const P=CUR;
  return {
    name:P.name,seed:P.seed,en:P.biome.en,cn:P.biome.name,
    atmos:{col:P.atmos.col,str:P.atmos.str},
    ambient:P.ambient,limb:P.limb,hasCloud:P.hasCloud,cloudMul:P.cloudMul,
    spinDir:P.spinDir,cloudDir:P.cloudDir,rotSpeed:rotSpeed,
    phase:phase,cloudPhase:cloudPhase,
    lightAng:lightAng,elev:elev,zoom:zoom,ox:OX,
    texW:texWH.w,texH:texWH.h,
    moons:P.moons
  };
}
