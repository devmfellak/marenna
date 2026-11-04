import type { Listing, Room } from '../data/listings'
import { money, quote, roomsLeftForStay } from '../lib/booking'
import { daysBetween, type ISODate } from '../lib/dates'
import { Check } from './Icons'

export type RoomStatus = { room: Room; left: number | null; total: number | null; fits: boolean }

/** Each room type's state for a stay: rooms left on every night and the total, or null without dates. */
export function roomStatuses(listing: Listing, from: ISODate | null, to: ISODate | null, guests: number): RoomStatus[] {
  const dated = from && to && daysBetween(from, to) > 0
  return (listing.rooms ?? []).map((room) => ({
    room,
    fits: room.guests >= guests,
    left: dated ? roomsLeftForStay(listing, room, from, to) : null,
    total: dated ? quote(listing, from, to, guests, { room }).total : null,
  }))
}

export default function RoomList({
  listing,
  from,
  to,
  guests,
  selected,
  onSelect,
}: {
  listing: Listing
  from: ISODate | null
  to: ISODate | null
  guests: number
  selected: string | null
  onSelect: (room: string) => void
}) {
  const statuses = roomStatuses(listing, from, to, guests)
  const nights = from && to ? daysBetween(from, to) : 0

  return (
    <ul className="space-y-3">
      {statuses.map(({ room, left, total, fits }) => {
        const soldOut = left === 0
        const available = fits && !soldOut
        const isSelected = selected === room.id
        return (
          <li key={room.id}>
            <div
              className={`grid gap-4 rounded-xl border bg-white p-5 transition-colors sm:grid-cols-[1fr_auto] sm:items-center ${
                isSelected ? 'border-majolica ring-1 ring-majolica' : 'border-ink/15'
              }`}
            >
              <div className="min-w-0">
                <p className="display text-[1.55rem] leading-tight">{room.name}</p>
                <p className="mt-1 text-[0.95rem] text-muted">
                  {room.size} m² · {room.beds} · up to {room.guests} {room.guests === 1 ? 'guest' : 'guests'}
                </p>
                <p className="mt-2 text-sm">
                  {!fits ? (
                    <span className="text-muted">Too small for {guests} guests</span>
                  ) : left === null ? (
                    <span className="text-muted">Choose dates to check availability</span>
                  ) : soldOut ? (
                    <span className="font-medium text-danger">Sold out on at least one night</span>
                  ) : left <= 2 ? (
                    <span className="rounded-full bg-limone px-2.5 py-1 font-semibold">Only {left} left for these dates</span>
                  ) : (
                    <span className="font-medium text-majolica">{left} rooms available</span>
                  )}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                <p className="text-right">
                  {total !== null && available ? (
                    <>
                      <span className="block text-lg font-semibold tabular-nums">{money(total)}</span>
                      <span className="block text-xs text-muted">
                        {nights} {nights === 1 ? 'night' : 'nights'}, fees included
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="block text-lg font-semibold tabular-nums">{money(room.price)}</span>
                      <span className="block text-xs text-muted">per night from</span>
                    </>
                  )}
                </p>
                <button
                  type="button"
                  disabled={!available}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(room.id)}
                  className={`btn min-h-11 py-2 disabled:bg-ink/10 disabled:text-ink/45 ${isSelected ? 'btn-primary' : 'btn-line'}`}
                >
                  {isSelected ? (
                    <>
                      <Check /> Selected
                    </>
                  ) : (
                    'Select'
                  )}
                </button>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
