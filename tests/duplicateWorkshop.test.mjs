import test from 'node:test'
import assert from 'node:assert/strict'
import { freshTrace, predictMembership, recordCurrent, hasDuplicate, compareApproaches, comparisonInput,
  orderExperiment, executeBlocks, checkProgram, challengeCase, checkChallenge, newWorkshopRecord,
  readWorkshopRecord, saveStageEvidence, BLOCKS } from '../src/lib/duplicateWorkshop.ts'

test('learner predictions and recording are separate; errors cannot advance the trace', () => {
  const values=[4,7,4]
  let state=freshTrace()
  state=predictMembership(values,state,true)
  assert.equal(state.index,0);assert.equal(state.mistakes,1);assert.deepEqual(state.seen,[])
  state=predictMembership(values,state,false)
  assert.equal(state.phase,'add');assert.deepEqual(state.seen,[])
  assert.equal(predictMembership(values,state,true),state)
  state=recordCurrent(values,state)
  assert.deepEqual(state.seen,[4]);assert.equal(state.index,1)
  state=recordCurrent(values,predictMembership(values,state,false))
  assert.deepEqual(state.seen,[4,7])
  state=predictMembership(values,state,true)
  assert.equal(state.result,true);assert.equal(state.phase,'complete');assert.deepEqual(state.seen,[4,7])
  assert.equal(recordCurrent(values,state),state)
})

test('a distinct input requires checking and recording every value before false', () => {
  let state=freshTrace()
  for(const value of [4,7,9]){
    assert.equal(state.result,null)
    state=predictMembership([4,7,9],state,false)
    assert.equal(state.phase,'add')
    state=recordCurrent([4,7,9],state)
    assert.ok(state.seen.includes(value))
  }
  assert.equal(state.result,false);assert.equal(state.index,3)
})

test('comparison reports actual list equality checks separately from abstract Set calls', () => {
  const result=compareApproaches(comparisonInput(1000,false))
  assert.equal(result.listComparisons,499500);assert.equal(result.setMembershipCalls,1000)
  assert.equal(result.stored,1000);assert.equal(result.result,false)
  const early=compareApproaches([4,4,9,8])
  assert.equal(early.visited,2);assert.equal(early.listComparisons,1);assert.equal(early.stored,1)
})

test('reversing the operations produces a demonstrable false positive at the first item', () => {
  const broken=orderExperiment([4,7,4],true)
  assert.equal(broken.length,1);assert.equal(broken[0].checkFound,true);assert.equal(broken[0].actualEarlier,false)
  assert.deepEqual(broken[0].before,[]);assert.deepEqual(broken[0].after,[4])
  const repaired=orderExperiment([4,7,4],false)
  assert.deepEqual(repaired.map(frame=>frame.checkFound),[false,false,true])
  assert.deepEqual(repaired[2].before,[4,7]);assert.equal(repaired[2].actualEarlier,true)
})

function permutations(items){return items.length?items.flatMap((item,index)=>permutations(items.filter((_,i)=>i!==index)).map(tail=>[item,...tail])):[[]]}
test('all 120 assemblies are executed or rejected; only correct scope and operation order pass', () => {
  const passing=permutations(Object.keys(BLOCKS)).filter(blocks=>checkProgram(blocks).passed)
  assert.deepEqual(passing,[['init','loop','check','add','finish']])
  const wrong=checkProgram(['init','loop','add','check','finish'])
  assert.equal(wrong.passed,false)
  assert.equal(wrong.cases.find(item=>item.values.length===1).result,true)
  assert.equal(executeBlocks(['init','loop','check','add','finish'],[]).result,false)
})

test('the assembled algorithm agrees with an independent pairwise oracle on varied inputs', () => {
  const blocks=['init','loop','check','add','finish']
  const cases=[[],[0],[-1,-1],[1,2,3],['x','y','x'],[0,-0],['1',1]]
  for(let i=0;i<200;i++)cases.push(challengeCase(i))
  for(const values of cases)assert.equal(executeBlocks(blocks,values).result,hasDuplicate(values))
})

test('fresh challenge checks require correctness, strategy, invariant and complexity', () => {
  for(let i=0;i<100;i++){
    const values=challengeCase(i)
    const correct={repeats:String(hasDuplicate(values)),structure:'set',order:'check-first',time:'linear',space:'linear',reason:'earlier'}
    assert.equal(checkChallenge(values,correct).passed,true)
    for(const key of Object.keys(correct))assert.equal(checkChallenge(values,{...correct,[key]:'wrong'}).passed,false)
  }
  assert.notDeepEqual(challengeCase(0),challengeCase(1))
  assert.equal(typeof challengeCase(2)[0],'string')
})

test('persistence keeps feedback counts and hints across refresh; corrupt records reset safely', () => {
  let record=newWorkshopRecord()
  record.challenge={caseId:3,mistakes:2,hintUsed:true}
  record=saveStageEvidence(record,'challenge',2,true)
  const restored=readWorkshopRecord(JSON.stringify(record))
  assert.equal(restored.challenge.mistakes,2);assert.equal(restored.challenge.hintUsed,true)
  assert.equal(restored.evidence[0].hintUsed,true)
  record={...restored,challenge:{caseId:4,mistakes:0,hintUsed:false}}
  const improved=saveStageEvidence(record,'challenge',0,false)
  assert.equal(improved.evidence[0].caseId,4)
  assert.equal(improved.evidence[0].mistakes,0);assert.equal(improved.evidence[0].hintUsed,false)
  for(const raw of [null,'broken','{}','{"version":2}'])assert.deepEqual(readWorkshopRecord(raw),newWorkshopRecord())
  const invalid=readWorkshopRecord('{"version":1,"stage":"secret","evidence":[{"id":"challenge","mistakes":-1}],"challenge":{"caseId":-4,"mistakes":"zero"}}')
  assert.deepEqual(invalid,newWorkshopRecord())
})
