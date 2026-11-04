import { useSyncExternalStore } from 'react'
import type { ISODate } from './dates'

export type Booking = {
  code: string
  slug: string
  from: ISODate
  to: ISODate | null
  guests: number
  /** Room type id, for hotel stays. */
  room?: string
  /** Departure time, for experiences. */
  slot?: string
  traveller: { name: string; email: string; phone: string; notes: string }
  extras: string[]
  total: number
  dueNow: number
  plan: 'full' | 'deposit'
  status: 'confirmed' | 'cancelled'
  createdAt: string
}

type State = { saved: string[]; bookings: Booking[] }

const KEY = 'marenna:v1'

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { saved: parsed.saved ?? [], bookings: parsed.bookings ?? [] }
    }
  } catch {
    // Private windows can block storage. The app still works for this visit.
  }
  return { saved: [], bookings: [] }
}

let state = load()
const listeners = new Set<() => void>()

function commit(next: State) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // See load().
  }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useStore = () => useSyncExternalStore(subscribe, () => state)

export const toggleSaved = (slug: string) =>
  commit({
    ...state,
    saved: state.saved.includes(slug) ? state.saved.filter((s) => s !== slug) : [...state.saved, slug],
  })

export const addBooking = (booking: Booking) => commit({ ...state, bookings: [booking, ...state.bookings] })

export const cancelBooking = (code: string) =>
  commit({
    ...state,
    bookings: state.bookings.map((b) => (b.code === code ? { ...b, status: 'cancelled' as const } : b)),
  })

export const makeCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return 'MRN-' + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}
