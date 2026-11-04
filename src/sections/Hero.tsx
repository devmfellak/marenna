import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Pause, Play } from '../components/Icons'
import { posterUrl, videoUrl } from '../components/media'
import SearchDock from '../components/SearchDock'
import { heroSlides } from '../data/content'
import type { HeroStage } from '../three/HeroStage'

const SLIDE_MS = 8000
const ease = [0.16, 1, 0.3, 1] as const

const webglAvailable = () => {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Hero() {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(() => !prefersReduced())
  const [stageReady, setStageReady] = useState(false)
  const [onScreen, setOnScreen] = useState(true)
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const stage = useRef<HeroStage | null>(null)
  const slide = heroSlides[index]

  useEffect(() => {
    if (prefersReduced() || !webglAvailable() || !canvas.current) return
    let cancelled = false
    let instance: HeroStage | null = null
    void import('../three/HeroStage').then(({ HeroStage }) => {
      if (cancelled || !canvas.current) return
      instance = new HeroStage(
        canvas.current,
        heroSlides.map((s) => ({ video: videoUrl(s.video), poster: posterUrl(s.video) })),
        0,
        () => setStageReady(true),
      )
      stage.current = instance
    })
    return () => {
      cancelled = true
      instance?.dispose()
      stage.current = null
    }
  }, [])

  useEffect(() => {
    stage.current?.goTo(index)
  }, [index])

  // Rendering and auto-advance rest whenever nobody can see the hero.
  useEffect(() => {
    const el = section.current
    if (!el) return
    let intersecting = true
    const update = () => {
      const visible = intersecting && !document.hidden
      setOnScreen(visible)
      stage.current?.setRunning(visible)
    }
    const io = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting
      update()
    })
    io.observe(el)
    document.addEventListener('visibilitychange', update)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  const goTo = useCallback((i: number) => setIndex((i + heroSlides.length) % heroSlides.length), [])

  return (
    <>
      <section
        ref={section}
        aria-roledescription="carousel"
        aria-label="Featured journeys"
        className="on-dark relative h-[82svh] min-h-[560px] overflow-hidden bg-ink text-white lg:h-svh lg:min-h-[720px]"
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect()
          stage.current?.setPointer((e.clientX - box.left) / box.width, (e.clientY - box.top) / box.height)
        }}
      >
        {/* Poster layer: first paint, and the whole show when WebGL or motion is unavailable. */}
        <AnimatePresence initial={false}>
          {!stageReady && (
            <motion.img
              key={slide.video}
              src={posterUrl(slide.video)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            />
          )}
        </AnimatePresence>
        <canvas
          ref={canvas}
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${stageReady ? 'opacity-100' : 'opacity-0'}`}
        />

        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/60 to-transparent" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-ink/55 via-ink/15 to-transparent" />

        <div className="gutter absolute inset-x-0 bottom-8 lg:bottom-32">
          <div className="flex items-end justify-between gap-8">
            <div className="min-w-0" aria-live={playing ? 'off' : 'polite'}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={slide.video} initial="hide" animate="show" exit="out">
                  <motion.p
                    className="eyebrow mb-4 text-limone"
                    variants={{
                      hide: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.7, ease, delay: 0.15 } },
                      out: { opacity: 0, transition: { duration: 0.3 } },
                    }}
                  >
                    {slide.eyebrow}
                  </motion.p>
                  <h1 className="display text-[clamp(3.3rem,9.4vw,9.5rem)] leading-[0.95]">
                    {slide.title.map((line, i) => (
                      <span key={line} className="-mb-[0.24em] -ml-[0.1em] block overflow-hidden pb-[0.24em] pl-[0.1em]">
                        <motion.span
                          className={`block ${i === 1 ? 'italic' : ''}`}
                          variants={{
                            hide: { y: '125%' },
                            show: { y: 0, transition: { duration: 1.15, ease, delay: 0.1 + i * 0.1 } },
                            out: { y: '-125%', transition: { duration: 0.42, ease: [0.76, 0, 0.24, 1] } },
                          }}
                        >
                          {line}
                        </motion.span>
                      </span>
                    ))}
                  </h1>
                  <motion.div
                    className="mt-6"
                    variants={{
                      hide: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.7, ease, delay: 0.45 } },
                      out: { opacity: 0, transition: { duration: 0.3 } },
                    }}
                  >
                    <Link to={slide.to} className="group inline-flex min-h-11 items-center gap-3 text-[1.05rem] font-medium">
                      <span className="link-line">{slide.cta}</span>
                      <ArrowRight className="transition-transform duration-500 ease-out-soft group-hover:translate-x-1.5" />
                    </Link>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="hidden shrink-0 pb-3 md:block">
              <div className="flex items-center gap-4">
                <span className="text-sm tabular-nums">
                  {String(index + 1).padStart(2, '0')} <span className="text-white/60">/ {String(heroSlides.length).padStart(2, '0')}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/40 hover:bg-white hover:text-ink"
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-7 flex gap-1.5" role="group" aria-label="Choose slide">
            {heroSlides.map((s, i) => (
              <button
                key={s.video}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}: ${s.title.join(' ')}`}
                aria-current={i === index}
                className="group flex h-8 flex-1 items-center"
              >
                <span className="relative block h-[2px] w-full overflow-hidden bg-white/30 transition-[height] group-hover:h-1">
                  {i < index && <span className="absolute inset-0 bg-white" />}
                  {i === index && (
                    <span
                      key={index}
                      className={`absolute inset-0 origin-left bg-limone ${playing ? '' : 'scale-x-100'}`}
                      style={
                        playing
                          ? {
                              animation: `grow-x ${SLIDE_MS}ms linear forwards`,
                              animationPlayState: onScreen ? 'running' : 'paused',
                            }
                          : undefined
                      }
                      onAnimationEnd={() => goTo(index + 1)}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="relative z-20 bg-ink lg:-mt-[6.25rem] lg:bg-transparent">
        <div className="gutter py-4 lg:py-0">
          <SearchDock />
        </div>
      </div>
    </>
  )
}
