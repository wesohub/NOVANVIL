import { chance, pick, rint } from '../core/random.js';
/* ═══════════════════════════════════════════════════════════════
   命名系统：5 套命名法 × 中文称号
   ═══════════════════════════════════════════════════════════════ */
const ONSETS=["k","t","v","z","x","th","dr","zh","m","n","s","l","r","b","g","p","sh","ch","kr","tr","vr","sk","tz","qu","ny","ph","gl","br","gr","sl","sn","zw","ts","hv","yl","aer","or","il","em","un","kl","fl","pl","pr","fr","cr","bl","cl","dl","gn","kh","str","spr","thr","wr","vl","sm","tw","dw","kn","lyr","ael","osc","umb","ign","vor","xan","zeph","kor","vyl","thal","myr","nyx"];
const VOWELS=["a","e","i","o","u","ae","ai","au","ea","ia","oo","ua","ei","ou","y","ii","aa","eo","ya","uo","io","ao","eu","oe","aeo","iao","uaa","ye","yi","yo","ay","ey","oy","uya","aea","eia","oia"];
const CODAS=["","","","","n","r","s","l","th","x","z","k","m","ng","sh","rr","ll","st","sk","rn","lt","ph","ss","nd","d","f","g","h","rt","rm","rk","ns","ls","mn","ct","ft","pt","ld","rd","mb","mp","nk","xt","ph","ch","dz","ks","ls","vn","ln","rn","ths","rk","sh","yn","yl","or","ar","ir","ur","el","al","os","us","is","ax","ex","ix","ox","ux"];
const CATS=["Kepler","TRAPPIST","Gliese","HD","KOI","TOI","GJ","WASP","Proxima","LP","TYC","HR","PSR","NGTS","HATS","K2","WISE","HAT-P","CoRoT","OGLE","LHS","Ross","Wolf","Barnard","Luyten","Kapteyn","Tau","Eps","Lac","XO","Qatar","KELT","MASCARA","SPECULOOS","TESS","Gaia","2MASS","SDSS","HIP","BD","CD","CPD","ADS","WDS","NSV","PH"];
const PLACES=["Ashford","Meridian","Vastitas","Hesperus","Corvus","Ironvale","Terminus","Haven","Persephone","Calderon","Dustbowl","Veridian","Oakhurst","Tharsis","Erebus","Solace","Brimstone","Halcyon","Novara","Kestrel","Falkland","Greyspire","Aldrin","Vance","Morwyn","Talos","Ithaca","Zephyr","Cindra","Norhaven","Emberfall","Quillon","Sablewood","Drakemoor","Lorwick","Veyra","Ostara","Nimbus","Carrow","Thessaly","Umbra","Valdore","Wynster","Aurelia","Blackreach","Cordelia","Duncairn","Elmsworth","Farrow","Grimhold","Hollowmere","Isvara","Jarnvik","Kilgrove","Lament","Myrefall","Nocturne","Orwald","Penumbras","Quorin","Ravenscar","Silverpine","Thornvale","Umberlight","Vantablack","Wraithmoor","Yarborough","Zephyria","Ashvale","Brightwater","Coldspring","Duskharbor","Eastmarch","Frostmere","Goldcrest","Highmourn","Ironquay","Jessamine","Kingsreach","Lowtide","Moonwrit","Northgate","Oldharbor","Palecliff","Quietfield","Redoubt","Stonehearth","Tidewatch","Underbough","Vespertine","Westlock","Yewshade"];
const SUFFIX=["dor","ris","wyn","ara","ion","eth","ael","mir","thys","orra","und","yss","eon","alis","mor","vex","ax","ia","or","ys","une","ir","oth","arn","esh","ul","ant","ess","iad","orn","uve","yka","oz","ael","irn","ova","elia","urth","ynd","ossa","axa","emis","oryn","uvae","ynth","aria","eld","isq","orm","ynth","aelis","ovar","ydra","elth"];
const ADJ=["灰烬","猩红","翡翠","静默","咆哮","破碎","永恒","被遗忘的","霜寒","熔火","幽蓝","黄金","虚空","苍白","暮光","铁锈","珍珠","剧毒","辉光","沉睡","狂乱","蔚蓝","暗金","结晶","无光","赤铜","苍翠","幽冥","虹彩","孤寂","燃烧","冰封","低语","高歌","流浪","锚定","腐朽","新生","暴虐","温驯","缄默","轰鸣","褪色","溢彩","凝滞","奔涌","倒悬","深潜","远望","近岸","无风","雷鸣","雾锁","盐蚀","苔覆","藤缠","骨白","血砂","墨黑","银灰","紫晶","琥珀","雾银","风暴","潮汐","日冕","星尘","月影","寒武","荒纪","元初","终焉","复归","离散","聚合","湮灭","烛照","塔尖","环带","散逸"];
const NOUN=["守望者","深渊","摇篮","穹顶","回响","王座","荒原","之眼","熔炉","迷宫","边境","挽歌","圣所","裂隙","冠冕","低语","幻梦","残响","方舟","终末","花园","坟墓","灯塔","子宫","剧场","锚点","尘埃","风暴","漩涡","碑文","钟摆","锁链","帷幕","尘埃","火种","冰窖","镜面","航标","巢穴","根须","脉络","脉动","休眠","苏醒","漂流","坠亡","升格","沉降","屏障","裂痕","缝隙","咽喉","脊梁","骸骨","茧房","孵化","远征","折返","静默","轰鸣","余烬","初雪","末雨","长夜","永昼","群星","独月","双日","潮汐","季风","信标","回路","接口","原型","残章","全典","索引","注脚","附录","扉页"];
const ROMAN=["Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ","Ⅵ","Ⅶ","Ⅷ","Ⅸ","Ⅹ","Ⅺ","Ⅻ","ⅩⅢ","ⅩⅣ","ⅩⅤ","ⅩⅥ","ⅩⅦ","ⅩⅧ","ⅩⅨ","ⅩⅩ"];
/* Chinese ordinal suffixes, appearing randomly alongside traditional names */
const CNUM=["之一","之二","之三","之四","之五","初篇","续篇","终篇","上卷","下卷","壹","贰","叁","肆","伍","甲","乙","丙","丁","新","旧","前","后"];

