import { TW, TH } from './size.js';
import { TAU, PI } from '../core/math.js';

/* out: [r,g,b,emissive,specular,cloud]  0-255
   base = 目标缓冲区的起始行号。单线程传 0（整幅缓冲）；
   worker 只回传自己那一段，就传自己的 py0 → 相对寻址 */
export function buildRows(cfg,py0,py1,alb,em,spec,cld,base){
  const n=cfg.noise,w=cfg.worley,gen=cfg.gen;
  const o=cfg._o;
  const cosT=cfg._cosT,sinT=cfg._sinT;
  const off=base||0;
  for(let py=py0;py<py1;py++){
    const v=(py+0.5)/TH;
    const lat=(0.5-v)*PI;
    const ny=Math.sin(lat),rc=Math.cos(lat);
    let rowOff=(py-off)*TW;
    for(let px=0;px<TW;px++){
      const u=(px+0.5)/TW;
      const lon=u*TAU;
      const G=cfg._G;
      G.nx=cosT[px]*rc;G.ny=ny;G.nz=sinT[px]*rc;
      G.lat=lat;G.lon=lon;G.u=u;G.v=v;G.storm=0;G.stormId=0;
      gen(cfg,G,o);
      const i3=(rowOff+px)*3,i1=rowOff+px;
      // 钳制后再写入，避免 Uint8Array 溢出回绕产生亮斑噪点
      const r=o[0],g=o[1],b=o[2];
      alb[i3]=r<0?0:(r>255?255:r);
      alb[i3+1]=g<0?0:(g>255?255:g);
      alb[i3+2]=b<0?0:(b>255?255:b);
      // 同上：这两路没有 albedo 那样的钳制，超 255 会按 256 回绕出黑斑/逆色
      em[i1]=o[3]<0?0:(o[3]>255?255:o[3]);
      spec[i1]=o[4]<0?0:(o[4]>255?255:o[4]);
      // 云层降占比：1.5 次幂压缩，抬高可见阈值 → 覆盖面积略缩、整体微淡
      // （cv>255 时 sqrt 项从压缩转为放大，必须先钳制再写）
      const cv=o[5],cw=cv>0?cv*Math.sqrt(cv/255):0;
      cld[i1]=cw<0?0:(cw>255?255:cw);
    }
  }
}
/* ── 让出主线程 ──
   原来用嵌套 setTimeout(chunk,0)：浏览器对嵌套超过 5 层的定时器强制
   4ms 下限，32 个分块白等 ≈100ms。MessageChannel 的任务没有这个下限。 */
const yieldTask=(()=>{
  const ch=new MessageChannel();
  let q=null;
  ch.port1.onmessage=()=>{const f=q;q=null;if(f)f();};
  return f=>{q=f;ch.port2.postMessage(0);};
})();

/* ── 单线程：按时间预算分块，慢机器不会卡 UI、快机器不会空转 ── */
function buildSerial(cfg,alb,em,spec,cld,onProg){
  return new Promise(resolve=>{
    let py=0;
    function chunk(){
      const t0=performance.now();
      do{
        const e=Math.min(TH,py+16);
        buildRows(cfg,py,e,alb,em,spec,cld);
        py=e;
      }while(py<TH&&performance.now()-t0<12);
      if(onProg)onProg(py/TH);
      if(py<TH)yieldTask(chunk);
      else resolve();
    }
    chunk();
  });
}

/* ═══════════ 多核并行 ═══════════
   行与行之间没有任何依赖（cfg 里的 scratch 只在本行内复用），
   所以把 [0,TH) 切成 N 段交给 N 个 worker，各自用同一种子重建同源 cfg
   再逐行生成，拼回来与单线程是同一个 IEEE-754 运算序列 —— 逐位相同。
   任何一步不成立（Worker 不可用 / 模块加载失败 / 超时）就永久回退单线程。 */
let parallelOK=typeof Worker!=="undefined";
const POOL=[];

