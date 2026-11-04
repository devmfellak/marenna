import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from '../components/Icons'
import { Img } from '../components/media'
import { Lines, Reveal } from '../components/motion'
import { monthNames } from '../data/content'
import { destinations, placeName } from '../data/destinations'
import { fromPrice } from '../data/listings'
import { money } from '../lib/booking'
import type { AtlasStage } from '../three/AtlasStage'

const TOUR_MS = 6500

const webglAvailable = () => {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export default function Atlas() {
  const [index, setIndex] = useState(0)
  const [touring, setTouring] = useState(true)
  const [visible, setVisible] = useState(false)
  const [ready, setReady] = useState(false)
  const [webgl] = useState(webglAvailable)
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const stage = useRef<AtlasStage | null>(null)
  const pins = useRef<(HTMLButtonElement | null)[]>([])
  const indexRef = useRef(0)
  const visibleRef = useRef(false)
  indexRef.current = index

  const destination = destinations[index]
  const from = fromPrice(destination.slug)

  // Load three.js and the textures only as the section approaches, then run only while it is on screen.
  useEffect(() => {
    const el = section.current
    if (!el || !webgl) return
    let cancelled = false
    let instance: AtlasStage | null = null
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || instance) return
        near.disconnect()
        void import('../three/AtlasStage').then(({ AtlasStage }) => {
          if (cancelled || !canvas.current) return
          instance = new AtlasStage(
            canvas.current,
            destinations.map((d) => ({ lat: d.lat, lon: d.lon })),
            () => pins.current,
            () => {
              setReady(true)
              instance?.focus(indexRef.current, false)
            },
          )
          stage.current = instance
          instance.setRunning(visibleRef.current)
        })
      },
      { rootMargin: '600px 0px' },
    )
    near.observe(el)
    const onScreen = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting
      setVisible(entry.isIntersecting)
      stage.current?.setRunning(entry.isIntersecting)
    })
    onScreen.observe(el)
    return () => {
      cancelled = true
      near.disconnect()
      onScreen.disconnect()
      instance?.dispose()
      stage.current = null
    }
  }, [webgl])

  useEffect(() => {
    stage.current?.focus(index)
  }, [index])

  // A slow guided tour of the pins, until the visitor takes over.
  useEffect(() => {
    if (!touring || !visible || !ready || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % destinations.length), TOUR_MS)
    return () => window.clearInterval(timer)
  }, [touring, visible, ready])

  const choose = (i: number) => {
    setTouring(false)
    setIndex(i)
  }

  return (
    <section
      id="atlas"
      ref={section}
      aria-label="Destination atlas"
      className="on-dark relative overflow-hidden bg-ink text-paper"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_72%_50%,#17345d_0%,transparent_70%)]"
      />
      <div className="gutter relative grid grid-cols-[minmax(0,1fr)] gap-8 py-20 lg:min-h-[100svh] lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-center lg:gap-4 lg:py-16">
        <div className="relative z-10 order-2 lg:order-1">
          <Reveal>
            <p className="eyebrow mb-5 text-limone">03 / The atlas</p>
          </Reveal>
          <Lines
            className="display mb-8 text-[clamp(2.6rem,5vw,4.6rem)]"
            lines={['Spin the world.', <em key="pick">Pick a place.</em>]}
          />

          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={destination.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              aria-live="polite"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-sm">
                <Img name={destination.images[0]} alt={placeName(destination)} sizes="(min-width: 1024px) 26rem, 100vw" className="h-full w-full object-cover" />
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <h3 className="display text-[2rem]">{destination.name}</h3>
                {destination.country !== destination.name && <p className="shrink-0 text-sm text-white/65">{destination.country}</p>}
              </div>
              <p className="mt-2 text-white/80">{destination.tagline}</p>
              <p className="mt-3 text-sm text-white/65">
                Best in {destination.bestMonths.slice().sort((a, b) => a - b).map((m) => monthNames[m]).join(', ')}
                {from ? ` · from ${money(from)}` : ''}
              </p>
              <Link to={`/destinations/${destination.slug}`} className="group mt-5 inline-flex min-h-11 items-center gap-3 font-medium">
                <span className="link-line">Explore {destination.name}</span>
                <ArrowRight className="transition-transform duration-500 ease-out-soft group-hover:translate-x-1.5" />
              </Link>
            </motion.article>
          </AnimatePresence>
        </div>

        {webgl ? (
          <div className="relative order-1 aspect-square w-full lg:order-2 lg:-my-10 lg:ml-[-4%] lg:aspect-auto lg:h-[min(92svh,60rem)] lg:w-[108%]">
            <canvas
              ref={canvas}
              aria-hidden="true"
              onPointerDown={() => setTouring(false)}
              className={`absolute inset-0 h-full w-full cursor-grab touch-pan-y transition-opacity duration-[1.2s] ${ready ? 'opacity-100' : 'opacity-0'}`}
            />
            <div className="pointer-events-none absolute inset-0">
              {destinations.map((d, i) => {
                const selected = i === index
                return (
                  <button
                    key={d.slug}
                    ref={(el) => {
                      pins.current[i] = el
                    }}
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    onClick={() => choose(i)}
                    style={{ visibility: 'hidden' }}
                    className={`group pointer-events-auto absolute left-0 top-0 h-0 w-0 hover:z-20 ${selected ? 'z-10' : ''}`}
                  >
                    <span className="absolute left-0 top-0 block h-11 w-11 -translate-x-1/2 -translate-y-1/2" />
                    {selected && (
                      <span
                        className="absolute left-0 top-0 block h-7 w-7 rounded-full border border-limone"
                        style={{ animation: 'pulse-ring 2s ease-out infinite' }}
                      />
                    )}
                    <span
                      className={`absolute left-0 top-0 block -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 group-hover:scale-125 group-hover:bg-limone ${
                        selected ? 'h-3 w-3 bg-limone' : 'h-2 w-2 bg-white shadow-[0_0_0_3px_rgb(255_255_255/0.2)]'
                      }`}
                    />
                    <span
                      className={`absolute left-3 top-0 block -translate-y-1/2 whitespace-nowrap rounded-full bg-ink/75 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm transition-opacity duration-300 ${
                        selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {d.name}
                    </span>
                  </button>
                )
              })}
            </div>
            {!ready && <p className="absolute inset-0 grid place-items-center text-sm text-white/55">Loading the planet…</p>}
          </div>
        ) : (
          <div className="order-1 lg:order-2" />
        )}

        <div className="relative z-10 order-3 lg:absolute lg:bottom-8 lg:left-auto lg:right-[clamp(1rem,4vw,4rem)] lg:max-w-[46%]">
          <p className="eyebrow mb-2 w-fit rounded-full bg-ink/60 px-2 py-0.5 text-[0.66rem] text-white/80">All destinations</p>
          <div className="no-bar flex gap-1.5 overflow-x-auto pb-1 lg:flex-wrap lg:justify-start lg:overflow-visible">
            {destinations.map((d, i) => (
              <button
                key={d.slug}
                type="button"
                onClick={() => choose(i)}
                aria-pressed={i === index}
                className={`min-h-9 shrink-0 rounded-full border px-3 py-1 text-[0.8rem] backdrop-blur-sm transition-colors ${
                  i === index ? 'border-limone bg-limone font-semibold text-ink' : 'border-white/30 bg-ink/60 text-white hover:border-white'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
