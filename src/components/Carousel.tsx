import useEmblaCarousel from 'embla-carousel-react'
import { motion, useMotionValue } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight } from './Icons'

type Props = {
  children: ReactNode[]
  label: string
  /** Tailwind width classes for each slide. */
  slideClass?: string
  gap?: string
  tone?: 'light' | 'dark'
  headerSlot?: ReactNode
}

export default function Carousel({
  children,
  label,
  slideClass = 'w-[82vw] sm:w-[46vw] lg:w-[31vw]',
  gap = 'gap-4 md:gap-6',
  tone = 'light',
  headerSlot,
}: Props) {
  const [viewport, api] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' })
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)
  const progress = useMotionValue(0)

  useEffect(() => {
    if (!api) return
    const sync = () => {
      setCanPrev(api.canScrollPrev())
      setCanNext(api.canScrollNext())
    }
    const onScroll = () => progress.set(Math.max(0, Math.min(1, api.scrollProgress())))
    sync()
    onScroll()
    api.on('select', sync).on('reInit', sync).on('scroll', onScroll).on('reInit', onScroll)
    return () => {
      api.off('select', sync).off('reInit', sync).off('scroll', onScroll).off('reInit', onScroll)
    }
  }, [api, progress])

  const buttonClass = `grid h-12 w-12 place-items-center rounded-full border transition-colors disabled:opacity-30 ${
    tone === 'dark' ? 'border-white/40 hover:bg-white hover:text-ink' : 'border-ink/30 hover:bg-ink hover:text-paper'
  }`

  return (
    <section aria-roledescription="carousel" aria-label={label}>
      <div className="gutter mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0 flex-1">{headerSlot}</div>
        <div className="flex gap-2">
          <button type="button" className={buttonClass} aria-label="Previous slide" disabled={!canPrev} onClick={() => api?.scrollPrev()}>
            <ArrowLeft />
          </button>
          <button type="button" className={buttonClass} aria-label="Next slide" disabled={!canNext} onClick={() => api?.scrollNext()}>
            <ArrowRight />
          </button>
        </div>
      </div>
      <div ref={viewport} className="cursor-grab overflow-hidden active:cursor-grabbing">
        <div className={`gutter flex ${gap}`}>
          {children.map((child, i) => (
            <div key={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${children.length}`} className={`shrink-0 ${slideClass}`}>
              {child}
            </div>
          ))}
        </div>
      </div>
      <div className="gutter mt-8">
        <div className={`h-px w-full ${tone === 'dark' ? 'bg-white/20' : 'bg-ink/15'}`}>
          <motion.div
            className={`h-[2px] origin-left -translate-y-px ${tone === 'dark' ? 'bg-limone' : 'bg-majolica'}`}
            style={{ scaleX: progress }}
          />
        </div>
      </div>
    </section>
  )
}
