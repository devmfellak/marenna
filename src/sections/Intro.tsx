import { animate, motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from '../components/Icons'
import { Img, LoopVideo } from '../components/media'
import { Lines, Reveal } from '../components/motion'
import { destinations } from '../data/destinations'
import { listingBySlug, listings } from '../data/listings'
import { roomsLeft, seatsLeft } from '../lib/booking'
import { addDays, today } from '../lib/dates'

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(reduced ? value : 0)
  useEffect(() => {
    if (!inView || reduced) return
    const controls = animate(0, value, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setShown(Math.round(v)) })
    return () => controls.stop()
  }, [inView, reduced, value])
  return (
    <span ref={ref} className="tabular-nums">
      {shown.toLocaleString('en-US')}
    </span>
  )
}

/** Live figures from the same availability the booking pages use. */
function useLiveNumbers() {
  const tonight = today()
  const tomorrow = addDays(tonight, 1)
  const hotels = listings.filter((l) => l.kind === 'stay')
  const roomsTonight = hotels.reduce((sum, h) => sum + (h.rooms ?? []).reduce((s, r) => s + roomsLeft(h, r, tonight), 0), 0)
  const week = Array.from({ length: 7 }, (_, i) => addDays(tonight, i + 1))
  const departures = listings
    .filter((l) => l.kind === 'experience')
    .reduce((sum, e) => sum + week.reduce((s, d) => s + (e.slots ?? []).filter((slot) => seatsLeft(e, d, slot.time) > 0).length, 0), 0)

  const villa = listingBySlug('lagoon-nine')!
  const villaRoom = villa.rooms!.find((r) => roomsLeft(villa, r, tonight) > 0) ?? villa.rooms![0]
  const balloon = listingBySlug('goreme-sunrise')!
  const balloonSlot = balloon.slots!.find((s) => seatsLeft(balloon, tomorrow, s.time) > 0) ?? balloon.slots![0]

  return {
    hotels: hotels.length,
    roomsTonight,
    departures,
    villa: { name: villa.name, room: villaRoom.name, left: roomsLeft(villa, villaRoom, tonight) },
    balloon: { name: balloon.name, time: balloonSlot.time, left: seatsLeft(balloon, tomorrow, balloonSlot.time) },
  }
}

function Marquee() {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
      {destinations.map((d) => (
        <li key={d.slug} className="flex shrink-0 items-center gap-10">
          <Link to={`/destinations/${d.slug}`} tabIndex={hidden ? -1 : undefined} className="group flex items-center gap-4">
            <span className="block h-14 w-14 overflow-hidden rounded-full ring-1 ring-ink/10 md:h-16 md:w-16">
              <Img name={d.images[0]} alt="" sizes="64px" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-125" />
            </span>
            <span className="display whitespace-nowrap text-[clamp(2rem,4vw,3.4rem)] italic transition-colors group-hover:text-majolica">{d.name}</span>
          </Link>
          <span aria-hidden="true" className="text-2xl text-majolica">✦</span>
        </li>
      ))}
    </ul>
  )
  return (
    <nav aria-label="All destinations" className="group/marquee relative overflow-hidden border-y border-ink/15 py-6">
      <div className="flex w-max animate-[marquee_70s_linear_infinite] group-hover/marquee:[animation-play-state:paused] motion-reduce:animate-none">
        {row(false)}
        {row(true)}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-paper to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-paper to-transparent" />
    </nav>
  )
}

