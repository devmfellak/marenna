import { destinationBySlug } from '../data/destinations'
import type { Listing, Room } from '../data/listings'
import { addDays, daysBetween, eachDay, fromISO, today, toISO, type ISODate } from './dates'

export const SERVICE_RATE = 0.06
export const TAX_RATE = 0.09
export const DEPOSIT_RATE = 0.3

export type Season = 'peak' | 'mid' | 'low'

const seasonFactor: Record<Season, number> = { peak: 1.18, mid: 1, low: 0.86 }

export const seasonLabels: Record<Season, string> = { peak: 'Peak season', mid: 'Shoulder season', low: 'Low season' }

export function seasonOf(destinationSlug: string, iso: ISODate): Season {
  const best = destinationBySlug(destinationSlug)?.bestMonths ?? []
  const month = fromISO(iso).getMonth()
  if (best.includes(month)) return 'peak'
  if (best.includes((month + 1) % 12) || best.includes((month + 11) % 12)) return 'mid'
  return 'low'
}

/** Nightly or per-person price for one date, after the seasonal adjustment. */
export const seasonalPrice = (destinationSlug: string, base: number, iso: ISODate) =>
  Math.round(base * seasonFactor[seasonOf(destinationSlug, iso)])

const hash = (text: string) => {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/*
 * Demo availability. Every figure here comes from hashing the listing, room or departure with the
 * date, so a visitor sees the same rooms left and seats left on every visit. A real backend would
 * replace roomsLeft, seatsLeft and the yacht calendar in isBooked.
 */

/** Rooms of one type still free on a night. Weekends and peak season fill up first. */
export function roomsLeft(listing: Listing, room: Room, iso: ISODate): number {
  const day = fromISO(iso).getDay()
  const pressure = (day === 5 || day === 6 ? 16 : 0) + (seasonOf(listing.destination, iso) === 'peak' ? 12 : 0)
  const roll = (hash(`${listing.slug}:${room.id}:${iso}`) % 100) + pressure
  const taken = Math.floor((roll / 130) * (room.inventory + 1))
  return Math.max(0, room.inventory - taken)
}

/** Rooms of one type that stay free for every night of a stay. */
export const roomsLeftForStay = (listing: Listing, room: Room, from: ISODate, to: ISODate) =>
  Math.min(...eachDay(from, to).map((d) => roomsLeft(listing, room, d)))

/** Room types that fit the party and are free for the whole stay, cheapest first. */
export const availableRooms = (listing: Listing, from: ISODate, to: ISODate, guests: number) =>
  (listing.rooms ?? [])
    .filter((room) => room.guests >= guests && roomsLeftForStay(listing, room, from, to) > 0)
    .sort((a, b) => a.price - b.price)

/** Seats still free at one departure time. */
export function seatsLeft(listing: Listing, iso: ISODate, time: string): number {
  const slot = listing.slots?.find((s) => s.time === time)
  if (!slot) return 0
  const roll = hash(`${listing.slug}:${iso}:${time}`) % 100
  const taken = Math.floor((roll / 112) * (slot.seats + 1))
  return Math.max(0, slot.seats - taken)
}

/** True when nothing can be booked that day: every room, or every departure, is full. */
export function isBooked(listing: Listing, iso: ISODate): boolean {
  if (listing.rooms?.length) return listing.rooms.every((room) => roomsLeft(listing, room, iso) === 0)
  if (listing.slots?.length) return listing.slots.every((slot) => seatsLeft(listing, iso, slot.time) === 0)
  // Yachts take one charter at a time, so they are booked out in whole stretches.
  const day = (fromISO(iso).getDay() + 6) % 7
  const weekIndex = Math.floor(daysBetween('2024-01-01', iso) / 7)
  const roll = hash(`${listing.slug}:${weekIndex}`) % 100
  if (roll >= 26) return false
  const start = roll % 5
  return day >= start && day < start + 3 + (roll % 3)
}

export const isSelectable = (listing: Listing, iso: ISODate) => iso >= today() && !isBooked(listing, iso)

export const rangeIsFree = (listing: Listing, from: ISODate, to: ISODate) =>
  eachDay(from, to).every((d) => !isBooked(listing, d))

/** Latest checkout reachable from `from` before running into a fully booked night. */
export function lastCheckout(listing: Listing, from: ISODate, horizon = 60): ISODate {
  let last = from
  for (let i = 0; i < horizon; i++) {
    if (isBooked(listing, last)) return last
    last = addDays(last, 1)
  }
  return last
}

/** Whether a listing can take this party on these dates, in any room or at any time. */
export function canHost(listing: Listing, from: ISODate, to: ISODate | null, guests: number) {
  if (guests > listing.guests) return false
  if (listing.kind === 'experience' || !to) {
    if (!listing.slots?.length) return !isBooked(listing, from)
    return listing.slots.some((s) => seatsLeft(listing, from, s.time) >= guests)
  }
  if (listing.rooms?.length) return availableRooms(listing, from, to, guests).length > 0
  return rangeIsFree(listing, from, to)
}

export type Quote = {
  season: Season
  nights: number
  guests: number
  lines: { label: string; amount: number }[]
  subtotal: number
  service: number
  tax: number
  total: number
}

/** What the guest picked inside a listing: a room type at a hotel, a departure time for an experience. */
export type Choice = { room?: Room | null; slot?: string | null }

export type QuoteProblem =
  | 'missing-dates'
  | 'too-short'
  | 'unavailable'
  | 'too-many-guests'
  | 'in-past'
  | 'choose-room'
  | 'room-unavailable'
  | 'choose-slot'
  | 'slot-full'

export function checkBooking(
  listing: Listing,
  from: ISODate | null,
  to: ISODate | null,
  guests: number,
  choice: Choice = {},
): QuoteProblem | null {
  if (guests > (choice.room?.guests ?? listing.guests)) return 'too-many-guests'
  if (!from || (listing.kind !== 'experience' && !to)) return 'missing-dates'
  if (from < today()) return 'in-past'
  if (listing.kind === 'experience') {
    if (isBooked(listing, from)) return 'unavailable'
    if (!listing.slots?.length) return null
    if (!choice.slot) return 'choose-slot'
    return seatsLeft(listing, from, choice.slot) >= guests ? null : 'slot-full'
  }
  if (daysBetween(from, to!) < Math.max(listing.minNights, 1)) return 'too-short'
  if (!rangeIsFree(listing, from, to!)) return 'unavailable'
  if (listing.rooms?.length) {
    if (!choice.room) return 'choose-room'
    if (roomsLeftForStay(listing, choice.room, from, to!) < 1) return 'room-unavailable'
  }
  return null
}

export const problemText: Record<QuoteProblem, string> = {
  'missing-dates': 'Choose your dates to see the total.',
  'too-short': 'Those dates are shorter than the minimum stay.',
  unavailable: 'Some of those dates are already booked.',
  'too-many-guests': 'That is more guests than this booking can take.',
  'in-past': 'Those dates have already passed.',
  'choose-room': 'Now pick a room to see the total.',
  'room-unavailable': 'That room is sold out on at least one of those nights.',
  'choose-slot': 'Now pick a time to see the total.',
  'slot-full': 'There are not enough seats left at that time.',
}

export function quote(listing: Listing, from: ISODate, to: ISODate | null, guests: number, choice: Choice = {}): Quote {
  const season = seasonOf(listing.destination, from)
  let lines: Quote['lines']
  let nights = 0

  if (listing.kind === 'experience') {
    const each = seasonalPrice(listing.destination, listing.price, from)
    const when = choice.slot ? `${choice.slot}, ` : ''
    lines = [{ label: `${when}$${each.toLocaleString('en-US')} × ${guests} ${guests === 1 ? 'guest' : 'guests'}`, amount: each * guests }]
  } else {
    const days = eachDay(from, to!)
    nights = days.length
    const base = choice.room?.price ?? listing.price
    const nightly = listing.unit === 'week' ? base / 7 : base
    const amount = days.reduce((sum, d) => sum + nightly * seasonFactor[seasonOf(listing.destination, d)], 0)
    const what = choice.room ? `${choice.room.name}, ` : ''
    lines = [{ label: `${what}${nights} ${nights === 1 ? 'night' : 'nights'}`, amount: Math.round(amount) }]
  }

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0)
  const service = Math.round(subtotal * SERVICE_RATE)
  const tax = Math.round((subtotal + service) * TAX_RATE)
  return { season, nights, guests, lines, subtotal, service, tax, total: subtotal + service + tax }
}

