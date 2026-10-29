import test from 'node:test'
import assert from 'node:assert/strict'
import { minimumWindow, minimumOracle, countLetters, covers, checkMinimumPlan, freshMinimumCase } from '../src/lib/minimumWindow.ts'

test('minimum windows handle multiplicity, impossible inputs, ties and empty input',()=>{
 for(const [s,t,expected] of [['CABBA','AAB','ABBA'],['ADOBECODEBANC','ABC','BANC'],['HELLO','XYZ',''],['AA','AA','AA'],['ABBA','AB','AB'],['','A',''],['ABC','',''],['A','AA','']])assert.equal(minimumWindow({s,t}).result,expected)
 assert.equal(minimumWindow({s:'CABBA',t:'AAB'},true).result,'AB')
})
test('generated minimum windows agree with an exhaustive independent reference',()=>{
 let seed=7
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed}
 for(let id=0;id<1200;id++){
  const s=Array.from({length:next()%10},()=> 'ABC'[next()%3]).join(''),t=Array.from({length:1+next()%4},()=> 'ABC'[next()%3]).join('')
  const input={s,t},run=minimumWindow(input),need=countLetters(t)
  assert.equal(run.result,minimumOracle(input),JSON.stringify(input))
  assert.ok(run.frames.length<=2*s.length)
  for(const frame of run.frames){assert.equal(frame.validBefore,covers(countLetters(frame.before),need));assert.equal(frame.validAfter,covers(frame.counts,need));assert.equal(frame.action,frame.validBefore?'shrink':'grow');assert.deepEqual(frame.counts,countLetters(frame.after))}
 }
})
test('large-input scan runs without retaining teaching snapshots',()=>{
 const s='AB'.repeat(50000);const run=minimumWindow({s,t:'AAA'},false,false);assert.equal(run.result,'ABABA');assert.equal(run.frames.length,0)
})
test('only the scoped plan order passes all reference cases',()=>{
 const permutations=a=>a.length?a.flatMap((x,i)=>permutations(a.filter((_,j)=>j!==i)).map(t=>[x,...t])):[[]]
 let passes=0;for(const order of permutations([0,1,2,3,4]))if(checkMinimumPlan(order).every(t=>t.result===t.expected))passes++
 assert.equal(passes,1);assert.ok(checkMinimumPlan([0,1,2,3,4,4]).every(t=>t.result===null))
})
test('fresh cases include repeated requirements and no-answer cases',()=>{
 let impossible=0,repeated=0;const seen=new Set()
 for(let id=0;id<100;id++){const input=freshMinimumCase(id);seen.add(JSON.stringify(input));const expected=minimumOracle(input);assert.equal(minimumWindow(input).result,expected);if(!expected)impossible++;if(Object.values(countLetters(input.t)).some(n=>n>1))repeated++}
 assert.equal(seen.size,100);assert.ok(impossible>0&&repeated>0)
})
