export const MODEL_TIERS = [
  { id: 'smallest', label: 'Light', description: 'Lowest memory; basic explanations.' },
  { id: '0.5B', label: 'Medium', description: 'Qwen 0.5B; a larger download and more memory.' },
  { id: '1.5B', label: 'Heavy', description: 'Qwen 1.5B; more capable than Light and Medium, with a larger download and more memory use.' },
  { id: '7B', label: 'Advanced (7B)', description: 'Qwen 7B; experimental desktop-class browser option. Allow about 6 GB for model downloads, 8 GB GPU memory and 16 GB system RAM. Close other AI sessions first.' },
] as const
export type ModelTier = typeof MODEL_TIERS[number]['id']
export function activeModelTier(modelId: string): ModelTier {
  return modelId.includes('Qwen2.5-7B-') ? '7B' : modelId.includes('Qwen2.5-1.5B-') ? '1.5B' : modelId.includes('Qwen2.5-0.5B-') ? '0.5B' : 'smallest'
}
export function modelTierLabel(tier: ModelTier): string {
  return MODEL_TIERS.find(item => item.id === tier)!.label
}
