import test from 'node:test'
import assert from 'node:assert/strict'
import { fitPatternNodes, MAP_WIDTH, MAP_HEIGHT } from '../src/lib/patternMapLayout.ts'

test('map keeps extreme nodes and their labels inside the drawing area', () => {
  const source = [{ id: 'arrays', x: .15, y: .35 }, { id: 'top', x: .35, y: .2 }, { id: 'graph', x: .3, y: .9 }, { id: 'dp', x: .7, y: .8 }, { id: 'right', x: .8, y: .55 }]
  const copy = structuredClone(source)
  const fitted = fitPatternNodes(source)
  for (const node of fitted) {
    assert.ok(node.px - 80 >= 0 && node.px + 80 <= MAP_WIDTH, 'reserve space on both sides for long labels')
    assert.ok(node.py - 22 >= 0 && node.py + 45 <= MAP_HEIGHT, 'reserve room for nodes, focus rings and lower labels')
  }
  assert.deepEqual(source, copy, 'fitting must not overwrite saved pattern metadata')
  assert.equal(fitted.length, source.length)
})
test('an empty map and a single point never produce invalid drawing coordinates', () => {
  assert.deepEqual(fitPatternNodes([]), [])
  assert.deepEqual(fitPatternNodes([{ id: 'one', x: 0, y: 0 }])[0], { id: 'one', x: 0, y: 0, px: MAP_WIDTH / 2, py: MAP_HEIGHT / 2 })
  for (const node of fitPatternNodes([{ id: 'a', x: 1, y: 0 }, { id: 'b', x: 1, y: 2 }])) assert.ok(Number.isFinite(node.px) && Number.isFinite(node.py))
})
