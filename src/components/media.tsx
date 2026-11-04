import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, type CSSProperties } from 'react'
import { imageMeta, videoLqip, type ImageName, type VideoName } from '../data/media.generated'

export const imageUrl = (name: ImageName, width: 800 | 1600 = 1600) => `/media/img/${name}-${width}.webp`
export const videoUrl = (name: VideoName) => `/media/video/${name}.mp4`
export const posterUrl = (name: VideoName) => `/media/video/${name}.webp`

type ImgProps = {
  name: ImageName
  alt: string
  sizes?: string
  priority?: boolean
  className?: string
  style?: CSSProperties
}

/** Responsive photo that paints a tiny blurred preview until the real file arrives. */
export function Img({ name, alt, sizes = '100vw', priority, className = '', style }: ImgProps) {
  const meta = imageMeta[name]
  return (
    <img
      src={imageUrl(name)}
      srcSet={`${imageUrl(name, 800)} 800w, ${imageUrl(name, 1600)} 1600w`}
      sizes={sizes}
      alt={alt}
      width={meta.w}
      height={meta.h}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={`bg-cover bg-center ${className}`}
      style={{ backgroundImage: `url(${meta.lqip})`, ...style }}
    />
  )
}

type LoopVideoProps = {
  name: VideoName
  /** When set, the parent decides if it plays. Otherwise it plays while on screen. */
  active?: boolean
  className?: string
  label?: string
}

/** Silent looping film. Plays only while needed and stays on its poster for reduced motion. */
export function LoopVideo({ name, active, className = '', label }: LoopVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const setPlaying = (on: boolean) => {
      if (on && !reduced) el.play().catch(() => {})
      else el.pause()
    }
    if (active !== undefined) {
      setPlaying(active)
      return
    }
    const io = new IntersectionObserver(([entry]) => setPlaying(entry.isIntersecting), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [active, reduced])

  return (
    <video
      ref={ref}
      src={videoUrl(name)}
      poster={posterUrl(name)}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`bg-cover bg-center ${className}`}
      style={{ backgroundImage: `url(${videoLqip[name]})` }}
    />
  )
}
