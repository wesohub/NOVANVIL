/* ───────── 伪随机 ───────── */
export function xmur3(str){
  let h=1779033703^str.length;
  for(let i=0;i<str.length;i++){
    h=Math.imul(h^str.charCodeAt(i),3432918353);
    h=h<<13|h>>>19;
  }
  return function(){
    h=Math.imul(h^h>>>16,2246822507);
    h=Math.imul(h^h>>>13,3266489909);
    return (h^=h>>>16)>>>0;
  };
}
export function mulberry32(a){
  return function(){
    a|=0;a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296;
  };
}
export function makeRng(seedStr){
  const s=xmur3(String(seedStr));
  return mulberry32(s());
}
export const rnd=(r,a,b)=>a+r()*(b-a);
export const rint=(r,a,b)=>Math.floor(a+r()*(b-a+1));
export const pick=(r,arr)=>arr[Math.floor(r()*arr.length)];
export const chance=(r,p)=>r()<p;
export function pickMany(r,arr,n){
  const c=arr.slice(),o=[];
  while(o.length<n&&c.length)o.push(c.splice(Math.floor(r()*c.length),1)[0]);
  return o;
}
