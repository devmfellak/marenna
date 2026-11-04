import { useNavigate } from 'react-router-dom'
import { unitLabels, type Listing } from '../data/listings'
import { checkBooking, isBooked, lastCheckout, money, problemText, quote, seasonLabels } from '../lib/booking'
import { addDays, formatDate, type ISODate } from '../lib/dates'
import { selectionQuery, type Selection } from '../lib/selection'
import Calendar from './Calendar'
import { ArrowRight, Star } from './Icons'
import { Stepper } from './SearchDock'
import SlotPicker from './SlotPicker'

export default function BookingPanel({
  listing,
  selection,
  onChange,
}: {
  listing: Listing
  selection: Selection
  onChange: (patch: Partial<Selection>) => void
}) {
  const navigate = useNavigate()
  const { from, to, guests } = selection
  const isExperience = listing.kind === 'experience'
  const room = listing.rooms?.find((r) => r.id === selection.room) ?? null
  const choice = { room, slot: selection.slot }

  const problem = checkBooking(listing, from, to, guests, choice)
  const q = from && !problem ? quote(listing, from, to, guests, choice) : null

  const isDisabled = (iso: ISODate, pending: ISODate | null) => {
    if (pending && iso > pending) {
      return iso < addDays(pending, Math.max(listing.minNights, 1)) || iso > lastCheckout(listing, pending)
    }
    return isBooked(listing, iso)
  }

  const reserve = () => {
    if (!q) return
    navigate(`/checkout/${listing.slug}?${selectionQuery(selection)}`)
  }

  const prompt = !isExperience && from && !to ? 'Now choose your checkout date.' : problem ? problemText[problem] : null
  const action = isExperience ? 'Reserve this time' : listing.kind === 'yacht' ? 'Request this charter' : 'Reserve this room'

  return (
    <div id="book" className="scroll-mt-24 rounded-xl border border-ink/15 bg-white p-5 shadow-[0_24px_60px_-34px_rgb(8_19_31/0.5)] md:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <p>
          <span className="text-sm text-muted">From </span>
          <span className="display text-[2rem] tabular-nums">{money(listing.price)}</span>
          <span className="text-muted"> / {unitLabels[listing.unit]}</span>
        </p>
        <p className="flex items-center gap-1 font-semibold tabular-nums">
          <Star className="h-4 w-4 text-majolica" />
          {listing.rating.toFixed(1)}
          <span className="font-normal text-muted">({listing.reviews})</span>
        </p>
      </div>

      {isExperience && listing.slots ? (
        <div className="mt-4 border-t border-ink/10 pt-4">
          <p className="mb-3 font-semibold">Pick a day and a time</p>
          <SlotPicker
            listing={listing}
            compact
            date={from}
            slot={selection.slot}
            guests={guests}
            onChange={(date, slot) => onChange({ from: date, slot })}
          />
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted">
            {listing.minNights} {listing.minNights === 1 ? 'night' : 'nights'} minimum. Struck-through nights are fully booked.
          </p>
          <div className="mt-4 border-t border-ink/10 pt-3">
            <Calendar
              months={1}
              from={from}
              to={to}
              isDisabled={isDisabled}
              onChange={(f, t) => onChange({ from: f, to: t })}
            />
          </div>
        </>
      )}

      <div className="mt-3 border-t border-ink/10 pt-4">
        <Stepper label="Guests" value={guests} max={room?.guests ?? listing.guests} onChange={(n) => onChange({ guests: n })} />
        <p className="mt-1 text-sm text-muted">Up to {room?.guests ?? listing.guests} on this booking.</p>
      </div>

      {listing.rooms && (
        <div className="mt-4 rounded-lg bg-paper-2 p-3 text-[0.95rem]">
          {room ? (
            <p>
              <span className="text-muted">Room: </span>
              <span className="font-semibold">{room.name}</span>
            </p>
          ) : (
            <a href="#rooms" className="font-medium text-majolica underline underline-offset-4">
              Choose a room type below
            </a>
          )}
        </div>
      )}

      {q && (
        <dl className="mt-4 space-y-1.5 border-t border-ink/10 pt-4 text-[0.95rem]">
          <p className="eyebrow mb-2 text-[0.66rem] text-majolica">
            {seasonLabels[q.season]} · {from && (isExperience ? `${formatDate(from, { weekday: 'short', month: 'short', day: 'numeric' })}, ${selection.slot}` : `${formatDate(from)} – ${formatDate(to!)}`)}
          </p>
          {q.lines.map((line) => (
            <div key={line.label} className="flex justify-between gap-4">
              <dt className="text-muted">{line.label}</dt>
              <dd className="tabular-nums">{money(line.amount)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Service fee</dt>
            <dd className="tabular-nums">{money(q.service)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Taxes</dt>
            <dd className="tabular-nums">{money(q.tax)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-ink/10 pt-2 text-[1.1rem] font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(q.total)}</dd>
          </div>
        </dl>
      )}

      {!q && prompt && (
        <p role="status" className="mt-4 text-[0.95rem] font-medium text-majolica">
          {prompt}
        </p>
      )}

      <button type="button" disabled={!q} onClick={reserve} className="btn btn-primary mt-4 w-full disabled:bg-ink/15 disabled:text-ink/50">
        {action} <ArrowRight />
      </button>
      <p className="mt-2 text-center text-sm text-muted">You won't be charged. This is a demo.</p>
    </div>
  )
}
