import { useEffect, useRef } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  baseAlpha: number
}

interface NodeBackgroundProps {
  className?: string
}

export default function NodeBackground({ className = '' }: NodeBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animFrameId: number | null = null
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const nodeCount = Math.min(60, Math.max(40, Math.floor((width * height) / 25000)))
    const connectionDist = 135
    const mouseRadius = 150

    let mouse: { x: number | null; y: number | null } = { x: null, y: null }

    const nodes: Node[] = []
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 1.2,
        baseAlpha: Math.random() * 0.4 + 0.3,
      })
    }

    const handleResize = () => {
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }

    handleResize()

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }

    const handleMouseLeave = () => {
      mouse.x = null
      mouse.y = null
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })

    const drawFrame = (animate: boolean) => {
      ctx.clearRect(0, 0, width, height)

      // Update positions if animating
      if (animate) {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i]
          n.x += n.vx
          n.y += n.vy

          // Gentle bounds wrap
          if (n.x < -20) n.x = width + 20
          else if (n.x > width + 20) n.x = -20

          if (n.y < -20) n.y = height + 20
          else if (n.y > height + 20) n.y = -20

          // Mouse gentle nudge
          if (mouse.x !== null && mouse.y !== null) {
            const dx = n.x - mouse.x
            const dy = n.y - mouse.y
            const dist = Math.hypot(dx, dy)
            if (dist < mouseRadius && dist > 0) {
              const force = (1 - dist / mouseRadius) * 0.6
              n.x += (dx / dist) * force
              n.y += (dy / dist) * force
            }
          }
        }
      }

      // Draw connections between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i]
          const n2 = nodes[j]
          const dx = n1.x - n2.x
          const dy = n1.y - n2.y
          const dist = Math.hypot(dx, dy)

          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.18
            ctx.beginPath()
            ctx.strokeStyle = `rgba(107, 140, 255, ${alpha})`
            ctx.lineWidth = 1
            ctx.moveTo(n1.x, n1.y)
            ctx.lineTo(n2.x, n2.y)
            ctx.stroke()
          }
        }
      }

      // Draw connection to mouse
      if (mouse.x !== null && mouse.y !== null) {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i]
          const dx = n.x - mouse.x
          const dy = n.y - mouse.y
          const dist = Math.hypot(dx, dy)

          if (dist < mouseRadius) {
            const alpha = (1 - dist / mouseRadius) * 0.28
            ctx.beginPath()
            ctx.strokeStyle = `rgba(138, 170, 255, ${alpha})`
            ctx.lineWidth = 1.2
            ctx.moveTo(n.x, n.y)
            ctx.lineTo(mouse.x, mouse.y)
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(160, 185, 255, ${n.baseAlpha})`
        ctx.fill()
      }
    }

    const loop = () => {
      if (!document.hidden) {
        drawFrame(true)
      }
      animFrameId = requestAnimationFrame(loop)
    }

    if (prefersReducedMotion) {
      drawFrame(false)
    } else {
      animFrameId = requestAnimationFrame(loop)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animFrameId) {
          cancelAnimationFrame(animFrameId)
          animFrameId = null
        }
      } else if (!prefersReducedMotion && !animFrameId) {
        animFrameId = requestAnimationFrame(loop)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    />
  )
}
