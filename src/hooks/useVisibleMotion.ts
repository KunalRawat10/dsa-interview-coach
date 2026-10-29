import { useEffect, useState, type RefObject } from 'react'

// Decorative loops sleep offscreen, in background tabs, and with reduced motion.
export function useVisibleMotion(ref: RefObject<HTMLElement | null>, enabled = true): boolean {
  const [active, setActive] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = !('IntersectionObserver' in window)
    const update = () => setActive(visible && !document.hidden && !preference.matches)
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting)
      update()
    }, { threshold: 0.08 }) : null
    observer?.observe(element)
    preference.addEventListener('change', update)
    document.addEventListener('visibilitychange', update)
    update()
    return () => {
      observer?.disconnect()
      preference.removeEventListener('change', update)
      document.removeEventListener('visibilitychange', update)
    }
  }, [ref])
  return enabled && active
}
