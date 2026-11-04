import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import FilmDialog from '../components/FilmDialog'
import { Play } from '../components/Icons'
import { LoopVideo, posterUrl } from '../components/media'
import { Lines } from '../components/motion'
import { films } from '../data/content'

/** One film fills the section. Hovering or focusing a title swaps it, so only one video ever plays. */
export default function Films() {
  const [active, setActive] = useState(0)
  const [dialog, setDialog] = useState<number | null>(null)
  const [onScreen, setOnScreen] = useState(false)
  const section = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = section.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section id="films" ref={section} aria-label="Films" className="on-dark relative isolate overflow-hidden bg-ink text-white">
      <AnimatePresence initial={false}>
        <motion.div
          key={films[active].video}
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <LoopVideo name={films[active].video} active={onScreen && dialog === null} className="h-full w-full object-cover" />
        </motion.div>
      </AnimatePresence>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 via-ink/65 to-ink/10" />

      {/* Quietly warm the browser cache so that swapping films feels instant. */}
      <div className="hidden">
        {films.map((f) => (
          <img key={f.video} src={posterUrl(f.video)} alt="" loading="lazy" />
        ))}
      </div>

      <div className="gutter flex min-h-[100svh] flex-col justify-between gap-12 py-20 lg:py-24">
        <div>
          <p className="eyebrow mb-5 text-limone">05 / Beneath the surface</p>
          <Lines className="display text-[clamp(2.6rem,6vw,5.6rem)]" lines={['Better seen', <em key="once">than told.</em>]} />
        </div>

        <ol className="max-w-3xl">
          {films.map((film, i) => {
            const selected = i === active
            return (
              <li key={film.video} className="border-t border-white/25 last:border-b">
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => {
                    setActive(i)
                    setDialog(i)
                  }}
                  aria-label={`Play film: ${film.title}, ${film.place}`}
                  className="group flex min-h-14 w-full items-center gap-4 py-2 text-left"
                >
                  <span className="w-7 shrink-0 text-sm tabular-nums text-white/70">{String(i + 1).padStart(2, '0')}</span>
                  <span
                    className={`display min-w-0 flex-1 text-[clamp(1.5rem,3vw,2.5rem)] leading-tight transition-all duration-500 ease-out-soft ${
                      selected ? 'translate-x-2 italic text-limone' : ''
                    }`}
                  >
                    {film.title}
                  </span>
                  <span className="hidden text-sm text-white/75 sm:block">{film.place}</span>
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors ${
                      selected ? 'border-limone bg-limone text-ink' : 'border-white/40'
                    }`}
                  >
                    <Play className="h-4 w-4" />
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>

      <FilmDialog films={films} index={dialog} onChange={(i) => { setDialog(i); setActive(i) }} onClose={() => setDialog(null)} />
    </section>
  )
}