export default function Intro() {
  const live = useLiveNumbers()
  const collage = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: collage, offset: ['start end', 'end start'] })
  const still = (a: number, b: number) => (reduced ? [0, 0] : [a, b])
  const yMain = useTransform(scrollYProgress, [0, 1], still(70, -70))
  const ySide = useTransform(scrollYProgress, [0, 1], still(160, -140))
  const yRound = useTransform(scrollYProgress, [0, 1], still(-30, 110))
  const turn = useTransform(scrollYProgress, [0, 1], still(-5, 3))

  const counters = [
    { value: destinations.length, label: 'destinations' },
    { value: live.hotels, label: 'handpicked hotels' },
    { value: live.roomsTonight, label: 'rooms free tonight' },
    { value: live.departures, label: 'departures this week' },
  ]

  return (
    <section aria-label="About Marenna" className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-20 hidden h-[36rem] w-[36rem] rounded-full bg-majolica/[0.06] blur-3xl sm:block" />
      <div className="gutter grid gap-14 pb-20 pt-24 lg:grid-cols-12 lg:gap-8 lg:pt-32">
        <div className="relative z-10 lg:col-span-5 lg:pt-8">
          <Reveal>
            <p className="eyebrow mb-6 flex items-center gap-3 text-majolica">
              <span className="h-px w-10 bg-majolica" /> 01 / The idea
            </p>
          </Reveal>
          <Lines
            className="display text-[clamp(2.6rem,4.8vw,4.6rem)] leading-[1.02]"
            lines={['Most trips are', 'remembered for', <em key="one" className="text-majolica">one moment.</em>]}
          />
          <Reveal delay={0.15}>
            <p className="mt-7 max-w-md text-[1.12rem] leading-relaxed text-ink/75">
              A boat turning into an empty bay. Steam off a cedar bath. The sky going green at one in the morning. We
              find those moments, then make them easy to book, with live rooms, seats and time slots.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/explore?kind=stay" className="btn btn-primary">
                Find a stay <ArrowRight />
              </Link>
              <Link to="/destinations" className="btn btn-line">
                All destinations
              </Link>
            </div>
          </Reveal>

          <dl className="mt-12 grid grid-cols-2 gap-3">
            {counters.map((c, i) => (
              <Reveal key={c.label} delay={0.08 * i}>
                <div className="rounded-2xl border border-ink/10 bg-white/70 p-4 backdrop-blur">
                  <dd className="display text-[2.6rem] leading-none">
                    <CountUp value={c.value} />
                  </dd>
                  <dt className="mt-2 text-sm text-muted">{c.label}</dt>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>

        <div ref={collage} className="relative h-[32rem] sm:h-[40rem] lg:col-span-7 lg:h-[46rem]">
          <motion.div style={{ y: yMain }} className="absolute right-0 top-0 h-[82%] w-[74%] overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-40px_rgb(8_19_31/0.6)]">
            <LoopVideo name="pool-palms" className="h-full w-full object-cover" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
            <p className="absolute bottom-5 left-5 text-sm font-medium text-white/90">Infinity pool at dusk</p>
          </motion.div>

          <motion.div
            style={{ y: ySide, rotate: turn }}
            className="absolute bottom-0 left-0 h-[52%] w-[44%] overflow-hidden rounded-[1.6rem] border-[6px] border-paper shadow-[0_30px_60px_-30px_rgb(8_19_31/0.7)]"
          >
            <Img name="seychelles-1" alt="Seychelles" sizes="(min-width: 1024px) 24vw, 44vw" className="h-full w-full object-cover" />
          </motion.div>

          <motion.div style={{ y: yRound }} className="absolute left-[6%] top-[4%] aspect-square w-[28%] overflow-hidden rounded-full border-[6px] border-paper shadow-xl">
            <Img name="kyoto-1" alt="Kyoto" sizes="20vw" className="h-full w-full object-cover" />
          </motion.div>

          <motion.div
            className="absolute left-[2%] top-[44%] z-10 max-w-[16rem] rounded-2xl border border-white/60 bg-white/85 p-4 shadow-[0_20px_50px_-20px_rgb(8_19_31/0.45)] backdrop-blur-md sm:left-[-4%]"
            animate={reduced ? undefined : { y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-majolica">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-majolica opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-majolica" />
              </span>
              Live tonight
            </p>
            <p className="mt-1.5 font-semibold leading-snug">{live.villa.name}, Maldives</p>
            <p className="text-sm text-muted">
              {live.villa.left > 0 ? `${live.villa.left} × ${live.villa.room} left` : `${live.villa.room} sold out`}
            </p>
          </motion.div>

          <motion.div
            className="absolute bottom-[8%] right-[3%] z-10 max-w-[17rem] rounded-2xl bg-ink p-4 text-paper shadow-[0_20px_50px_-20px_rgb(8_19_31/0.7)]"
            animate={reduced ? undefined : { y: [0, 12, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-limone">Tomorrow · {live.balloon.time}</p>
            <p className="mt-1.5 font-semibold leading-snug">{live.balloon.name}</p>
            <p className="text-sm text-white/70">
              {live.balloon.left} {live.balloon.left === 1 ? 'seat' : 'seats'} left in the basket
            </p>
          </motion.div>
        </div>
      </div>
      <Marquee />
    </section>
  )
}