function ensurePool(n){
  while(POOL.length<n){
    let w;
    try{w=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});}
    catch(e){parallelOK=false;break;}
    POOL.push(w);
  }
  if(POOL.length<2)parallelOK=false;
  return POOL.length;
}
function closePool(){
  for(let i=0;i<POOL.length;i++)POOL[i].terminate();
  POOL.length=0;
}

function buildParallel(seed,alb,em,spec,cld,onProg){
  /* 主线程要留给渲染与 UI，最多用掉 8 个核，本机核数减一 */
  const hw=(typeof navigator!=="undefined"&&navigator.hardwareConcurrency)|0;
  const n=ensurePool(Math.max(2,Math.min(8,hw>1?hw-1:2)));
  if(!parallelOK||POOL.length<2||TH<POOL.length*2)return Promise.reject(new Error("worker 不可用"));

  const bands=[],per=Math.ceil(TH/POOL.length);
  for(let i=0;i<POOL.length;i++){
    const a=i*per,b=Math.min(TH,a+per);
    if(a<b)bands.push([a,b]);
  }
  return new Promise((resolve,reject)=>{
    let left=bands.length,settled=false;
    const prog=new Array(bands.length).fill(0),hands=[],errs=[];
    const timer=setTimeout(()=>fail(new Error("worker 超时")),30000);
    function fail(err){
      if(settled)return;
      settled=true;clearTimeout(timer);
      for(let i=0;i<bands.length;i++){
        POOL[i].removeEventListener("message",hands[i]);
        POOL[i].removeEventListener("error",errs[i]);
      }
      reject(err);
    }
    function done(){
      settled=true;clearTimeout(timer);
      for(let i=0;i<bands.length;i++){
        POOL[i].removeEventListener("message",hands[i]);
        POOL[i].removeEventListener("error",errs[i]);
      }
      resolve();
    }
    bands.forEach((band,i)=>{
      const w=POOL[i];
      const onMsg=e=>{
        const d=e.data;
        if(settled)return;
        if(d.cmd==="err"){fail(new Error(d.msg));return;}
        if(d.cmd==="p"){
          /* d.py 是绝对行号，必须减去本段起点才是「已完成行数」。
             直接求和等于把每段的起始偏移也加了一遍（8 段时虚报 450%） */
          prog[i]=d.py-band[0];let s=0;for(let k=0;k<prog.length;k++)s+=prog[k];
          if(onProg)onProg(s/TH);
          return;
        }
        /* 收齐该 worker 的整段，按行偏移 memcpy 回整幅缓冲 */
        alb.set(d.alb,d.py0*TW*3);
        em.set(d.em,d.py0*TW);
        spec.set(d.spec,d.py0*TW);
        cld.set(d.cld,d.py0*TW);
        if(--left===0)done();
      };
      const onErr=()=>fail(new Error("worker 异常"));
      hands.push(onMsg);errs.push(onErr);
      w.addEventListener("message",onMsg);
      w.addEventListener("error",onErr);
      w.postMessage({cmd:"run",seed,w:TW,h:TH,py0:band[0],py1:band[1]});
    });
  });
}

export async function buildTextureAsync(cfg,onProg,seed){
  const alb=new Uint8Array(TW*TH*3),em=new Uint8Array(TW*TH),
        spec=new Uint8Array(TW*TH),cld=new Uint8Array(TW*TH);
  if(parallelOK&&seed){
    try{
      await buildParallel(seed,alb,em,spec,cld,onProg);
      return {alb,em,spec,cld,w:TW,h:TH};
    }catch(err){
      /* 失败后清干净再走单线程，避免半幅数据混进去 */
      console.warn("[星球生成器] 并行合成不可用，回退单线程：",err);
      parallelOK=false;closePool();
      alb.fill(0);em.fill(0);spec.fill(0);cld.fill(0);
      if(onProg)onProg(0);
    }
  }
  await buildSerial(cfg,alb,em,spec,cld,onProg);
  return {alb,em,spec,cld,w:TW,h:TH};
}
