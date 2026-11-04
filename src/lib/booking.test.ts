import { describe, expect, it } from 'vitest'
import { destinations } from '../data/destinations'
import { listingBySlug, listings, type Listing } from '../data/listings'
import {
  availableRooms,
  buildIcs,
  canHost,
  checkBooking,
  extraCost,
  extrasFor,
  isBooked,
  lastCheckout,
  quote,
  rangeIsFree,
  roomsLeft,
  roomsLeftForStay,
  seasonOf,
  seatsLeft,
} from './booking'
import { addDays, daysBetween, eachDay, isISODate, monthGrid, today } from './dates'

const hotel = listingBySlug('casa-limonaia')!
const yacht = listingBySlug('my-aurelia')!
const balloon = listingBySlug('goreme-sunrise')!
const room = hotel.rooms![0]

/** First stay of `nights` nights, a month out, with the given room free on every night. */
function freeStay(listing: Listing, nights: number, r = listing.rooms?.[0]) {
  let from = addDays(today(), 30)
  for (let i = 0; i < 400; i++) {
    const to = addDays(from, nights)
    const ok = r ? roomsLeftForStay(listing, r, from, to) > 0 && rangeIsFree(listing, from, to) : rangeIsFree(listing, from, to)
    if (ok) return { from, to }
    from = addDays(from, 1)
  }
  throw new Error('no free stay found')
}

/** First day a month out with seats at the given departure. */
function freeDeparture(listing: Listing, time: string, seats = 1) {
  let day = addDays(today(), 30)
  while (seatsLeft(listing, day, time) < seats) day = addDays(day, 1)
  return day
}

describe('dates', () => {
  it('counts nights across month and daylight-saving boundaries', () => {
    expect(daysBetween('2027-03-27', '2027-03-29')).toBe(2)
    expect(daysBetween('2027-10-30', '2027-11-01')).toBe(2)
    expect(eachDay('2027-12-30', '2028-01-02')).toEqual(['2027-12-30', '2027-12-31', '2028-01-01'])
  })

  it('rejects impossible dates from URLs', () => {
    expect(isISODate('2027-02-30')).toBe(false)
    expect(isISODate('next tuesday')).toBe(false)
    expect(isISODate('2027-02-28')).toBe(true)
  })

  it('starts month grids on Monday', () => {
    // 1 November 2026 is a Sunday, so six blank cells lead in.
    const grid = monthGrid(2026, 10)
    expect(grid.slice(0, 6).every((c) => c === null)).toBe(true)
    expect(grid[6]).toBe('2026-11-01')
  })
})

describe('seasons', () => {
  it('uses the destination calendar', () => {
    expect(seasonOf('amalfi-coast', '2027-05-10')).toBe('peak')
    expect(seasonOf('amalfi-coast', '2027-04-10')).toBe('mid')
    expect(seasonOf('amalfi-coast', '2027-01-10')).toBe('low')
  })

  it('wraps across the new year', () => {
    expect(seasonOf('maldives', '2027-12-10')).toBe('peak')
    expect(seasonOf('maldives', '2027-11-10')).toBe('mid')
  })
})

describe('room availability', () => {
  it('never reports more rooms than the hotel has, or fewer than none', () => {
    for (const h of listings.filter((l) => l.rooms)) {
      for (const r of h.rooms!) {
        for (const d of eachDay(today(), addDays(today(), 60))) {
          const left = roomsLeft(h, r, d)
          expect(left).toBeGreaterThanOrEqual(0)
          expect(left).toBeLessThanOrEqual(r.inventory)
        }
      }
    }
  })

  it('is stable between calls', () => {
    const day = addDays(today(), 45)
    expect(roomsLeft(hotel, room, day)).toBe(roomsLeft(hotel, room, day))
  })

  it('takes the tightest night as the rooms left for a stay', () => {
    const { from, to } = freeStay(hotel, 3)
    const nightly = eachDay(from, to).map((d) => roomsLeft(hotel, room, d))
    expect(roomsLeftForStay(hotel, room, from, to)).toBe(Math.min(...nightly))
  })

  it('leaves every hotel bookable on most nights', () => {
    for (const h of listings.filter((l) => l.rooms)) {
      const days = eachDay(today(), addDays(today(), 90))
      const open = days.filter((d) => !isBooked(h, d)).length
      expect(open / days.length, h.slug).toBeGreaterThan(0.85)
    }
  })

  it('lists only rooms that fit the party and are free every night, cheapest first', () => {
    const { from, to } = freeStay(hotel, 2)
    const rooms = availableRooms(hotel, from, to, 3)
    expect(rooms.every((r) => r.guests >= 3 && roomsLeftForStay(hotel, r, from, to) > 0)).toBe(true)
    expect(rooms.map((r) => r.price)).toEqual([...rooms.map((r) => r.price)].sort((a, b) => a - b))
  })
})

