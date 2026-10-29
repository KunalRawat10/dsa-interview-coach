export interface WindowInput { s:string; t:string }
export interface MinimumFrame {
  left:number; right:number; action:'grow'|'shrink'; character:string
  before:string; after:string; counts:Record<string,number>; validBefore:boolean; validAfter:boolean; best:string
}
export const countLetters=(s:string)=>{const counts:Record<string,number>={};for(const c of s)counts[c]=(counts[c]??0)+1;return counts}
export const covers=(counts:Record<string,number>,need:Record<string,number>)=>Object.entries(need).every(([c,n])=>(counts[c]??0)>=n)
// Teaching traces use small uppercase inputs. The scan itself advances each boundary at most n times.
export function minimumWindow({s,t}:WindowInput, ignoreMultiplicity=false, trace=true) {
  const need=countLetters(t), counts:Record<string,number>={}, frames:MinimumFrame[]=[]
  if(!t.length)return {result:'',frames}
  if(ignoreMultiplicity)for(const c of Object.keys(need))need[c]=1
  let left=0,right=0,formed=0,bestStart=0,bestLength=Infinity
  const required=Object.keys(need).length
  while(right<s.length||formed===required){
    const validBefore=formed===required, action=validBefore?'shrink':'grow'
    const oldLeft=left,oldRight=right,character=action==='grow'?s[right]:s[left]
    if(action==='grow'){
      counts[character]=(counts[character]??0)+1;right++
      if(counts[character]===need[character])formed++
    }else{
      if(counts[character]===need[character])formed--
      counts[character]--;if(counts[character]===0)delete counts[character];left++
    }
    const validAfter=formed===required
    if(validAfter&&right-left<bestLength){bestStart=left;bestLength=right-left}
    if(trace)frames.push({left:oldLeft,right:oldRight,action,character,before:s.slice(oldLeft,oldRight),after:s.slice(left,right),counts:{...counts},validBefore,validAfter,best:bestLength===Infinity?'':s.slice(bestStart,bestStart+bestLength)})
  }
  return {result:bestLength===Infinity?'':s.slice(bestStart,bestStart+bestLength),frames}
}
export function minimumOracle({s,t}:WindowInput){
  if(!t)return ''
  const need=countLetters(t);let best=''
  for(let l=0;l<s.length;l++)for(let r=l+1;r<=s.length;r++){const candidate=s.slice(l,r);if(covers(countLetters(candidate),need)&&(!best||candidate.length<best.length))best=candidate}
  return best
}
export const MINIMUM_CASES:WindowInput[]=[{s:'CABBA',t:'AAB'},{s:'ADOBECODEBANC',t:'ABC'},{s:'HELLO',t:'XYZ'},{s:'AA',t:'AA'},{s:'ABBA',t:'AB'},{s:'',t:'A'}]
export const MINIMUM_BLOCKS=['Build required counts; empty current counts, left = 0, best = none','For each right position, add its character and update counts','While all required counts are satisfied','Record a shorter valid window, then remove left and advance it','Return the best window, or empty if none exists']
export function checkMinimumPlan(order:number[]){const valid=order.length===5&&order.every((n,i)=>n===i);return MINIMUM_CASES.map(input=>({input,expected:minimumOracle(input),result:valid?minimumWindow(input,false,false).result:null}))}
export function freshMinimumCase(id:number):WindowInput {
  const base=[{s:'CABAAC',t:'AAC'},{s:'BACAB',t:'AAB'},{s:'ABC',t:'AABC'},{s:'BAACBA',t:'AAB'},{s:'CCABAC',t:'AC'},{s:'AAAA',t:'AA'}][id%6]
  const shift=Math.floor(id/6)%23
  const encode=(s:string)=>[...s].map(c=>String.fromCharCode(c.charCodeAt(0)+shift)).join('')
  return {s:encode(base.s),t:encode(base.t)}
}
