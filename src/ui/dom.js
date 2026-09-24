/* ═══════════════════════════════════════════════════════════════
   UI
   ═══════════════════════════════════════════════════════════════ */
export const $=id=>document.getElementById(id);
export const loader=$("loader"),loadtxt=$("loadtxt");
export function toast(msg){
  const t=$("toast");t.textContent=msg;t.classList.add("on");
  clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("on"),1900);
}
export function fmt(n){
  if(n>=1e6)return (n/1e6).toFixed(2)+" 万";
  return n.toLocaleString("zh-CN");
}
