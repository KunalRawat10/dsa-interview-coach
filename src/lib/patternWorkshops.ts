export type Journey = 'pointers' | 'window'
export type Move = 'left' | 'right' | 'grow' | 'shrink'
export function freshJourneyInput(kind: Journey, caseId: number): number[] | string {
  let seed = (caseId + 1) >>> 0
  const values = Array.from({length:4+caseId%5},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return 1+(seed%11)})
  return kind==='pointers' ? values : values.map(n=>String.fromCharCode(97+n%5)).join('')
}
export interface Frame { left: number; right: number; best: number; action: Move; note: string }
export const JOURNEYS = {
  pointers: { title: 'Container With Most Water', input: [1,8,6,2,5,4,8,3,7], idea: 'Area is width × the shorter boundary. Move the shorter boundary: keeping it while reducing width cannot improve the area.', cost: 'O(n) time · O(1) extra space', blocks: ['Place boundaries at both ends; best = 0', 'While left < right', 'Measure area and update best', 'Move the shorter boundary inward', 'Return best after the loop'] },
  window: { title: 'Longest Substring Without Repeating Characters', input: 'abba', idea: 'Keep a contiguous window with no repeated characters. If the incoming character is already inside, remove from the left until it is absent, then add it.', cost: 'Expected O(n) time · O(min(n, alphabet size)) extra space', blocks: ['Start left = 0, empty Set, best = 0', 'For each incoming character on the right', 'While incoming is present, remove left and advance left', 'Add incoming and update best with window length', 'Return best after the loop'] },
} as const
export function pointerRun(values: readonly number[], broken = false) {
  let left = 0, right = values.length - 1, best = 0
  const frames: Frame[] = []
  while (left < right) {
    const area = (right-left) * Math.min(values[left], values[right]); best = Math.max(best, area)
    const shorterLeft = values[left] <= values[right]
    const action: Move = (broken ? !shorterLeft : shorterLeft) ? 'left' : 'right'
    frames.push({left,right,best,action,note:`Width ${right-left} × min(${values[left]}, ${values[right]}) = ${area}; best ${best}.`})
    if (action === 'left') left++; else right--
  }
  return { frames, result: best }
}
export function windowRun(value: string, broken = false) {
  let left = 0, best = 0
  const seen = new Set<string>(), frames: Frame[] = []
  for (let right = 0; right < value.length; right++) {
    if (broken && seen.has(value[right])) { seen.delete(value[left++]) }
    else while (seen.has(value[right])) {
      frames.push({left,right,best,action:'shrink',note:`Incoming “${value[right]}” is still in “${value.slice(left,right)}”. Remove “${value[left]}” from the left first.`})
      seen.delete(value[left++])
    }
    seen.add(value[right]); best = Math.max(best,right-left+1)
    frames.push({left,right,best,action:'grow',note:`Add “${value[right]}”; window “${value.slice(left,right+1)}”, best length ${best}.`})
  }
  return {frames,result:best}
}
export function oracle(kind: Journey, input: readonly number[] | string) {
  let best = 0
  if (kind === 'pointers' && typeof input !== 'string') {
    for(let l=0;l<input.length;l++) for(let r=l+1;r<input.length;r++) best=Math.max(best,(r-l)*Math.min(input[l],input[r]))
  } else if (typeof input === 'string') {
    for(let l=0;l<input.length;l++) for(let r=l+1;r<=input.length;r++) {const part=input.slice(l,r); if(new Set(part).size===part.length) best=Math.max(best,part.length)}
  }
  return best
}
export function runJourney(kind: Journey, input: readonly number[] | string, broken = false) {
  return kind === 'pointers' ? pointerRun(input as readonly number[], broken) : windowRun(input as string, broken)
}
export function programChecks(kind: Journey, order: number[]) {
  const inputs = kind === 'pointers' ? [[1,8,6,2,5,4,8,3,7],[1,1],[4,3,2,1,4],[2,0,2],[],[3]] : ['abba','abcabcbb','bbbbb','pwwkew','','a']
  const valid = order.length === 5 && order.every((n,i)=>n===i)
  return inputs.map(input => ({input,expected:oracle(kind,input),result:valid ? runJourney(kind,input).result : null}))
}
export function requirementResult(mode: string, values: number[]) {
  if(mode==='membership') return new Set(values).size !== values.length
  if(mode==='frequency') { const counts = new Map<number,number>(); for(const n of values) counts.set(n,(counts.get(n)??0)+1); return [...counts.entries()] }
  if(mode==='position') {const first=new Map<number,number>(); for(let i=0;i<values.length;i++){if(first.has(values[i]))return [first.get(values[i]),i];first.set(values[i],i)}return []}
  const sorted=[...values].sort((a,b)=>a-b); return sorted.some((n,i)=>i>0&&n===sorted[i-1])
}
export const REQUIREMENTS = [
  {id:'membership', prompt:'Only tell me whether a number repeats, using fast membership checks.', answer:'set', why:'A Set stores presence. No count or position is needed.'},
  {id:'frequency', prompt:'Return how many times each number occurs.', answer:'counts', why:'Store number → count in a Map. Presence alone loses the frequency.'},
  {id:'position', prompt:'Return the zero-based positions of the first repeated pair encountered.', answer:'indices', why:'Store number → first position. A Set cannot recover that earlier position.'},
  {id:'memory', prompt:'Detect repeats without a separate seen collection. You may reorder the input. Choose the comparison-based approach.', answer:'sort', why:'Sort and compare neighbours: typically O(n log n) time. Extra space depends on the sorting implementation; do not assume JavaScript sort guarantees O(1). The demonstration copies input to preserve it.'},
] as const
export const TRANSFER = [
  {prompt:'A sorted list contains ticket prices. Find two prices that sum to a target; choose the inward-scanning approach that uses its sorted order.', answer:'pointers', why:'Compare the end values. A sum too small moves the left boundary; a sum too large moves the right boundary.'},
  {prompt:'Find the largest total in any consecutive block of exactly three daily sales. Choose the approach that reuses neighbouring block totals.', answer:'window', why:'Slide a fixed-size window: subtract the outgoing sale and add the incoming sale.'},
  {prompt:'Count every username in a stream of sign-ins.', answer:'counts', why:'A frequency Map stores a count per username; contiguity and sorted boundaries are not required.'},
] as const
