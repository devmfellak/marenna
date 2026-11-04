import { Link } from 'react-router-dom'
import { ArrowRight } from '../components/Icons'
import ListingCard from '../components/ListingCard'
import { Img } from '../components/media'
import { Lines } from '../components/motion'
import { destinationBySlug } from '../data/destinations'
import { listingBySlug } from '../data/listings'
import { money } from '../lib/booking'
import { formatRange } from '../lib/dates'
import { useStore } from '../lib/store'

export default function Trips() {
  const { saved, bookings } = useStore()
  const savedListings = saved.flatMap((slug) => listingBySlug(slug) ?? [])

  return (
    <div className="gutter pb-24 pt-[4.5rem]">
      <header className="pb-10 pt-12 lg:pt-16">
        <p className="eyebrow mb-4 text-majolica">My trips</p>
        <Lines as="h1" className="display text-[clamp(3rem,8vw,7rem)]" lines={['Booked, and', <em key="dreamed">dreamed about.</em>]} />
        <p className="mt-5 max-w-xl text-muted">Everything here is saved in this browser only.</p>
      </header>

      <section aria-labelledby="booked-heading" className="border-t border-ink/15 pt-8">
        <h2 id="booked-heading" className="display mb-6 text-[2.4rem]">
          Booked
        </h2>
        {bookings.length === 0 ? (
          <p className="text-muted">
            Nothing booked yet.{' '}
            <Link to="/explore" className="link-line font-medium text-ink">
              Find something to look forward to
            </Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {bookings.map((booking) => {
              const listing = listingBySlug(booking.slug)
              if (!listing) return null
              const destination = destinationBySlug(listing.destination)!
              return (
                <li key={booking.code}>
                  <Link
                    to={`/trips/${booking.code}`}
                    className={`group grid items-center gap-4 rounded-lg border border-ink/15 bg-white p-3 sm:grid-cols-[8rem_1fr_auto] ${booking.status === 'cancelled' ? 'opacity-60' : ''}`}
                  >
                    <div className="aspect-[4/3] overflow-hidden rounded-sm">
                      <Img name={listing.images[0]} alt="" sizes="128px" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="eyebrow text-[0.66rem] text-majolica">
                        {booking.status === 'cancelled' ? 'Cancelled' : 'Confirmed'} · {booking.code}
                      </p>
                      <p className="display mt-1 text-[1.6rem] leading-tight">{listing.name}</p>
                      <p className="text-[0.95rem] text-muted">
                        {destination.name} · {formatRange(booking.from, booking.to)} · {money(booking.total)}
                      </p>
                    </div>
                    <ArrowRight className="mr-3 hidden transition-transform group-hover:translate-x-1 sm:block" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="saved-heading" className="mt-16 border-t border-ink/15 pt-8">
        <h2 id="saved-heading" className="display mb-6 text-[2.4rem]">
          Moodboard
        </h2>
        {savedListings.length === 0 ? (
          <p className="text-muted">Tap the heart on anything you like and it will collect here.</p>
        ) : (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {savedListings.map((listing) => (
              <ListingCard key={listing.slug} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
