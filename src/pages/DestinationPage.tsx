import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AvailabilityGrid, { type GridRow } from '../components/AvailabilityGrid'
import Calendar from '../components/Calendar'
import { ArrowRight, Star } from '../components/Icons'
import ListingCard from '../components/ListingCard'
import { Img, LoopVideo } from '../components/media'
import { ClipReveal, Lines, Reveal } from '../components/motion'
import Popover from '../components/Popover'
import { roomStatuses } from '../components/RoomList'
import { Stepper } from '../components/SearchDock'
import SlotPicker from '../components/SlotPicker'
import { monthNames } from '../data/content'
import { destinationBySlug, destinations, type Destination } from '../data/destinations'
import { listingsIn, type Listing } from '../data/listings'
import { money, roomsLeft, seasonalPrice } from '../lib/booking'
import { addDays, daysBetween, formatRange, today, type ISODate } from '../lib/dates'
import { suggestedStay } from '../lib/selection'
import NotFound from './NotFound'

const stayQuery = (from: ISODate, to: ISODate, guests: number, room?: string) =>
  `from=${from}&to=${to}&guests=${guests}${room ? `&room=${room}` : ''}`

function HotelRow({ hotel, from, to, guests }: { hotel: Listing; from: ISODate; to: ISODate; guests: number }) {
  const statuses = roomStatuses(hotel, from, to, guests)
  const open = statuses.filter((s) => s.fits && (s.left ?? 0) > 0)
  const cheapest = open.sort((a, b) => (a.total ?? 0) - (b.total ?? 0))[0]
  const roomsLeftTotal = open.reduce((sum, s) => sum + (s.left ?? 0), 0)

  return (
    <article className="grid overflow-hidden rounded-xl border border-ink/15 bg-white md:grid-cols-[minmax(0,20rem)_1fr]">
      <Link to={`/listing/${hotel.slug}?${stayQuery(from, to, guests)}`} className="group relative block aspect-[16/10] overflow-hidden md:aspect-auto">
        <Img name={hotel.images[0]} alt={hotel.name} sizes="(min-width: 768px) 20rem, 100vw" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out-soft group-hover:scale-105" />
        {hotel.featured && <span className="eyebrow absolute left-3 top-3 rounded-full bg-limone px-3 py-1.5 text-[0.62rem]">{hotel.featured}</span>}
      </Link>
      <div className="flex flex-col gap-4 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-majolica" aria-label={`${hotel.stars} star hotel`}>
              {'★'.repeat(hotel.stars ?? 0)}
            </p>
            <h3 className="display text-[1.9rem] leading-tight">
              <Link to={`/listing/${hotel.slug}?${stayQuery(from, to, guests)}`} className="hover:text-majolica">
                {hotel.name}
              </Link>
            </h3>
            <p className="text-[0.95rem] text-muted">{hotel.tagline}</p>
          </div>
          <p className="flex items-center gap-1 font-semibold tabular-nums">
            <Star className="h-4 w-4 text-majolica" /> {hotel.rating.toFixed(1)}
            <span className="font-normal text-muted">({hotel.reviews})</span>
          </p>
        </div>

        <ul className="grid gap-2 sm:grid-cols-3">
          {statuses.map(({ room, left, total, fits }) => {
            const available = fits && (left ?? 0) > 0
            return (
              <li key={room.id}>
                <Link
                  to={available ? `/listing/${hotel.slug}?${stayQuery(from, to, guests, room.id)}#rooms` : `/listing/${hotel.slug}`}
                  aria-disabled={!available}
                  className={`block h-full rounded-lg border p-3 text-sm transition-colors ${available ? 'border-ink/15 hover:border-majolica' : 'border-dashed border-ink/15 opacity-60'}`}
                >
                  <span className="block font-semibold leading-snug">{room.name}</span>
                  <span className="mt-1 block text-xs text-muted">Sleeps {room.guests}</span>
                  <span className="mt-2 block">
                    {!fits ? (
                      <span className="text-muted">Too small</span>
                    ) : !available ? (
                      <span className="font-medium text-danger">Sold out</span>
                    ) : (
                      <>
                        <span className="font-semibold tabular-nums">{money(total ?? 0)}</span>
                        <span className={`ml-1.5 text-xs ${(left ?? 0) <= 2 ? 'rounded bg-limone px-1.5 py-0.5 font-semibold' : 'text-muted'}`}>{left} left</span>
                      </>
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
          <p className="text-[0.95rem]" role="status">
            {cheapest ? (
              <>
                <span className="font-semibold text-majolica">{roomsLeftTotal} rooms available</span>
                <span className="text-muted"> · from {money(cheapest.total ?? 0)} for {daysBetween(from, to)} nights</span>
              </>
            ) : (
              <span className="font-medium text-danger">No room fits these dates. Try the grid below for open nights.</span>
            )}
          </p>
          <Link to={`/listing/${hotel.slug}?${stayQuery(from, to, guests, cheapest?.room.id)}#rooms`} className="btn btn-primary min-h-11 py-2">
            See rooms <ArrowRight />
          </Link>
        </div>
      </div>
    </article>
  )
}

function HotelsSection({ destination, hotels }: { destination: Destination; hotels: Listing[] }) {
  const navigate = useNavigate()
  const initial = suggestedStay(3)
  const [from, setFrom] = useState<ISODate>(initial.from)
  const [to, setTo] = useState<ISODate>(initial.to)
  const [pending, setPending] = useState<{ from: ISODate | null; to: ISODate | null }>({ from: null, to: null })
  const [guests, setGuests] = useState(2)
  const nights = daysBetween(from, to)

  const rows: GridRow[] = hotels.map((hotel) => ({
    key: hotel.slug,
    label: hotel.name,
    sub: `${'★'.repeat(hotel.stars ?? 0)} · cheapest room`,
    cell: (iso) => {
      const open = (hotel.rooms ?? [])
        .filter((r) => r.guests >= guests)
        .map((r) => ({ left: roomsLeft(hotel, r, iso), price: seasonalPrice(hotel.destination, r.price, iso) }))
        .filter((r) => r.left > 0)
      if (!open.length) return null
      return { price: Math.min(...open.map((r) => r.price)), left: open.reduce((s, r) => s + r.left, 0) }
    },
  }))

  return (
    <section id="hotels" aria-labelledby="hotels-heading" className="gutter scroll-mt-20 pb-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 border-t border-ink/15 pt-8">
        <div>
          <p className="eyebrow mb-3 text-majolica">Where to stay · live availability</p>
          <Lines as="h2" className="display text-[clamp(2.2rem,4.4vw,4rem)]" lines={[`${hotels.length} hotels in ${destination.name},`, <em key="open">open for your dates.</em>]} />
        </div>
        <div className="flex flex-wrap items-stretch gap-2 rounded-xl border border-ink/20 bg-white">
          <Popover
            label="Dates"
            value={`${formatRange(from, to)} · ${nights} nights`}
            align="right"
            width="lg:w-[42rem]"
            className="min-w-[15rem] [&>button]:min-h-14 [&>button]:py-2"
          >
            {(close) => (
              <>
                <Calendar
                  from={pending.from ?? from}
                  to={pending.from ? pending.to : to}
                  onChange={(f, t) => {
                    setPending({ from: f, to: t })
                    if (f && t) {
                      setFrom(f)
                      setTo(t)
                      setPending({ from: null, to: null })
                      close()
                    }
                  }}
                />
                <p className="mt-2 text-sm text-muted">Pick check-in, then checkout.</p>
              </>
            )}
          </Popover>
          <div className="flex items-center border-l border-ink/15 px-4">
            <Stepper label="Guests" value={guests} max={6} onChange={setGuests} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {hotels.map((hotel) => (
          <Reveal key={hotel.slug}>
            <HotelRow hotel={hotel} from={from} to={to} guests={guests} />
          </Reveal>
        ))}
      </div>

      <div className="mt-12">
        <h3 className="mb-1 text-[1.15rem] font-semibold">Two weeks at a glance</h3>
        <p className="mb-4 text-[0.95rem] text-muted">Cheapest room that fits {guests} {guests === 1 ? 'guest' : 'guests'}, night by night. Pick a night to start a stay there.</p>
        <AvailabilityGrid
          caption={`Nightly availability for hotels in ${destination.name}`}
          rows={rows}
          start={addDays(today(), 1)}
          onPick={(slug, iso) => {
            const hotel = hotels.find((h) => h.slug === slug)!
            navigate(`/listing/${slug}?${stayQuery(iso, addDays(iso, Math.max(hotel.minNights, 2)), guests)}#rooms`)
          }}
        />
      </div>
    </section>
  )
}

function ExperienceSlots({ experience }: { experience: Listing }) {
  const navigate = useNavigate()
  const [date, setDate] = useState<ISODate | null>(null)
  return (
    <article className="grid gap-5 overflow-hidden rounded-xl border border-ink/15 bg-white p-4 md:grid-cols-[14rem_1fr] md:p-5">
      <Link to={`/listing/${experience.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-lg md:aspect-auto">
        <Img name={experience.images[0]} alt={experience.name} sizes="(min-width: 768px) 14rem, 100vw" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105" />
      </Link>
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="display text-[1.7rem] leading-tight">
            <Link to={`/listing/${experience.slug}`} className="hover:text-majolica">
              {experience.name}
            </Link>
          </h3>
          <p className="text-sm text-muted">
            {experience.facts[0]?.value} · from {money(experience.price)} per person
          </p>
        </div>
        <SlotPicker
          listing={experience}
          date={date}
          slot={null}
          guests={2}
          days={8}
          onChange={(d, slot) => {
            setDate(d)
            if (slot) navigate(`/listing/${experience.slug}?from=${d}&slot=${slot}&guests=2`)
          }}
        />
      </div>
    </article>
  )
}

export default function DestinationPage() {
  const { slug } = useParams()
  const destination = slug ? destinationBySlug(slug) : undefined
  const hero = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], reduced ? ['0%', '0%'] : ['0%', '22%'])

  if (!destination) return <NotFound />

  const here = listingsIn(destination.slug)
  const hotels = here.filter((l) => l.kind === 'stay')
  const experiences = here.filter((l) => l.kind === 'experience')
  const yachts = here.filter((l) => l.kind === 'yacht')
  const nextDestination = destinations[(destinations.indexOf(destination) + 1) % destinations.length]
  const facts = [
    { label: 'Fly into', value: destination.airport },
    { label: 'Currency', value: destination.currency },
    { label: 'Language', value: destination.language },
    { label: 'Time zone', value: destination.utc },
    ...(destination.unesco ? [{ label: 'UNESCO', value: destination.unesco }] : []),
  ]

  return (
    <div key={destination.slug}>
      <section ref={hero} className="on-dark relative h-[86svh] min-h-[520px] overflow-hidden bg-ink text-white lg:h-svh">
        <motion.div className="absolute inset-0" style={{ y }}>
          <Img
            name={destination.images[0]}
            alt=""
            priority
            className="absolute inset-0 h-full w-full object-cover"
            style={reduced || destination.film ? undefined : { animation: 'ken-burns 14s ease-out forwards' }}
          />
          {destination.film && <LoopVideo name={destination.film} className="absolute inset-0 h-full w-full object-cover" />}
        </motion.div>
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-ink/40" />
        <div className="gutter absolute inset-x-0 bottom-0 pb-12">
          <motion.p className="eyebrow mb-4 text-limone" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}>
            {destination.country === destination.name ? destination.region : destination.country}
          </motion.p>
          <h1 className="display overflow-hidden pb-[0.2em] text-[clamp(3.3rem,12vw,12rem)] leading-[0.95]">
            <motion.span className="block" initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}>
              {destination.name}
            </motion.span>
          </h1>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <p className="display mt-3 max-w-3xl text-[clamp(1.4rem,2.6vw,2.2rem)] italic">{destination.tagline}</p>
            {hotels.length > 0 && (
              <a href="#hotels" className="btn btn-limone">
                Check availability <ArrowRight />
              </a>
            )}
          </div>
        </div>
      </section>

      <section aria-label={`About ${destination.name}`} className="gutter grid gap-12 py-20 lg:grid-cols-[1.4fr_1fr] lg:gap-20 lg:py-24">
        <Reveal>
          <p className="display text-[clamp(1.8rem,3.2vw,3rem)] leading-[1.15]">{destination.blurb}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <dl className="divide-y divide-ink/15 border-y border-ink/15">
            {facts.map((f) => (
              <div key={f.label} className="flex justify-between gap-6 py-3.5">
                <dt className="text-muted">{f.label}</dt>
                <dd className="text-right font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      <section aria-label={`Photos of ${destination.name}`} className="gutter grid grid-cols-2 gap-4 pb-20 md:gap-6 lg:grid-cols-3">
        <ClipReveal className="col-span-2 aspect-[16/10] rounded-sm">
          <Img name={destination.images[1]} alt={destination.name} sizes="(min-width: 1024px) 66vw, 100vw" className="h-full w-full object-cover" />
        </ClipReveal>
        <ClipReveal className="col-span-2 aspect-[16/10] rounded-sm lg:col-span-1 lg:aspect-auto" delay={0.1}>
          <Img name={destination.images[2]} alt={destination.name} sizes="(min-width: 1024px) 33vw, 100vw" className="h-full w-full object-cover" />
        </ClipReveal>
      </section>

      {hotels.length > 0 && <HotelsSection destination={destination} hotels={hotels} />}

      {experiences.length > 0 && (
        <section aria-labelledby="slots-heading" className="gutter pb-24">
          <div className="mb-8 border-t border-ink/15 pt-8">
            <p className="eyebrow mb-3 text-majolica">Things to do · time slots</p>
            <h2 id="slots-heading" className="display text-[clamp(2.2rem,4.4vw,4rem)]">
              Pick a day, <em>pick a time.</em>
            </h2>
          </div>
          <div className="space-y-4">
            {experiences.map((e) => (
              <ExperienceSlots key={e.slug} experience={e} />
            ))}
          </div>
        </section>
      )}

      <section aria-label="When to go" className="gutter pb-20">
        <h2 className="eyebrow mb-5 text-majolica">When to go</h2>
        <ul className="grid grid-cols-6 gap-1 md:grid-cols-12">
          {monthNames.map((m, i) => {
            const best = destination.bestMonths.includes(i)
            return (
              <li key={m} className={`rounded-sm py-4 text-center text-[0.95rem] font-medium ${best ? 'bg-majolica text-white' : 'bg-paper-2 text-muted'}`}>
                {m}
                <span className="sr-only">{best ? ', best time to visit' : ''}</span>
              </li>
            )
          })}
        </ul>
        <p className="mt-4 max-w-2xl text-[1.05rem]">{destination.seasonNote}</p>
      </section>

      {yachts.length > 0 && (
        <section aria-label={`Yachts in ${destination.name}`} className="gutter pb-24">
          <h2 className="display mb-10 border-t border-ink/15 pt-8 text-[clamp(2.2rem,4vw,3.6rem)]">
            Or see it <em>from the water.</em>
          </h2>
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {yachts.map((listing) => (
              <ListingCard key={listing.slug} listing={listing} />
            ))}
          </div>
        </section>
      )}

      <Link to={`/destinations/${nextDestination.slug}`} className="on-dark group relative block h-[58svh] min-h-[380px] overflow-hidden text-white">
        <Img name={nextDestination.images[0]} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] ease-out-soft group-hover:scale-105" />
        <div aria-hidden="true" className="absolute inset-0 bg-ink/45" />
        <div className="gutter absolute inset-x-0 bottom-10 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-3 text-limone">Next destination</p>
            <p className="display text-[clamp(3rem,9vw,8rem)]">{nextDestination.name}</p>
          </div>
          <ArrowRight className="mb-5 h-9 w-9 shrink-0 transition-transform duration-500 group-hover:translate-x-2" />
        </div>
      </Link>
    </div>
  )
}
