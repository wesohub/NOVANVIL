import { TAU } from '../core/math.js';

/* ───────── 随机域旋转 ─────────
   同一套噪声的统计形态是固定的，光靠平移常量（+cf / +31 / +70 …）换不出
   真正不同的地形走向。给每颗星球一个随机正交矩阵，先把采样坐标旋转再喂给
   噪声 → 大陆走向、山脉方位、细胞排布全变，代价 9 次乘加。
   顺带把分形参数挂在噪声函数上（lacunarity / gain / 倍频偏移），
   fbm / ridged 未显式传参时回落到这组值 → 每颗星球的粗糙度谱也不同 */
export function randRot(rand){
  const a=rand()*TAU,b=Math.acos(rand()*2-1),g=rand()*TAU;
  const sa=Math.sin(a),ca=Math.cos(a),sb=Math.sin(b),cb=Math.cos(b),sg=Math.sin(g),cg=Math.cos(g);
  return [cg*ca-sg*cb*sa, -cg*sa-sg*cb*ca, sg*sb,
          sg*ca+cg*cb*sa, -sg*sa+cg*cb*ca, -cg*sb,
          sb*sa, sb*ca, cb];
}
export function rotNoise(fn,rand){
  const m=randRot(rand);
  /* 每种子地形疏密：各轴独立频率缩放 0.78-1.28 —— 同亚型不同种子的
     地貌骨架（大陆块数、岛链间距、沙丘密度）被整体拉伸/压缩，y 轴
     独立缩放使经向/纬向特征密度可以不对称 */
  const kx=0.78+rand()*0.50,ky=0.78+rand()*0.50,kz=0.78+rand()*0.50;
  const o=function(x,y,z){
    return fn(m[0]*x*kx+m[1]*y*ky+m[2]*z*kz,
              m[3]*x*kx+m[4]*y*ky+m[5]*z*kz,
              m[6]*x*kx+m[7]*y*ky+m[8]*z*kz);
  };
  o.lac=1.70+rand()*0.70;
  o.gain=0.42+rand()*0.20;
  const ob=rand();
  o.octBias=ob<0.34?-1:(ob<0.67?0:1);
  return o;
}
export function rotWorley(fn,rand){
  const m=randRot(rand);
  /* 与 rotNoise 同理：Worley 细胞（海峡网 / 陨击坑阵列 / 龟裂）也随
     种子做各轴独立缩放，细胞密度每颗星球不同 */
  const kx=0.78+rand()*0.50,ky=0.78+rand()*0.50,kz=0.78+rand()*0.50;
  return function(x,y,z,out){
    return fn(m[0]*x*kx+m[1]*y*ky+m[2]*z*kz,
              m[3]*x*kx+m[4]*y*ky+m[5]*z*kz,
              m[6]*x*kx+m[7]*y*ky+m[8]*z*kz, out);
  };
}
