/* ───────── 3D Worley（细胞噪声）：陨石坑 / 晶面 / 米粒组织 ───────── */
export function makeWorley3D(rand){
  const mk=()=>{const a=new Uint8Array(256);for(let i=0;i<256;i++)a[i]=i;
    for(let i=255;i>0;i--){const j=Math.floor(rand()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;};
  const A=mk(),B=mk(),C=mk(),D=mk();
  return function(x,y,z,out){
    const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z);
    /* A 的三次查表与 dz/dy 无关，提到 27 次循环外：
       原来每格都重算 (xi+dx)&255 与一次掩码数组读，共 27 次 */
    const a0=A[(xi-1)&255],a1=A[xi&255],a2=A[(xi+1)&255];
    let f1=1e9,f2=1e9,id=0;
    for(let dz=-1;dz<=1;dz++){
      const cz=zi+dz,czk=C[cz&255];
      for(let dy=-1;dy<=1;dy++){
        const cy=yi+dy,cq=B[cy&255];
        for(let dx=-1;dx<=1;dx++){
          const cx=xi+dx;
          const ac=dx<0?a0:(dx>0?a2:a1);
          const h=(ac+cq+czk)&255;
          const px=cx+A[h]/255,py=cy+B[h]/255,pz=cz+C[h]/255;
          const ex=px-x,ey=py-y,ez=pz-z;
          const d=ex*ex+ey*ey+ez*ez;
          if(d<f1){f2=f1;f1=d;id=D[h]/255;}
          else if(d<f2){f2=d;}
        }
      }
    }
    out[0]=Math.sqrt(f1);out[1]=Math.sqrt(f2);out[2]=id;
  };
}
