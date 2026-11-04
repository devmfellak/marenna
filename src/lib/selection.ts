import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Listing } from '../data/listings'
import { addDays, fromISO, isISODate, today, type ISODate } from './dates'

/** Everything a guest has picked on a listing page, shared by the panel, rooms list and grid. */
export type Selection = {
  from: ISODate | null
  to: ISODate | null
  guests: number
  room: string | null
  slot: string | null
}

/** A sensible first stay to show availability for: the Friday after next. */
export function suggestedStay(nights = 3): { from: ISODate; to: ISODate } {
  let from = addDays(today(), 10)
  while (fromISO(from).getDay() !== 5) from = addDays(from, 1)
  return { from, to: addDays(from, Math.max(nights, 1)) }
}

/** Selection seeded from the URL, so links from search, destinations and checkout keep their choices. */
export function useSelection(listing: Listing) {
  const [params] = useSearchParams()
  const [selection, setSelection] = useState<Selection>(() => {
    const from = params.get('from')
    const to = params.get('to')
    const guests = Number(params.get('guests'))
    const room = params.get('room')
    const slot = params.get('slot')
    return {
      from: isISODate(from) && from >= today() ? from : null,
      to: listing.kind !== 'experience' && isISODate(to) ? to : null,
      guests: Number.isInteger(guests) && guests > 0 ? Math.min(guests, listing.guests) : Math.min(2, listing.guests),
      room: listing.rooms?.some((r) => r.id === room) ? room : null,
      slot: listing.slots?.some((s) => s.time === slot) ? slot : null,
    }
  })
  const update = (patch: Partial<Selection>) => setSelection((s) => ({ ...s, ...patch }))
  return [selection, update] as const
}

export const selectionQuery = (s: Selection) => {
  const q = new URLSearchParams()
  if (s.from) q.set('from', s.from)
  if (s.to) q.set('to', s.to)
  q.set('guests', String(s.guests))
  if (s.room) q.set('room', s.room)
  if (s.slot) q.set('slot', s.slot)
  return q.toString()
}
