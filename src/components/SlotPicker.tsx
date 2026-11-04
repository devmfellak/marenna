import type { Listing } from '../data/listings'
import { isBooked, money, seasonalPrice, seatsLeft } from '../lib/booking'
import { addDays, fromISO, today, type ISODate } from '../lib/dates'

/** A row of upcoming days, then the departures on the chosen day with the seats still free. */
export default function SlotPicker({
  listing,
  date,
  slot,
  guests,
  onChange,
  days = 10,
  start = addDays(today(), 1),
  compact = false,
}: {
  listing: Listing
  date: ISODate | null
  slot: string | null
  guests: number
  onChange: (date: ISODate, slot: string | null) => void
  days?: number
  start?: ISODate
  compact?: boolean
}) {
  const dates = Array.from({ length: days }, (_, i) => addDays(start, i))
  const active = date ?? dates.find((d) => !isBooked(listing, d)) ?? dates[0]

  return (
    <div>
      <div data-lenis-prevent className="no-bar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Choose a day">
        {dates.map((iso) => {
          const d = fromISO(iso)
          const full = isBooked(listing, iso)
          const selected = iso === active
          return (
            <button
              key={iso}
              type="button"
              disabled={full}
              aria-pressed={selected}
              onClick={() => onChange(iso, null)}
              className={`flex min-w-[3.6rem] shrink-0 flex-col items-center rounded-lg border px-2 py-2 transition-colors disabled:opacity-35 ${
                selected ? 'border-majolica bg-majolica text-white' : 'border-ink/15 bg-white hover:border-ink'
              }`}
            >
              <span className={`text-[0.68rem] uppercase tracking-wider ${selected ? 'text-white/80' : 'text-muted'}`}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
              <span className="text-lg font-semibold tabular-nums leading-tight">{d.getDate()}</span>
              <span className={`text-[0.68rem] ${selected ? 'text-white/80' : 'text-muted'}`}>{full ? 'Full' : d.toLocaleDateString('en-US', { month: 'short' })}</span>
            </button>
          )
        })}
      </div>
      <div className={`mt-3 grid gap-2 ${compact ? '' : 'sm:grid-cols-2'}`} role="radiogroup" aria-label="Choose a time">
        {(listing.slots ?? []).map((s) => {
          const left = seatsLeft(listing, active, s.time)
          const tooFew = left < guests
          const selected = slot === s.time && date === active
          return (
            <button
              key={s.time}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={tooFew}
              onClick={() => onChange(active, s.time)}
              className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                selected ? 'border-majolica bg-majolica/[0.07] ring-1 ring-majolica' : 'border-ink/15 bg-white hover:border-ink'
              }`}
            >
              <span>
                <span className="block text-lg font-semibold tabular-nums">{s.time}</span>
                <span className="block text-sm text-muted">{s.label}</span>
              </span>
              <span className="text-right">
                <span className="block text-sm font-semibold tabular-nums">{money(seasonalPrice(listing.destination, listing.price, active))}</span>
                <span className={`block text-xs ${left === 0 ? 'text-danger' : left <= 3 ? 'font-semibold text-ink' : 'text-muted'}`}>
                  {left === 0 ? 'Sold out' : tooFew ? `Only ${left} left` : `${left} ${left === 1 ? 'seat' : 'seats'} left`}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