export const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

export type Extra = { id: string; label: string; detail: string; price: number; per: 'booking' | 'guest' }

const extrasByKind: Record<Listing['kind'], Extra[]> = {
  stay: [
    { id: 'transfer', label: 'Private airport transfer', detail: 'Meet and greet, both ways', price: 240, per: 'booking' },
    { id: 'dinner', label: 'Private dinner on arrival', detail: 'Four courses with wine pairing', price: 180, per: 'guest' },
    { id: 'insurance', label: 'Travel cover', detail: 'Medical, delays and cancellation', price: 65, per: 'guest' },
  ],
  yacht: [
    { id: 'apa', label: 'Pre-stocked provisions', detail: 'Your preference sheet, ready when you board', price: 4800, per: 'booking' },
    { id: 'heli', label: 'Helicopter transfer', detail: 'Airport to the dock', price: 3200, per: 'booking' },
    { id: 'insurance', label: 'Charter cover', detail: 'Cancellation and curtailment', price: 190, per: 'guest' },
  ],
  experience: [
    { id: 'photographer', label: 'Private photographer', detail: 'Edited gallery within 48 hours', price: 220, per: 'booking' },
    { id: 'pickup', label: 'Door-to-door transfer', detail: 'From your hotel, both ways', price: 60, per: 'booking' },
    { id: 'insurance', label: 'Activity cover', detail: 'Medical and weather cancellation', price: 18, per: 'guest' },
  ],
}

