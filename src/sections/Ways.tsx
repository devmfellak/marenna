import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from '../components/Icons'
import { LoopVideo } from '../components/media'
import { Lines } from '../components/motion'
import { ways } from '../data/content'

function Panel({ way, index }: { way: (typeof ways)[number]; index: number }) {
  return (
    <article className="on-dark relative h-[86svh] min-h-[520px] w-full shrink-0 overflow-hidden text-white lg:h-full lg:w-screen">
      <LoopVideo name={way.video} className="absolute inset-0 h-full w-full object-cover" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/20" />
      <div className="gutter absolute inset-x-0 bottom-0 grid gap-6 pb-12 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-end lg:pb-20">
        <div>
          <p className="eyebrow mb-3 text-limone">
            0{index + 1} of 0{ways.length}
          </p>
          <h3 className="display text-[clamp(5rem,17vw,16rem)] italic leading-[0.88]">{way.label}.</h3>
        </div>
        <div>
          <p className="display text-[1.8rem] leading-[1.12]">{way.title}</p>
          <p className="mt-3 text-white/85">{way.body}</p>
          <Link to={way.to} className="btn btn-limone mt-6">
            Browse {way.kind === 'stay' ? 'stays' : way.kind === 'yacht' ? 'yachts' : 'experiences'} <ArrowRight />
          </Link>
        </div>
      </div>
    </article>
  )
}

/** On large screens vertical scroll drives a pinned horizontal strip. Small screens simply stack. */
export default function Ways() {
  const track = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], ['0vw', `-${(ways.length - 1) * 100}vw`])

  const header = (
    <div className="gutter bg-paper pb-12 pt-24">
      <p className="eyebrow mb-5 text-majolica">04 / Three ways to go</p>
      <Lines className="display text-[clamp(2.6rem,6vw,5.6rem)]" lines={['Sleep there, sail there,', <em key="go">or just go for the day.</em>]} />
    </div>
  )

  if (reduced) {
    return (
      <section aria-label="Three ways to travel">
        {header}
        {ways.map((way, i) => (
          <Panel key={way.kind} way={way} index={i} />
        ))}
      </section>
    )
  }

  return (
    <section aria-label="Three ways to travel">
      {header}
      <div className="lg:hidden">
        {ways.map((way, i) => (
          <Panel key={way.kind} way={way} index={i} />
        ))}
      </div>
      <div ref={track} className="relative hidden lg:block" style={{ height: `${ways.length * 100}svh` }}>
        <div className="sticky top-0 h-svh overflow-hidden bg-ink">
          <motion.div className="flex h-full" style={{ x, width: `${ways.length * 100}vw` }}>
            {ways.map((way, i) => (
              <Panel key={way.kind} way={way} index={i} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
