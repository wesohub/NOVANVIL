/* ───────── 纹理分辨率 ───────── */
/* 随「星球分辨率」档位等比缩放（见 RES_STEPS / setResolution），默认 1024×512 */
export let TW=1024,TH=512;
export function setTextureSize(w,h){ TW=w; TH=h; }
