import test from 'node:test'
import assert from 'node:assert/strict'
import { findTutorGpu, GpuUnavailableError } from '../src/lib/browserGpu.ts'
import { CpuTutorClient, cpuTutorPrompt } from '../src/lib/cpuTutor.ts'

test('GPU probing tries power preferences without treating a null adapter as support', async () => {
  const calls=[]
  const adapter={features:new Set()}
  assert.equal(await findTutorGpu({requestAdapter:async options=>{calls.push(options);return calls.length===2?adapter:null}},true),adapter)
  assert.deepEqual(calls,[{powerPreference:'low-power'},undefined])
  const performanceCalls=[]
  assert.equal(await findTutorGpu({requestAdapter:async options=>{performanceCalls.push(options);return adapter}},true,true),adapter)
  assert.deepEqual(performanceCalls,[{powerPreference:'high-performance'}])
  await assert.rejects(findTutorGpu({requestAdapter:async()=>null},true),GpuUnavailableError)
  await assert.rejects(findTutorGpu(undefined,true),/CPU Light/)
  await assert.rejects(findTutorGpu({requestAdapter:()=>{throw Error('must not run')}},false),/HTTPS/)
})
class FakeWorker {
  messages=[]; stopped=false
  postMessage(message){this.messages.push(message)}
  terminate(){this.stopped=true}
  emit(data){this.onmessage({data})}
}
test('CPU worker requests keep replies matched to their IDs and surface progress', async () => {
  const worker=new FakeWorker(), progress=[]
  const client=new CpuTutorClient(worker,text=>progress.push(text))
  const loaded=client.load()
  worker.emit({id:1,type:'progress',text:'Downloading'})
  worker.emit({id:1,type:'ready',text:''}); await loaded
  const reply=client.complete([{role:'system',content:'Teach one step.'},{role:'user',content:'What does equal mean?'}])
  assert.match(worker.messages[1].prompt,/What does equal mean/)
  worker.emit({id:2,type:'result',text:'Equal values have the same value.'})
  assert.equal((await reply).choices[0].message.content,'Equal values have the same value.')
  assert.deepEqual(progress,['Downloading']);client.dispose();assert.equal(worker.stopped,true)
})
test('cancelling a CPU load rejects its pending work instead of leaving the UI waiting', async () => {
  const worker=new FakeWorker(), client=new CpuTutorClient(worker,()=>{})
  const rejected=assert.rejects(client.load(),/stopped/)
  client.dispose();await rejected
  await assert.rejects(client.complete([]),/Load it again/)
})
test('CPU prompt stays short and preserves a direct question without chat-template boilerplate', () => {
  const prompt=cpuTutorPrompt([{role:'system',content:'a'.repeat(10000)},{role:'assistant',content:'b'.repeat(10000)},{role:'user',content:'Explain equality.'}])
  assert.ok(prompt.length<1900);assert.equal(prompt,'Answer this programming question in plain language: Explain equality.')
})
test('CPU worker crashes report a recoverable failure and reject the current request', async () => {
  const worker=new FakeWorker(), failures=[], client=new CpuTutorClient(worker,()=>{},message=>failures.push(message))
  const rejected=assert.rejects(client.load(),/WebAssembly/)
  worker.onerror();await rejected
  assert.equal(failures.length,1);assert.equal(worker.stopped,true)
})
