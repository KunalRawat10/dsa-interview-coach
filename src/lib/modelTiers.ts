export const MODEL_TIERS = [
  { id: 'smallest', label: 'Light', description: 'Lowest memory; basic explanations.' },
  { id: '0.5B', label: 'Medium', description: 'Qwen 0.5B; a larger download and more memory.' },
  { id: '1.5B', label: 'Heavy', description: 'Qwen 1.5B; more capable, with the highest resource use of these options.' },
] as const
export type ModelTier = typeof MODEL_TIERS[number]['id']
export function activeModelTier(modelId: string): ModelTier {
  return modelId.includes('Qwen2.5-1.5B-') ? '1.5B' : modelId.includes('Qwen2.5-0.5B-') ? '0.5B' : 'smallest'
}
export function modelTierLabel(tier: ModelTier): string {
  return MODEL_TIERS.find(item => item.id === tier)!.label
}
