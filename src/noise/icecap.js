import { fbm } from './perlin.js';
import { clamp, clamp01, smoothstep } from '../core/math.js';

/* ───────── 极地冰盖 ─────────
   真实冰盖 = 蜿蜒冰缘 + 海冰破碎 / 陆冰连续 + 冰面穹顶起伏
   ① 冰缘：纬度线被低频噪声推移，边缘呈锯齿 / 岬湾状，非均匀圆环
   ② 海冰：外缘碎成浮冰与水道，越靠极点越连片；陆冰连续且雪线更低
   ③ 冰面：低频起伏输出到 out[0]，供调用处做明暗（穹顶高光 / 冰纹）
   edge：冰盖起始纬度(|sin lat|)  warp：冰缘扰动幅度  pha：随机相位  isSea：该点是否海域
   返回 0-1 覆盖强度；非极区像素提前返回，不付噪声开销 */
export function iceCap(n,nx,ny,nz,latf,edge,warp,pha,isSea,out){
  if(latf<edge-warp-0.10){out[0]=0.5;return 0;}
  const wv=fbm(n,nx*1.5+pha,ny*0.9,nz*1.5,4);      // 大尺度冰缘扭曲
  const fv=fbm(n,nx*6.5+pha*2,ny*6.5+7,nz*6.5,3);  // 高频碎冰
  const e=edge-clamp(wv,-1,1)*warp;
  let t=smoothstep(e,e+0.10,latf);
  if(isSea){
    const frag=smoothstep(0.34,0.60,fv*0.5+0.5);   // 浮冰块
    const solid=smoothstep(e+0.12,e+0.32,latf);    // 近极点连片
    t*=frag+(1-frag)*solid;
  }
  out[0]=wv*0.5+0.5;
  return clamp01(t);
}