export const extrasFor = (listing: Listing) => extrasByKind[listing.kind]

export const extraCost = (extra: Extra, guests: number) => (extra.per === 'guest' ? extra.price * guests : extra.price)

/**
 * Booking calendar file for confirmations. Stays are all-day events, so DTEND is the day after the
 * last night. Experiences with a departure time become a timed event in local time.
 */
export function buildIcs(opts: {
  code: string
  title: string
  location: string
  from: ISODate
  to: ISODate | null
  time?: string | null
  hours?: number
}) {
  const fmt = (iso: ISODate) => iso.replaceAll('-', '')
  let when: string[]
  if (opts.time) {
    const [h, m] = opts.time.split(':').map(Number)
    const end = fromISO(opts.from)
    end.setHours(h, m + Math.round((opts.hours ?? 3) * 60))
    const pad = (n: number) => String(n).padStart(2, '0')
    when = [
      `DTSTART:${fmt(opts.from)}T${pad(h)}${pad(m)}00`,
      `DTEND:${fmt(toISO(end))}T${pad(end.getHours())}${pad(end.getMinutes())}00`,
    ]
  } else {
    when = [`DTSTART;VALUE=DATE:${fmt(opts.from)}`, `DTEND;VALUE=DATE:${fmt(opts.to ?? addDays(opts.from, 1))}`]
  }
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Marenna//Bookings//EN',
    'BEGIN:VEVENT',
    `UID:${opts.code}@marenna.example`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}`,
    ...when,
    `SUMMARY:${opts.title}`,
    `LOCATION:${opts.location}`,
    `DESCRIPTION:Marenna booking ${opts.code}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