export function syl(rand){
  return pick(rand,ONSETS)+pick(rand,VOWELS)+pick(rand,CODAS);
}
export function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}

export function makeNameOnce(rand,biome){
  const style=pick(rand,["mythic","mythic","alien","catalog","colonial","fantasy"]);
  let name="";
  if(style==="mythic"){
    const n=rint(rand,2,3);for(let i=0;i<n;i++)name+=syl(rand);
    name=cap(name);
    if(chance(rand,0.45))name+=" "+pick(rand,ROMAN);
  }else if(style==="alien"){
    const a=cap(syl(rand)),b=syl(rand);
    name=a+(chance(rand,0.55)?"'":"")+(chance(rand,0.5)?cap(b):b);
    if(chance(rand,0.22))name+=" "+cap(syl(rand));
  }else if(style==="catalog"){
    const c=pick(rand,CATS);
    const num=chance(rand,0.3)?(rint(rand,100,9999)+"."+rint(rand,1,99)):rint(rand,100,9999);
    name=c+(chance(rand,0.5)?" ":"-")+num;
    name+=" "+String.fromCharCode(98+rint(rand,0,6));
  }else if(style==="colonial"){
    const p=pick(rand,PLACES);
    name=pick(rand,["New "+p,"Port "+p,p+" Reach",p+" Station","Fort "+p,p+" Landing","New "+p+" Colony"]);
  }else{
    const n=rint(rand,2,3);for(let i=0;i<n;i++)name+=syl(rand);
    name=cap(name)+pick(rand,SUFFIX);
    if(chance(rand,0.28))name="The "+name;
  }
  const epi="「"+pick(rand,ADJ)+pick(rand,NOUN)+(chance(rand,0.35)?"·"+pick(rand,CNUM):"")+"」";
  return {name:name,epi:epi,style:style};
}
/* 过滤过长 / 拗口的组合 */
export function genName(rand,biome){
  let best=null;
  for(let k=0;k<5;k++){
    const r=makeNameOnce(rand,biome);
    if(!best||r.name.length<best.name.length)best=r;
    if(r.name.length<=12&&!/sss|nnn|rrr|lll|ttt|(.)\1\1/i.test(r.name))return r;
  }
  return best;
}