describe('time slots', () => {
  it('keeps seats within each departure', () => {
    for (const e of listings.filter((l) => l.slots)) {
      for (const s of e.slots!) {
        for (const d of eachDay(today(), addDays(today(), 30))) {
          const left = seatsLeft(e, d, s.time)
          expect(left).toBeGreaterThanOrEqual(0)
          expect(left).toBeLessThanOrEqual(s.seats)
        }
      }
    }
  })

  it('returns no seats for a time that does not exist', () => {
    expect(seatsLeft(balloon, addDays(today(), 5), '23:59')).toBe(0)
  })
})

describe('booking checks', () => {
  it('asks for a room once a hotel stay has valid dates', () => {
    const { from, to } = freeStay(hotel, hotel.minNights)
    expect(checkBooking(hotel, from, to, 2)).toBe('choose-room')
    expect(checkBooking(hotel, from, to, 2, { room })).toBeNull()
  })

  it('enforces minimum nights', () => {
    const { from } = freeStay(hotel, hotel.minNights)
    expect(checkBooking(hotel, from, addDays(from, hotel.minNights - 1), 2, { room })).toBe('too-short')
  })

  it('enforces the chosen room\'s capacity', () => {
    const { from, to } = freeStay(hotel, hotel.minNights)
    expect(checkBooking(hotel, from, to, room.guests + 1, { room })).toBe('too-many-guests')
  })

  it('refuses a room that is sold out on any night of the stay', () => {
    let day = addDays(today(), 5)
    while (roomsLeft(hotel, room, day) > 0) day = addDays(day, 1)
    const from = addDays(day, -1)
    const result = checkBooking(hotel, from, addDays(from, 3), 2, { room })
    expect(['room-unavailable', 'unavailable', 'in-past']).toContain(result)
  })

  it('rejects past dates and missing dates', () => {
    expect(checkBooking(hotel, null, null, 2)).toBe('missing-dates')
    expect(checkBooking(hotel, addDays(today(), -5), today(), 2, { room })).toBe('in-past')
  })

  it('asks for a departure time, then checks its seats', () => {
    const time = balloon.slots![0].time
    const day = freeDeparture(balloon, time, 2)
    expect(checkBooking(balloon, day, null, 2)).toBe('choose-slot')
    expect(checkBooking(balloon, day, null, 2, { slot: time })).toBeNull()
    const seats = seatsLeft(balloon, day, time)
    expect(checkBooking(balloon, day, null, seats + 1, { slot: time })).toMatch(/slot-full|too-many-guests/)
  })

  it('treats yachts as one booking at a time', () => {
    const { from, to } = freeStay(yacht, 7)
    expect(checkBooking(yacht, from, to, 6)).toBeNull()
  })

  it('knows when a listing can host a party at all', () => {
    const { from, to } = freeStay(hotel, 2)
    expect(canHost(hotel, from, to, 2)).toBe(true)
    expect(canHost(hotel, from, to, hotel.guests + 1)).toBe(false)
  })
})

