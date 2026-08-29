import { useEffect, useState } from 'react'

export function useScrollY(threshold = 40) {
  const [scrollY, setScrollY] = useState(() => (typeof window !== 'undefined' ? window.scrollY : 0))

  useEffect(() => {
    let ticking = false
    let lastScrolled = typeof window !== 'undefined' ? window.scrollY > threshold : false

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentY = window.scrollY
          const isOver = currentY > threshold
          if (isOver !== lastScrolled) {
            lastScrolled = isOver
            setScrollY(currentY)
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrollY
}
