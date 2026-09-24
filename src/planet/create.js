import { chance, makeRng, rnd, rint } from '../core/random.js';
import { TAU } from '../core/math.js';
import { hsl2rgb } from '../core/palette.js';
import { makeNoise3D } from '../noise/perlin.js';
import { makeWorley3D } from '../noise/worley.js';
import { rotNoise, rotWorley } from '../noise/rotation.js';
import { TW } from '../texture/size.js';
import { buildTextureAsync } from '../texture/builder.js';
import { BIOMES, BIOME_KEYS } from '../biomes/index.js';
import { genName } from './naming.js';
import { genStats } from './stats.js';
/* ═══════════════════════════════════════════════════════════════
   星球合成主流程
   ═══════════════════════════════════════════════════════════════ */
/* 由种子唯一决定的全部生成期配置。
   逐行生成只需要 cfg + 行号，所以 worker 用同一个种子各调一次这里，
   就能拿到与主线程逐位相同的噪声表 / 调色板 / 地形闭包 →
   并行拆行不会改变任何一个像素。
   注意：调用前 TW/TH 必须已是目标分辨率（cosT/sinT 按 TW 长度建表）。 */
export function makeCfg(seedStr){
  const [tkey,subIdx]=parseSeed(seedStr);
  const rand=makeRng(seedStr);
  const bm=BIOMES[tkey]||BIOMES.terran;

  const cosT=new Float32Array(TW),sinT=new Float32Array(TW);
  for(let i=0;i<TW;i++){const a=(i+0.5)/TW*TAU;cosT[i]=Math.cos(a);sinT[i]=Math.sin(a);}

  /* 域旋转 / 分形参数走独立 rng：不打乱主 rand 序列，
     星球名、宜居指数、卫星等元数据不随之变化，只有纹理形状变 */
  const frand=makeRng(seedStr+"|rot");
  const cfg={
    noise:rotNoise(makeNoise3D(makeRng(seedStr+"|n")),frand),
    worley:rotWorley(makeWorley3D(makeRng(seedStr+"|w")),frand),
    _prand:makeRng(seedStr+"|pal"),
    _o:new Float32Array(6),_wo:new Float32Array(3),_ice:new Float32Array(1),
    _cosT:cosT,_sinT:sinT,
    _G:{nx:0,ny:0,nz:0,lat:0,lon:0,u:0,v:0,storm:0,stormId:0},
    subIndex:subIdx,
    traits:[]
  };
  bm.init(rand,cfg);
  /* rand 的游标要留给调用方（卫星 / 数值 / 命名继续消费同一条序列） */
  return {cfg,rand,bm};
}
export async function createPlanet(seedStr,onProg){
  const [tkey]=parseSeed(seedStr);
  const {cfg,rand,bm}=makeCfg(seedStr);

  // 卫星
  const moons=[];
  const nm=chance(rand,0.72)?rint(rand,1,bm===BIOMES.gas?7:3):0;
  for(let i=0;i<nm;i++){
    let sz=rnd(rand,2.2,6.5),giant=false;
    if(rand()<0.10){sz*=rnd(rand,1.9,2.7);giant=true;} /* 10% 偶发巨月 */
    moons.push({
      d:rnd(rand,1.35,2.6)+i*0.22,
      sp:rnd(rand,0.06,0.3)/(1+i*0.4),
      ph:rand()*TAU,
      sz:sz,
      col:hsl2rgb(rnd(rand,0,360),rnd(rand,6,32),rnd(rand,42,76)),
      tilt:rnd(rand,0.15,0.7)*(rand()<0.5?-1:1),
      giant:giant,
      style:0,   /* 卫星一律素面无纹理 */
      mt:rand()*TAU         /* 表面细节相位（坑位 / 条纹走向） */
    });
  }

  const tex=await buildTextureAsync(cfg,onProg,seedStr);

  const st=genStats(rand,bm,cfg.traits);
  st.moons=nm;

  const traits=cfg.traits.slice();
  if(nm===0)traits.push("无天然卫星");
  else if(nm>3)traits.push("复杂卫星系");
  if(st.rot>200)traits.push("潮汐锁定倾向");
  if(rand()<0.16)traits.push("逆行自转");
  if(st.grav>1.6)traits.push("高重力环境");
  else if(st.grav<0.4)traits.push("低重力环境");

  const nmz=genName(rand,bm);
  const traitSet=Array.from(new Set(traits));
  /* 自转方向由「逆行自转」词条决定，保证词条与实际观感一致：
     spinDir=-1 顺行 —— 画面上的地貌向右走（绝大多数天体）
     spinDir=+1 逆行 —— 地貌向左走 */
  const retro=traitSet.includes("逆行自转");

  return {
    seed:seedStr,type:tkey,biome:bm,
    sub:cfg.subName||"",subIndex:cfg.subIndex,
    tex:tex,atmos:cfg.atmos,ambient:cfg.ambient,limb:cfg.limb,
    hasCloud:cfg.hasCloud,cloudMul:cfg.cloudMul||1,
    moons:moons,
    name:nmz.name,epi:nmz.epi,
    stats:st,traits:traitSet,
    spinDir:retro?1:-1,
    cloudDir:rand()<0.5?1:-1
  };
}
/* 种子格式：类型[-亚型序号]-随机盐
   例：metal-2-k3f9xq  → 机械造物 · 电路板型
   旧格式 terran-k3f9xq 仍然可用（亚型随机） */
export function parseSeed(s){
  const parts=String(s).split("-");
  if(parts.length>=2&&BIOMES[parts[0]]){
    let sub=null,salt=parts.slice(1).join("-");
    if(parts.length>=3&&/^\d{1,2}$/.test(parts[1])){
      sub=+parts[1];salt=parts.slice(2).join("-");
    }
    return [parts[0],sub,salt];
  }
  return ["terran",null,String(s)];
}
export function newSeed(tkey,sub){
  if(!tkey){
    // 加权随机
    let tot=0;for(const k of BIOME_KEYS)tot+=BIOMES[k].weight;
    let r=Math.random()*tot;
    for(const k of BIOME_KEYS){r-=BIOMES[k].weight;if(r<=0){tkey=k;break;}}
  }
  const salt=Math.random().toString(36).slice(2,7)+Math.random().toString(36).slice(2,5);
  return tkey+(sub==null?"":"-"+sub)+"-"+salt;
}
