/* ═══════════════════════════════════════════════════════════════
   星球形态库：每种形态 = 配色方案 + 噪声配方 + 特征开关
   每一个大类各自一个模块，这里按原顺序装配
   ═══════════════════════════════════════════════════════════════ */
import { terran } from './terran.js';
import { ocean } from './ocean.js';
import { desert } from './desert.js';
import { ice } from './ice.js';
import { rocky } from './rocky.js';
import { lava } from './lava.js';
import { carbon } from './carbon.js';
import { toxic } from './toxic.js';
import { gas } from './gas.js';
import { icegiant } from './icegiant.js';
import { metal } from './metal.js';
import { organic } from './organic.js';
import { plasma } from './plasma.js';
import { star } from './star.js';

export const BIOMES={
  terran,
  ocean,
  desert,
  ice,
  rocky,
  lava,
  carbon,
  toxic,
  gas,
  icegiant,
  metal,
  organic,
  plasma,
  star
};
export const BIOME_KEYS=Object.keys(BIOMES);
