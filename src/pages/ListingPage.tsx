import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AvailabilityGrid, { type GridRow } from '../components/AvailabilityGrid'
import BookingPanel from '../components/BookingPanel'
import RoomList from '../components/RoomList'
import { ArrowLeft, ArrowRight, Check, Pin, Star } from '../components/Icons'
import ListingCard, { SaveButton } from '../components/ListingCard'
import { Img, LoopVideo, imageUrl } from '../components/media'
import { ClipReveal, Reveal } from '../components/motion'
import { destinationBySlug, placeName } from '../data/destinations'
import { kindLabels, listingBySlug, listings, type Listing, unitLabels } from '../data/listings'
import { money, roomsLeft, seasonalPrice } from '../lib/booking'
import { addDays, formatDate, today } from '../lib/dates'
import { useSelection, type Selection } from '../lib/selection'
import NotFound from './NotFound'

function Gallery({ listing, location }: { listing: Listing; location: string }) {
  const reduced = useReducedMotion()
  const [viewport, api] = useEmblaCarousel({ loop: true, duration: 34 }, reduced ? [] : [Autoplay({ delay: 5500, stopOnInteraction: true })])
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (!api) return
    const sync = () => setSelected(api.selectedScrollSnap())
    sync()
    api.on('select', sync)
    return () => {
      api.off('select', sync)
    }
  }, [api])

  return (
    <section aria-roledescription="carousel" aria-label={`Photos of ${listing.name}`} className="on-dark relative h-[74svh] min-h-[480px] overflow-hidden bg-ink text-white lg:h-[92svh]">
      <div ref={viewport} className="h-full cursor-grab overflow-hidden active:cursor-grabbing">
        <div className="flex h-full">
          {listing.images.map((image, i) => (
            <div key={image} className="relative h-full w-full shrink-0" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${listing.images.length}`}>
              <Img
                name={image}
                alt={i === 0 ? `${listing.name}, ${location}` : `${listing.name}, photo ${i + 1}`}
                priority={i === 0}
                className="h-full w-full object-cover"
                style={i === selected && !reduced ? { animation: 'ken-burns 9s ease-out forwards' } : undefined}
              />
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-ink/40" />

      <div className="gutter pointer-events-none absolute inset-x-0 bottom-0 pb-7">
        <div className="flex items-end justify-between gap-6">
          <div className="min-w-0">
            <motion.p
              className="eyebrow mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-limone"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
            >
              <span>{kindLabels[listing.kind]}</span>
              <span className="flex items-center gap-1 normal-case tracking-normal text-white">
                <Pin className="h-4 w-4" /> {location}
              </span>
            </motion.p>
            <h1 className="display overflow-hidden pb-[0.2em] text-[clamp(2.9rem,8vw,7.5rem)]">
              <motion.span
                className="block"
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              >
                {listing.name}
              </motion.span>
            </h1>
            <p className="max-w-2xl text-[1.1rem] text-white/90">{listing.tagline}</p>
          </div>
          <div className="pointer-events-auto hidden shrink-0 items-center gap-2 md:flex">
            <span className="mr-2 text-sm tabular-nums">
              {selected + 1} / {listing.images.length}
            </span>
            <button type="button" aria-label="Previous photo" onClick={() => api?.scrollPrev()} className="grid h-12 w-12 place-items-center rounded-full border border-white/50 hover:bg-white hover:text-ink">
              <ArrowLeft />
            </button>
            <button type="button" aria-label="Next photo" onClick={() => api?.scrollNext()} className="grid h-12 w-12 place-items-center rounded-full border border-white/50 hover:bg-white hover:text-ink">
              <ArrowRight />
            </button>
          </div>
        </div>
        <div className="pointer-events-auto mt-5 hidden gap-2 sm:flex">
          {listing.images.map((image, i) => (
            <button
              key={image}
              type="button"
              onClick={() => api?.scrollTo(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === selected}
              className={`h-14 w-20 overflow-hidden rounded-sm border-2 transition-all ${i === selected ? 'border-limone' : 'border-transparent opacity-75 hover:opacity-100'}`}
            >
              <img src={imageUrl(image, 800)} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function ListingPage() {
  const { slug } = useParams()
  const listing = slug ? listingBySlug(slug) : undefined
  if (!listing) return <NotFound />
  return <ListingDetail key={listing.slug} listing={listing} />
}

function RoomsSection({ listing, selection, onChange }: { listing: Listing; selection: Selection; onChange: (patch: Partial<Selection>) => void }) {
  const nights = Math.max(listing.minNights, 1)
  const rows: GridRow[] = (listing.rooms ?? []).map((room) => ({
    key: room.id,
    label: room.name,
    sub: `${room.size} m² · sleeps ${room.guests}`,
    cell: (iso) => {
      const left = roomsLeft(listing, room, iso)
      return left > 0 && room.guests >= selection.guests ? { price: seasonalPrice(listing.destination, room.price, iso), left } : null
    },
  }))

  return (
    <section id="rooms" aria-labelledby="rooms-heading" className="mt-14 scroll-mt-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-t border-ink/15 pt-8">
        <div>
          <p className="eyebrow mb-2 text-majolica">Live availability</p>
          <h2 id="rooms-heading" className="display text-[clamp(2rem,3.4vw,3rem)]">
            Rooms <em>and dates</em>
          </h2>
        </div>
        <p className="text-[0.95rem] text-muted">
          {selection.from && selection.to
            ? `${formatDate(selection.from)} – ${formatDate(selection.to)} · ${selection.guests} ${selection.guests === 1 ? 'guest' : 'guests'}`
            : 'Pick a night below, or choose dates in the panel.'}
        </p>
      </div>
      <AvailabilityGrid
        caption={`Nightly availability for each room type at ${listing.name}`}
        rows={rows}
        start={selection.from ?? addDays(today(), 1)}
        selected={{ row: selection.room, from: selection.from, to: selection.to }}
        onPick={(room, iso) => onChange({ room, from: iso, to: addDays(iso, nights) })}
      />
      <div className="mt-8">
        <RoomList
          listing={listing}
          from={selection.from}
          to={selection.to}
          guests={selection.guests}
          selected={selection.room}
          onSelect={(room) => {
            onChange({ room })
            if (window.matchMedia('(max-width: 1023px)').matches) document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' })
          }}
        />
      </div>
    </section>
  )
}

function ListingDetail({ listing }: { listing: Listing }) {
  const [selection, update] = useSelection(listing)
  const destination = destinationBySlug(listing.destination)!
  const location = placeName(destination)
  const related = listings
    .filter((l) => l.slug !== listing.slug && (l.destination === listing.destination || l.kind === listing.kind))
    .sort((a, b) => Number(b.destination === listing.destination) - Number(a.destination === listing.destination))
    .slice(0, 3)

  return (
    <div key={listing.slug}>
      <Gallery listing={listing} location={location} />

      <div className="gutter grid gap-12 pb-24 pt-12 lg:grid-cols-[minmax(0,1fr)_25.5rem] lg:gap-16 lg:pt-16">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/15 pb-6">
            <p className="flex items-center gap-1.5 font-medium">
              <Star className="h-4 w-4 text-majolica" />
              <span className="tabular-nums">{listing.rating.toFixed(1)}</span>
              <span className="text-muted">· {listing.reviews} reviews</span>
            </p>
            <div className="flex items-center gap-3">
              <span className="text-[0.95rem] font-medium">Save to my trips</span>
              <SaveButton slug={listing.slug} name={listing.name} className="border border-ink/20" />
            </div>
          </div>

          <Reveal>
            <p className="display mt-10 text-[clamp(1.7rem,3vw,2.6rem)] leading-[1.18]">{listing.description}</p>
          </Reveal>

          <dl className="mt-12 grid gap-6 border-y border-ink/15 py-7 sm:grid-cols-3">
            {listing.facts.map((f) => (
              <div key={f.label}>
                <dt className="eyebrow text-[0.68rem] text-muted">{f.label}</dt>
                <dd className="display mt-1.5 text-[1.5rem] leading-tight">{f.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-12 grid gap-10 sm:grid-cols-2">
            <div>
              <h2 className="eyebrow mb-4 text-majolica">Why it's special</h2>
              <ul className="space-y-3">
                {listing.highlights.map((h) => (
                  <li key={h} className="flex gap-3">
                    <Check className="mt-0.5 shrink-0 text-majolica" /> {h}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="eyebrow mb-4 text-majolica">Included</h2>
              <ul className="space-y-3">
                {listing.included.map((h) => (
                  <li key={h} className="flex gap-3">
                    <Check className="mt-0.5 shrink-0 text-majolica" /> {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {listing.rooms && <RoomsSection listing={listing} selection={selection} onChange={update} />}

          {listing.film && (
            <ClipReveal className="mt-14 aspect-video rounded-sm">
              <LoopVideo name={listing.film} className="h-full w-full object-cover" />
            </ClipReveal>
          )}

          <Reveal className="mt-14">
            <Link to={`/destinations/${destination.slug}`} className="group grid items-center gap-5 rounded-sm bg-paper-2 p-4 sm:grid-cols-[10rem_1fr_auto]">
              <div className="aspect-[4/3] overflow-hidden rounded-sm">
                <Img name={destination.images[0]} alt="" sizes="160px" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              </div>
              <div>
                <p className="eyebrow text-[0.68rem] text-majolica">About the destination</p>
                <p className="display mt-1 text-[1.7rem]">{destination.name}</p>
                <p className="mt-1 text-[0.95rem] text-muted">{destination.seasonNote}</p>
              </div>
              <ArrowRight className="mr-2 hidden transition-transform group-hover:translate-x-1 sm:block" />
            </Link>
          </Reveal>
        </div>

        <aside aria-label="Book" className="lg:sticky lg:top-24 lg:self-start">
          <BookingPanel listing={listing} selection={selection} onChange={update} />
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-label="You may also like" className="gutter border-t border-ink/15 py-20">
          <h2 className="display mb-10 text-[clamp(2.2rem,4vw,3.6rem)]">
            While you're <em>dreaming.</em>
          </h2>
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((l) => (
              <ListingCard key={l.slug} listing={l} />
            ))}
          </div>
        </section>
      )}

      {/* Keeps the price and a route to the panel in reach on phones. */}
      <div className="sticky bottom-0 z-30 flex items-center justify-between gap-4 border-t border-ink/15 bg-paper/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <p>
          <span className="font-semibold tabular-nums">{money(listing.price)}</span>
          <span className="text-muted"> / {unitLabels[listing.unit]}</span>
        </p>
        <a href="#book" className="btn btn-primary min-h-11 py-2">
          {listing.kind === 'experience' ? 'Choose a time' : 'Choose dates'}
        </a>
      </div>
    </div>
  )
}
