import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from 'react'

const Silk = lazy(() => import('./Silk'))

function isLowPowerDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number }
  const cores = nav.hardwareConcurrency ?? 4
  const mem = nav.deviceMemory ?? 4
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const hasWebGL = (() => {
    try {
      const c = document.createElement('canvas')
      return !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {
      return false
    }
  })()
  return reducedMotion || !hasWebGL || cores < 4 || mem < 4
}

function StaticGradientFallback() {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background:
          'radial-gradient(circle at 20% 30%, rgba(107,140,255,0.28), transparent 55%),' +
          'radial-gradient(circle at 80% 70%, rgba(107,140,255,0.16), transparent 60%),' +
          '#050508',
        backgroundSize: '200% 200%',
        animation: 'bgDrift 30s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes bgDrift {
          0%   { background-position: 0% 0%; }
          50%  { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
      `}</style>
    </div>
  )
}

// React.lazy failures (bad chunk, no WebGL2 context inside R3F, etc.) only
// get caught by a class-based error boundary — hooks can't catch render errors.
class SilkErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(err: unknown) {
    console.error('Silk background failed to render — falling back to CSS background', err)
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

export default function Background() {
  const [useStaticFallback] = useState(isLowPowerDevice)
  const [isVisible, setIsVisible] = useState(!document.hidden)

  // Unmounting the Canvas fully stops its render loop — cheaper than trying
  // to pause internals, and Silk's own source doesn't expose a pause hook.
  useEffect(() => {
    const handleVisibility = () => setIsVisible(!document.hidden)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  if (useStaticFallback) {
    return <StaticGradientFallback />
  }

  return (
    <div
      aria-hidden
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    >
      <SilkErrorBoundary fallback={<StaticGradientFallback />}>
        <Suspense fallback={null}>
          {isVisible && (
            <Silk speed={3.5} scale={1.1} color="#3d4a7a" noiseIntensity={1.1} rotation={0} />
          )}
        </Suspense>
      </SilkErrorBoundary>
    </div>
  )
}