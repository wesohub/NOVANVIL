/* ───────── 3D Perlin 噪声（球面采样无缝） ───────── */
export function makeNoise3D(rand){
  const perm=new Uint8Array(256);
  for(let i=0;i<256;i++)perm[i]=i;
  for(let i=255;i>0;i--){const j=Math.floor(rand()*(i+1));const t=perm[i];perm[i]=perm[j];perm[j]=t;}
  const p=new Uint8Array(512);
  for(let i=0;i<512;i++)p[i]=perm[i&255];
  const fade=t=>t*t*t*(t*(t*6-15)+10);
  const L=(t,a,b)=>a+(b-a)*t;
  function grad(h,x,y,z){
    switch(h&15){
      case 0:return x+y;case 1:return -x+y;case 2:return x-y;case 3:return -x-y;
      case 4:return x+z;case 5:return -x+z;case 6:return x-z;case 7:return -x-z;
      case 8:return y+z;case 9:return -y+z;case 10:return y-z;case 11:return -y-z;
      case 12:return x+y;case 13:return -y+z;case 14:return x-y;default:return -y-z;
    }
  }
  return function(x,y,z){
    /* floor 只算一次：原来 x/y/z 各调两次 Math.floor（取格 + 取小数部分），
       这是整个生成器最热的函数，省下的 3 次调用逐位等价 */
    const gx=Math.floor(x),gy=Math.floor(y),gz=Math.floor(z);
    const X=gx&255,Y=gy&255,Z=gz&255;
    const fx=x-gx,fy=y-gy,fz=z-gz;
    const u=fade(fx),v=fade(fy),w=fade(fz);
    const A=p[X]+Y,AA=p[A]+Z,AB=p[A+1]+Z;
    const B=p[X+1]+Y,BA=p[B]+Z,BB=p[B+1]+Z;
    return L(w,
      L(v,L(u,grad(p[AA],fx,fy,fz),grad(p[BA],fx-1,fy,fz)),
              L(u,grad(p[AB],fx,fy-1,fz),grad(p[BB],fx-1,fy-1,fz))),
      L(v,L(u,grad(p[AA+1],fx,fy,fz-1),grad(p[BA+1],fx-1,fy,fz-1)),
              L(u,grad(p[AB+1],fx,fy-1,fz-1),grad(p[BB+1],fx-1,fy-1,fz-1))));
  };
}

/* 分形叠加（lac/gain/oct 的缺省值由噪声函数自带的随机谱决定） */
export function fbm(n,x,y,z,oct,lac,gain){
  oct=(oct||5)+(n.octBias||0);oct=oct<2?2:(oct>9?9:oct);
  lac=lac||n.lac||2.0;gain=gain===undefined?(n.gain===undefined?0.5:n.gain):gain;
  let a=1,f=1,s=0,nm=0;
  for(let i=0;i<oct;i++){s+=a*n(x*f,y*f,z*f);nm+=a;a*=gain;f*=lac;}
  // tanh 软限幅：输出严格落在 (-1,1)，于是 *0.5+0.5 与「权重和=1」的加权和
  // 都不再越界 → 幅度上调时表现为层次压缩，而不是被 ramp 截成整片端点色。
  // 典型幅值（|v|≤0.5）变化 <8%，只有极值区被压。
  return Math.tanh(s/nm*1.75);
}
/* 脊状噪声：山脉 / 裂缝 / 能量流 */
export function ridged(n,x,y,z,oct,lac,gain){
  oct=(oct||5)+(n.octBias||0);oct=oct<2?2:(oct>9?9:oct);
  lac=lac||n.lac||2.0;gain=gain===undefined?(n.gain===undefined?0.5:n.gain):gain;
  let a=1,f=1,s=0,nm=0;
  for(let i=0;i<oct;i++){
    const v=1-Math.abs(n(x*f,y*f,z*f));
    s+=a*v*v;nm+=a;a*=gain;f*=lac;
  }
  return s/nm;
}
/* 湍流：域扭曲后的 fbm，用于气态条带 */
export function turb(n,x,y,z,oct){
  const q=fbm(n,x+11.3,y+4.7,z+2.1,3);
  const w=fbm(n,x*1.7+q,y*1.7+q*0.6,z*1.7,3);
  return fbm(n,x+w*0.9,y+w*0.9,z+w*0.9,oct||4);
}
