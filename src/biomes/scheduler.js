import { chance, rnd } from '../core/random.js';
import { hsl2rgb, Pal } from '../core/palette.js';

/* ═══════════════════════════════════════════════════════════════
   形态细分调度器
   每个大类 = 若干「亚型 SUB」；亚型之间的差异体现在
   ① 噪声配方（fbm / ridged / worley / 条带 的搭配与频率）
   ② 结构骨架（板块 / 网格 / 环带 / 细胞 / 裂隙 …）
   ③ 调色板与色相区间
   因此同大类反复重掷也会得到形态明显不同的星体。
   ═══════════════════════════════════════════════════════════════ */
export function pickSub(rand,subs){
  let tot=0;for(let i=0;i<subs.length;i++)tot+=(subs[i].w||1);
  let r=rand()*tot;
  for(let i=0;i<subs.length;i++){r-=(subs[i].w||1);if(r<=0)return i;}
  return subs.length-1;
}
export function initSub(bm,rand,cfg,idx){
  const subs=bm.subs;
  if(idx==null||!(idx>=0)||idx>=subs.length)idx=pickSub(rand,subs);
  const sv=subs[idx];
  cfg.subIndex=idx;cfg.subName=sv.name;cfg.sub=sv;
  /* 配色走独立 rng（不占用主 rand），并在三个维度同时随机：
     色相区间整体放大 1.0-1.6 倍 / 饱和度 ± / 明度 ±。
     明度经 Pal() 的色域约束封顶，不会把亮色推成纯白 */
  const pr=cfg._prand||rand;
  const hs=(sv.hs===undefined?14:sv.hs)*(1+pr()*0.6);
  const hShift=rnd(pr,-hs,hs);
  /* 双段偏移（30%）：色卡前半 / 后半做相反方向色相偏移 → 部分种子出
     异星配色；保留 35% 残余公共偏移保证整盘色相仍随种子移动 */
  let pal=sv.pal,pShift=hShift;
  if(pr()<0.30){
    const half=Math.ceil(sv.pal.length/2);
    pal=sv.pal.map((c,i)=>[c[0]+(i<half?0.55:-0.45)*hShift,c[1],c[2]]);
    pShift=hShift*0.35;
  }
  /* 饱和度极化：14% 荧光高饱和 / 25% 灰调低饱和（Pal 内 clamp01 兜底） */
  let satK=(1+rnd(pr,-0.18,0.22))*(sv.sat||1);
  const pol=pr();
  if(pol<0.14)satK*=1.45;else if(pol<0.25)satK*=0.55;
  const p=Pal(pal,pShift,satK,
              (1+rnd(pr,-0.12,0.12))*(sv.lum||1));
  const ak=(sv.atk===undefined?0.5:sv.atk);
  /* 大气：色相偏移带 30% 反向概率 → 与地表形成冷暖对比；
     饱和度 / 亮度小幅扰动，亮度封顶 94 防退化纯白 */
  const aFlip=pr()<0.3?-1:1;
  let asat=sv.at[1]*(1+rnd(pr,-0.15,0.15));
  let alum=sv.at[2]*(1+rnd(pr,-0.10,0.10));
  if(asat<0)asat=0;else if(asat>100)asat=100;
  if(alum<0)alum=0;else if(alum>94)alum=94;
  cfg.atmos={col:hsl2rgb(sv.at[0]+hShift*ak*aFlip,asat,alum),
             str:rnd(pr,sv.ats[0],sv.ats[1])};
  cfg.ambient=(sv.amb===undefined?0.1:sv.amb);
  cfg.limb=(sv.limb===undefined?0.2:sv.limb);
  cfg.hasCloud=sv.cloudP?chance(rand,sv.cloudP*0.75):false;
  cfg.cloudMul=sv.cloudMul||1;
  cfg.traits.push(sv.name);
  if(sv.traits)for(let i=0;i<sv.traits.length;i++)cfg.traits.push(sv.traits[i]);
  cfg.gen=sv.build(rand,cfg,p);
}
