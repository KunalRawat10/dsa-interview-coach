import test from 'node:test'
import assert from 'node:assert/strict'
import { prebuiltAppConfig } from '@mlc-ai/web-llm'
import { MODEL_TIERS, activeModelTier, modelTierLabel } from '../src/lib/modelTiers.ts'

test('all three tiers map to supported models; active tier follows loaded model', () => {
  assert.deepEqual(MODEL_TIERS.map(item => item.label), ['Light', 'Medium', 'Heavy'])
  for (const size of ['0.5B', '1.5B']) {
    const id = `Qwen2.5-${size}-Instruct-q4f32_1-MLC`
    assert.ok(prebuiltAppConfig.model_list.some(model => model.model_id === id))
    assert.equal(activeModelTier(id), size)
  }
  assert.equal(modelTierLabel(activeModelTier('SmolLM2-135M-Instruct-q0f16-MLC')), 'Light')
  assert.equal(modelTierLabel(activeModelTier('SmolLM2-360M-Instruct-q4f32_1-MLC')), 'Light')
})
