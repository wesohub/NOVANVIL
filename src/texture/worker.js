/* ═══════════════════════════════════════════════════════════════
   纹理行生成 worker
   ───────────────────────────────────────────────────────────────
   只做一件事：按 [py0,py1) 生成一个横向条带并回传。

   关键点是「同源重建」——worker 不接收主线程的 cfg（噪声表 / 调色板 /
   闭包都没法结构化克隆），而是用同一个种子 setTextureSize 后自己调
   makeCfg()。噪音置换表、色相偏移、风暴位置全部走确定性 PRNG，
   与主线程逐位相同，因此拆行不改变任何一个像素。
   ═══════════════════════════════════════════════════════════════ */
import { TW, TH, setTextureSize } from './size.js';
import { makeCfg } from '../planet/create.js';
import { buildRows } from './builder.js';

let cfg=null,key="";
/* 每帧回传进度，让主线程的百分比是连续走的而不是最后一下跳到 100 */
const PINGS=8;

self.onmessage=function(e){
  const d=e.data;
  try{
    const k=d.seed+"|"+d.w+"x"+d.h;
    if(k!==key){
      setTextureSize(d.w,d.h);
      cfg=makeCfg(d.seed).cfg;
      key=k;
    }
    const py0=d.py0,py1=Math.min(d.py1,TH),n=py1-py0;
    const alb=new Uint8Array(n*TW*3),em=new Uint8Array(n*TW),
          spec=new Uint8Array(n*TW),cld=new Uint8Array(n*TW);
    const step=Math.max(1,Math.ceil(n/PINGS));
    for(let p=py0;p<py1;p+=step){
      const q=Math.min(py1,p+step);
      /* base=py0 → 相对本段寻址，与单线程写整幅缓冲的算式完全一致 */
      buildRows(cfg,p,q,alb,em,spec,cld,py0);
      self.postMessage({cmd:"p",py:q});
    }
    self.postMessage({cmd:"ok",py0,py1,alb,em,spec,cld},
                     [alb.buffer,em.buffer,spec.buffer,cld.buffer]);
  }catch(err){
    self.postMessage({cmd:"err",msg:String((err&&err.message)||err)});
  }
};
