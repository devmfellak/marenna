import Lenis from 'lenis'
import { useEffect } from 'react'

let instance: Lenis | null = null

export const getLenis = () => instance

export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
    instance = lenis
    let raf = requestAnimationFrame(function loop(time) {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    })
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      instance = null
    }
  }, [])
}

/** Freezes the page behind overlays. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const previous = document.body.style.overflow
    instance?.stop()
    document.body.style.overflow = 'hidden'
    return () => {
      instance?.start()
      document.body.style.overflow = previous
    }
  }, [locked])
}
