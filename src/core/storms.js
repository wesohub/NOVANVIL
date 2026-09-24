import { TAU, PI } from './math.js';
import { rnd } from './random.js';

/* ───────── 风暴（气态行星涡旋） ───────── */
export function makeStorms(rand,n,latRange){
  const st=[];
  const count=n;
  for(let i=0;i<count;i++){
    st.push({
      lon:rand()*TAU,
      lat:rnd(rand,-latRange,latRange),
      r:rnd(rand,0.12,0.42),
      swirl:rnd(rand,1.2,4.2)*(rand()<0.5?-1:1),
      big:rand()<0.34
    });
  }
  return st;
}
/* 对经纬度做漩涡扭曲，返回命中强度 */
export function applyStorms(storms,lon,lat,G){
  let hit=0,hid=0,olon=lon,olat=lat;
  for(let i=0;i<storms.length;i++){
    const s=storms[i];
    let dlon=olon-s.lon;
    while(dlon>PI)dlon-=TAU; while(dlon<-PI)dlon+=TAU;
    const dlat=olat-s.lat;
    const d2=dlon*dlon+dlat*dlat;
    if(d2<s.r*s.r){
      const d=Math.sqrt(d2)/s.r;
      const w=(1-d)*(1-d);
      const ang=w*s.swirl;
      const cs=Math.cos(ang),sn=Math.sin(ang);
      olon=s.lon+dlon*cs-dlat*sn;
      olat=s.lat+dlon*sn+dlat*cs;
      if(w>hit){hit=w;hid=i;}
    }
  }
  G.lon=olon;G.lat=olat;G.storm=hit;G.stormId=hid;
  return hit;
}
