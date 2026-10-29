import test from 'node:test'
import assert from 'node:assert/strict'
import { pointerRun, windowRun, oracle, programChecks, requirementResult, freshJourneyInput, runJourney } from '../src/lib/patternWorkshops.ts'

test('fresh application cases vary and agree with independent references',()=>{
 for(const kind of ['pointers','window']){const seen=new Set();for(let id=0;id<200;id++){const input=freshJourneyInput(kind,id);seen.add(JSON.stringify(input));assert.equal(runJourney(kind,input).result,oracle(kind,input));assert.ok(input.length>=4&&input.length<=8)}assert.ok(seen.size>150)}
})

test('pointer scan agrees with exhaustive pairs on generated arrays',()=>{
 for(let seed=0;seed<500;seed++) {const a=Array.from({length:seed%12},(_,i)=>(seed*17+i*i*3)%20);assert.equal(pointerRun(a).result,oracle('pointers',a));assert.ok(pointerRun(a).frames.length<=Math.max(0,a.length-1))}
 assert.notEqual(pointerRun([1,8,6,2,5,4,8,3,7],true).result,49)
})
test('window scan agrees with exhaustive substrings and preserves its invariant',()=>{
 for(let seed=0;seed<600;seed++) {let n=seed,s='';for(let i=0;i<seed%10;i++){s+='abcd'[n%4];n=Math.floor(n/4)}const run=windowRun(s);assert.equal(run.result,oracle('window',s));for(const f of run.frames.filter(f=>f.action==='grow')){const w=s.slice(f.left,f.right+1);assert.equal(new Set(w).size,w.length)}assert.ok(run.frames.length<=2*s.length)}
 assert.equal(windowRun('abba',true).result,3);assert.equal(windowRun('abba').result,2)
})
test('plan checker validates known scope and executes edge cases',()=>{
 for(const kind of ['pointers','window']){assert.ok(programChecks(kind,[0,1,2,3,4]).every(c=>c.expected===c.result));assert.ok(programChecks(kind,[0,1,3,2,4]).every(c=>c.result===null));assert.ok(programChecks(kind,[0,1,2,3,4,4]).every(c=>c.result===null))}
})
test('changed requirements preserve counts and original positions',()=>{
 const a=[4,7,4,4,7], original=[...a];assert.equal(requirementResult('membership',a),true);assert.deepEqual(requirementResult('frequency',a),[[4,3],[7,2]]);assert.deepEqual(requirementResult('position',a),[0,2]);assert.equal(requirementResult('memory',a),true);assert.deepEqual(a,original);assert.deepEqual(requirementResult('position',[1,2]),[])
})
