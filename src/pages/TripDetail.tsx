import { motion } from 'motion/react'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check } from '../components/Icons'
import { Img } from '../components/media'
import { destinationBySlug, placeName } from '../data/destinations'
import { listingBySlug } from '../data/listings'
import { buildIcs, extraCost, extrasFor, money } from '../lib/booking'
import { addDays, daysBetween, formatDate, today } from '../lib/dates'
import { cancelBooking, useStore } from '../lib/store'

export default function TripDetail() {
  const { code } = useParams()
  const [params] = useSearchParams()
  const { bookings } = useStore()
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const booking = bookings.find((b) => b.code === code)
  const listing = booking ? listingBySlug(booking.slug) : undefined

  if (!booking || !listing) {
    return (
      <div className="gutter pb-24 pt-[9rem]">
        <h1 className="display text-[clamp(2.8rem,6vw,5rem)]">
          We can't find <em>that booking.</em>
        </h1>
        <p className="mt-4 max-w-xl text-muted">Bookings are saved in the browser you made them in, so it may be on another device.</p>
        <Link to="/trips" className="btn btn-primary mt-7">
          Go to my trips
        </Link>
      </div>
    )
  }

  const destination = destinationBySlug(listing.destination)!
  const cancelled = booking.status === 'cancelled'
  const justBooked = params.get('new') === '1' && !cancelled
  const freeChangeEnds = addDays(booking.from, -14)
  const started = daysBetween(today(), booking.from) < 0
  const room = listing.rooms?.find((r) => r.id === booking.room)
  const slotLabel = listing.slots?.find((s) => s.time === booking.slot)?.label
  const chosen = extrasFor(listing).filter((e) => booking.extras.includes(e.id))

  const downloadIcs = () => {
    const ics = buildIcs({
      code: booking.code,
      title: `${listing.name}, Marenna`,
      location: placeName(destination),
      from: booking.from,
      to: booking.to,
      time: booking.slot,
      hours: listing.hours,
    })
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `marenna-${booking.code}.ics`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <section className="on-dark relative h-[62svh] min-h-[420px] overflow-hidden bg-ink text-white">
        <motion.div className="absolute inset-0" initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}>
          <Img name={listing.images[0]} alt="" priority className="h-full w-full object-cover" />
        </motion.div>
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-ink/40" />
        <div className="gutter absolute inset-x-0 bottom-0 pb-10">
          <p className={`eyebrow mb-3 flex items-center gap-2 ${cancelled ? 'text-white' : 'text-limone'}`} role="status">
            {!cancelled && <Check />}
            {cancelled ? 'Cancelled' : 'Confirmed'} · {booking.code}
          </p>
          <h1 className="display text-[clamp(2.8rem,7vw,6.4rem)]">
            {justBooked ? (
              <>
                You're going to <em>{destination.name}.</em>
              </>
            ) : (
              listing.name
            )}
          </h1>
        </div>
      </section>

      <div className="gutter grid gap-10 py-14 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
        <div>
          <dl className="divide-y divide-ink/15 border-y border-ink/15">
            {[
              { label: 'Booking', value: listing.name },
              { label: 'Where', value: placeName(destination) },
              { label: booking.to ? 'Arrive' : 'Date', value: formatDate(booking.from, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) },
              ...(booking.to ? [{ label: 'Leave', value: formatDate(booking.to, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) }] : []),
              ...(room ? [{ label: 'Room', value: `${room.name} (${room.size} m², ${room.beds})` }] : []),
              ...(booking.slot ? [{ label: 'Departure', value: `${booking.slot}${slotLabel ? `, ${slotLabel}` : ''}` }] : []),
              { label: 'Guests', value: String(booking.guests) },
              { label: 'Lead traveller', value: booking.traveller.name },
              { label: 'Contact email', value: booking.traveller.email },
              ...(chosen.length ? [{ label: 'Extras', value: chosen.map((e) => `${e.label} (${money(extraCost(e, booking.guests))})`).join(', ') }] : []),
              { label: 'Fly into', value: destination.airport },
            ].map((row) => (
              <div key={row.label} className="grid gap-1 py-3.5 sm:grid-cols-[11rem_1fr]">
                <dt className="text-muted">{row.label}</dt>
                <dd className="min-w-0 break-words font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-muted">Demo booking: no email has been sent and nothing has been charged.</p>
        </div>

        <aside aria-label="Payment and actions">
          <p className="eyebrow text-[0.68rem] text-majolica">Total</p>
          <p className="display mt-1 text-[3.4rem] tabular-nums">{money(booking.total)}</p>
          {booking.plan === 'deposit' && (
            <p className="text-[0.95rem] text-muted">
              {money(booking.dueNow)} deposit, then {money(booking.total - booking.dueNow)} 30 days before.
            </p>
          )}
          {!cancelled && freeChangeEnds >= today() && (
            <p className="mt-2 text-[0.95rem] text-muted">Free changes until {formatDate(freeChangeEnds, { month: 'long', day: 'numeric', year: 'numeric' })}.</p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            {!cancelled && (
              <button type="button" onClick={downloadIcs} className="btn btn-primary">
                Add to calendar
              </button>
            )}
            <Link to={`/destinations/${destination.slug}`} className="btn btn-line">
              Read about {destination.name} <ArrowRight />
            </Link>
            {!cancelled && !started &&
              (confirmingCancel ? (
                <div className="rounded-lg border border-danger/40 p-4" role="alert">
                  <p className="font-medium">Cancel this booking?</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn min-h-11 bg-danger py-2 text-white hover:opacity-90"
                      onClick={() => {
                        cancelBooking(booking.code)
                        setConfirmingCancel(false)
                      }}
                    >
                      Yes, cancel it
                    </button>
                    <button type="button" className="btn btn-line min-h-11 py-2" onClick={() => setConfirmingCancel(false)}>
                      Keep it
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmingCancel(true)} className="min-h-11 font-medium underline underline-offset-4">
                  Cancel this booking
                </button>
              ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
