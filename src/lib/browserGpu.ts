export interface TutorGpuAdapter { features: ReadonlySet<string> }
export interface TutorGpu { requestAdapter(options?: { powerPreference?: 'low-power' | 'high-performance' }): Promise<TutorGpuAdapter | null> }
export class GpuUnavailableError extends Error {
  constructor(message: string) { super(message); this.name = 'GpuUnavailableError' }
}
export async function findTutorGpu(gpu: TutorGpu | undefined, secure: boolean, highPerformance = false): Promise<TutorGpuAdapter> {
  if (!secure) throw new GpuUnavailableError('Browser AI needs an HTTPS website or localhost. CPU Light and the workshop remain available.')
  if (!gpu) throw new GpuUnavailableError('This browser does not expose WebGPU. Try CPU Light, or a current Chrome or Edge browser with graphics acceleration enabled.')
  // Preferences are hints, not a way to bypass browser/driver restrictions.
  const preferences = highPerformance ? [{ powerPreference: 'high-performance' as const }, undefined, { powerPreference: 'low-power' as const }] : [{ powerPreference: 'low-power' as const }, undefined, { powerPreference: 'high-performance' as const }]
  for (const options of preferences) {
    try { const adapter = await gpu.requestAdapter(options); if (adapter) return adapter } catch { /* Try another supported adapter preference. */ }
  }
  throw new GpuUnavailableError('Your browser cannot access a compatible GPU. Use CPU Light below, or enable graphics acceleration in Chrome/Edge, restart the browser, and retry. This is a device/browser limitation, not a Vercel server GPU requirement.')
}
