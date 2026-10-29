import test from 'node:test'
import assert from 'node:assert/strict'
import { TUTOR_ACTIONS, exportTutorTranscript } from '../src/lib/tutorDemo.ts'
test('demo export removes internal metadata and preserves student text and code',()=>{
 const output=exportTutorTranscript('Minimum Window',[{role:'user',content:'Why two As?\n```js\nconst n = 2;\n```'},{role:'assistant',content:'Count each occurrence.<!--lesson:{"private":"state"}-->'}]);assert.ok(output.includes('Why two As?'));assert.ok(output.includes('const n = 2'));assert.ok(output.includes('Count each occurrence.'));assert.ok(!output.includes('private'));assert.ok(output.includes('not verified mastery'))
})
test('tutor shortcuts retain incremental teaching and current exercise context',()=>{
 assert.equal(new Set(TUTOR_ACTIONS.map(a=>a.label)).size,4);for(const action of TUTOR_ACTIONS)assert.match(action.prompt,/current/);assert.match(TUTOR_ACTIONS[0].prompt,/Do not finish/);assert.match(TUTOR_ACTIONS[2].prompt,/Wait for my response/)
})
test('export preserves ordinary HTML comments in student examples',()=>{
 assert.ok(exportTutorTranscript('HTML',[{role:'user',content:'<!-- my own comment -->'}]).includes('<!-- my own comment -->'))
})