describe('quotes', () => {
  it('adds fees and tax to a total that matches its parts', () => {
    const { from, to } = freeStay(hotel, 3)
    const q = quote(hotel, from, to, 2, { room })
    expect(q.nights).toBe(3)
    expect(q.total).toBe(q.subtotal + q.service + q.tax)
    expect(q.service).toBe(Math.round(q.subtotal * 0.06))
  })

  it('prices each night by its own season with the chosen room', () => {
    // 30 Apr is shoulder season and 1 May is peak for the Amalfi Coast.
    const q = quote(hotel, '2027-04-30', '2027-05-02', 2, { room })
    expect(q.subtotal).toBe(Math.round(room.price * 1 + room.price * 1.18))
  })

  it('charges more for a bigger room on the same dates', () => {
    const [small, , big] = hotel.rooms!
    expect(quote(hotel, '2027-06-01', '2027-06-04', 2, { room: big }).total).toBeGreaterThan(
      quote(hotel, '2027-06-01', '2027-06-04', 2, { room: small }).total,
    )
  })

  it('prices a yacht week at its weekly rate in shoulder season', () => {
    const q = quote(yacht, '2027-07-05', '2027-07-12', 8)
    expect(q.subtotal).toBe(yacht.price)
  })

  it('multiplies experiences by guests and ignores nights', () => {
    const one = quote(balloon, '2027-04-10', null, 1, { slot: '05:15' })
    const three = quote(balloon, '2027-04-10', null, 3, { slot: '05:15' })
    expect(three.subtotal).toBe(one.subtotal * 3)
    expect(three.nights).toBe(0)
  })

  it('charges per-guest extras by guest count', () => {
    const insurance = extrasFor(hotel).find((e) => e.id === 'insurance')!
    const transfer = extrasFor(hotel).find((e) => e.id === 'transfer')!
    expect(extraCost(insurance, 4)).toBe(insurance.price * 4)
    expect(extraCost(transfer, 4)).toBe(transfer.price)
  })
})

describe('calendar files', () => {
  it('writes stays as all-day events ending the morning after the last night', () => {
    const ics = buildIcs({ code: 'MRN-TEST01', title: 'Stay', location: 'Venice', from: '2027-05-01', to: '2027-05-04' })
    expect(ics).toContain('DTSTART;VALUE=DATE:20270501')
    expect(ics).toContain('DTEND;VALUE=DATE:20270504')
  })

  it('writes timed experiences and rolls past midnight', () => {
    const ics = buildIcs({ code: 'MRN-TEST02', title: 'Aurora', location: 'Iceland', from: '2027-02-10', to: null, time: '17:00', hours: 14 })
    expect(ics).toContain('DTSTART:20270210T170000')
    expect(ics).toContain('DTEND:20270211T070000')
  })
})

describe('inventory', () => {
  it('gives every destination at least two hotels with rooms', () => {
    for (const d of destinations) {
      const hotels = listings.filter((l) => l.destination === d.slug && l.kind === 'stay')
      expect(hotels.length, d.slug).toBeGreaterThanOrEqual(2)
      expect(hotels.every((h) => (h.rooms?.length ?? 0) >= 3), d.slug).toBe(true)
    }
  })

  it('gives every experience at least one departure time', () => {
    for (const e of listings.filter((l) => l.kind === 'experience')) expect(e.slots?.length, e.slug).toBeGreaterThan(0)
  })

  it('never shares a photo between two listings or a listing and a destination', () => {
    const owner = new Map<string, string>()
    const claim = (image: string, who: string) => {
      expect(owner.get(image) ?? who, `${image} is used by ${owner.get(image)} and ${who}`).toBe(who)
      owner.set(image, who)
    }
    for (const d of destinations) d.images.forEach((img) => claim(img, `destination ${d.slug}`))
    for (const l of listings) l.images.forEach((img) => claim(img, `listing ${l.slug}`))
  })

  it('uses unique slugs and points every listing at a real destination', () => {
    const slugs = listings.map((l) => l.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const l of listings) expect(destinations.some((d) => d.slug === l.destination), l.slug).toBe(true)
  })

  it('stays within reasonable availability for every listing over the next months', () => {
    for (const l of listings) {
      const days = eachDay(today(), addDays(today(), 120))
      const free = days.filter((d) => !isBooked(l, d)).length
      expect(free / days.length, l.slug).toBeGreaterThan(0.6)
    }
    const first = addDays(today(), 1)
    expect(lastCheckout(hotel, first) >= first).toBe(true)
  })
})
