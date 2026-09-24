/* =====================================================================
   星辰熔炉 —— 程序化 2D 星球生成引擎
   流程：球面 3D 噪声 → 等距柱状纹理(1024×512) → 正交投影反解经纬度
        → 经度加旋转相位采样（纹理在圆内横向流动＝自转错觉）
        → WebGL2 片元着色器逐像素光照(与旋转无关，瞬时叠加) → 大气辉光 / 星空合成
   ===================================================================== */
import { initUI } from './ui/init.js';
import { applyCanvasSize } from './render/canvas.js';
import { frame } from './render/loop.js';
import { generate } from './ui/generate.js';
import { newSeed } from './planet/create.js';

/* 启动 */
initUI();
applyCanvasSize();
requestAnimationFrame(frame);
generate(newSeed());
