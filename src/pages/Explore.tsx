import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Calendar from '../components/Calendar'
import { ArrowRight } from '../components/Icons'
import ListingCard from '../components/ListingCard'
import Popover from '../components/Popover'
import { Stepper } from '../components/SearchDock'
import { destinationBySlug, destinations, placeName } from '../data/destinations'
import { kindLabels, listings, type Kind, type Listing } from '../data/listings'
import { canHost, isBooked } from '../lib/booking'
import { formatRange, isISODate } from '../lib/dates'

const budgets = [
  { id: '', label: 'Any budget', test: () => true },
  { id: 'under-500', label: 'Under $500', test: (n: number) => n < 500 },
  { id: '500-1500', label: '$500 to $1,500', test: (n: number) => n >= 500 && n <= 1500 },
  { id: 'over-1500', label: 'Over $1,500', test: (n: number) => n > 1500 },
]

/** One comparable figure across stays, yachts and experiences. */
const comparablePrice = (l: Listing) => (l.unit === 'week' ? l.price / 7 : l.price)

const sorts: Record<string, { label: string; compare: (a: Listing, b: Listing) => number }> = {
  recommended: {
    label: 'Recommended',
    compare: (a, b) => Number(!!b.featured) - Number(!!a.featured) || b.rating - a.rating,
  },
  'price-low': { label: 'Price: low to high', compare: (a, b) => comparablePrice(a) - comparablePrice(b) },
  'price-high': { label: 'Price: high to low', compare: (a, b) => comparablePrice(b) - comparablePrice(a) },
  rating: { label: 'Highest rated', compare: (a, b) => b.rating - a.rating || b.reviews - a.reviews },
}

const PAGE = 12

/** With dates, only listings that can take the party: a free room for every night, or a seat at some departure. */
const availableFor = (l: Listing, from: string | null, to: string | null, guests: number) => {
  if (!from) return true
  if (l.kind !== 'experience' && !to) return !isBooked(l, from)
  return canHost(l, from, l.kind === 'experience' ? null : to, Math.max(guests, 1))
}

export default function Explore() {
  const [params, setParams] = useSearchParams()

  const rawKind = params.get('kind')
  const kind = rawKind && rawKind in kindLabels ? (rawKind as Kind) : ''
  const dest = destinationBySlug(params.get('dest') ?? '')?.slug ?? ''
  const from = isISODate(params.get('from')) ? params.get('from') : null
  const to = from && isISODate(params.get('to')) && params.get('to')! > from ? params.get('to') : null
  const guestsParam = Number(params.get('guests'))
  const guests = Number.isInteger(guestsParam) && guestsParam > 0 ? Math.min(guestsParam, 12) : 0
  const budget = budgets.find((b) => b.id === params.get('budget')) ?? budgets[0]
  const sortKey = params.get('sort') ?? ''
  const sort = sorts[sortKey] ?? sorts.recommended

  const update = (changes: Record<string, string | null>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(changes)) {
          if (v) next.set(k, v)
          else next.delete(k)
        }
        return next
      },
      { replace: true, preventScrollReset: true },
    )
  }

  const results = useMemo(
    () =>
      listings
        .filter((l) => !kind || l.kind === kind)
        .filter((l) => !dest || l.destination === dest)
        .filter((l) => !guests || l.guests >= guests)
        .filter((l) => budget.test(comparablePrice(l)))
        .filter((l) => availableFor(l, from, to, guests))
        .sort(sort.compare),
    [kind, dest, guests, budget, from, to, sort],
  )

  const [shown, setShown] = useState(PAGE)
  const filterKey = params.toString()
  const [lastKey, setLastKey] = useState(filterKey)
  if (lastKey !== filterKey) {
    // New filters start again from the first page.
    setLastKey(filterKey)
    setShown(PAGE)
  }
  const visible = results.slice(0, shown)

  const hasFilters = !!(kind || dest || from || guests || budget.id)
  const heading = kind ? `${kindLabels[kind]}s` : 'Everything'
  const place = dest ? destinationBySlug(dest)!.name : null
  const range = formatRange(from, to)

  return (
    <div className="pt-[4.5rem]">
      <header className="gutter pb-8 pt-12 lg:pt-16">
        <p className="eyebrow mb-4 text-majolica">Explore</p>
        <h1 className="display text-[clamp(3rem,8vw,7rem)]">
          {heading}
          {place && <em> in {place}</em>}
        </h1>
      </header>

      {/* Sticky on large screens only: on a phone these filters would take half the viewport. */}
      <div className="z-30 border-y border-ink/15 bg-paper lg:sticky lg:top-[4.5rem]">
        <div className="gutter py-3">
          <div className="no-bar -mx-1 flex items-center gap-1 overflow-x-auto px-1" role="group" aria-label="Filter by type">
            {(['', 'stay', 'yacht', 'experience'] as const).map((k) => (
              <button
                key={k || 'all'}
                type="button"
                aria-pressed={kind === k}
                onClick={() => update({ kind: k || null })}
                className={`min-h-11 shrink-0 rounded-full px-4 text-[0.95rem] font-medium transition-colors ${
                  kind === k ? 'bg-ink text-paper' : 'hover:bg-paper-2'
                }`}
              >
                {k ? `${kindLabels[k]}s` : 'All'}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 items-stretch gap-2 lg:grid-cols-[1.1fr_1.1fr_0.9fr_1fr_1fr]">
            <label className="col-span-2 lg:col-span-1">
              <span className="sr-only">Destination</span>
              <select value={dest} onChange={(e) => update({ dest: e.target.value || null })} className="field h-full">
                <option value="">All destinations</option>
                {destinations.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {placeName(d)}
                  </option>
                ))}
              </select>
            </label>

            <div className="col-span-2 rounded-lg border border-ink/25 bg-white lg:col-span-1 [&>div>button]:min-h-12 [&>div>button]:py-1.5">
              <Popover label="Dates" value={range ?? 'Any time'} placeholder={!range} width="lg:w-[42rem]">
                {(close) => (
                  <>
                    <Calendar from={from} to={to} onChange={(f, t) => update({ from: f, to: t })} />
                    <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
                      <button
                        type="button"
                        className="min-h-11 px-2 font-medium underline underline-offset-4"
                        onClick={() => update({ from: null, to: null })}
                      >
                        Clear
                      </button>
                      <button type="button" className="btn btn-primary min-h-11 py-2" onClick={close}>
                        Done
                      </button>
                    </div>
                  </>
                )}
              </Popover>
            </div>

            <div className="rounded-lg border border-ink/25 bg-white [&>div>button]:min-h-12 [&>div>button]:py-1.5">
              <Popover label="Guests" value={guests ? `${guests} or more` : 'Any'} placeholder={!guests} width="lg:w-80">
                {() => (
                  <>
                    <Stepper label="Guests" value={guests || 1} onChange={(n) => update({ guests: String(n) })} />
                    {guests > 0 && (
                      <button type="button" className="mt-3 min-h-11 font-medium underline underline-offset-4" onClick={() => update({ guests: null })}>
                        Any number of guests
                      </button>
                    )}
                  </>
                )}
              </Popover>
            </div>

            <label>
              <span className="sr-only">Budget per night or person</span>
              <select value={budget.id} onChange={(e) => update({ budget: e.target.value || null })} className="field h-full">
                {budgets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="max-lg:col-span-2">
              <span className="sr-only">Sort results</span>
              <select value={sorts[sortKey] ? sortKey : 'recommended'} onChange={(e) => update({ sort: e.target.value === 'recommended' ? null : e.target.value })} className="field h-full">
                {Object.entries(sorts).map(([id, s]) => (
                  <option key={id} value={id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <section aria-label="Results" className="gutter pb-24 pt-8">
        <div className="mb-8 flex min-h-11 flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-[1.05rem]">
            <strong className="font-semibold tabular-nums">{results.length}</strong> {results.length === 1 ? 'result' : 'results'}
            {budget.id && <span className="text-muted"> · budget per night or person</span>}
          </p>
          {hasFilters && (
            <button type="button" onClick={() => setParams({}, { replace: true, preventScrollReset: true })} className="min-h-11 font-medium underline underline-offset-4">
              Reset search
            </button>
          )}
        </div>

        {results.length > 0 ? (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence initial={false} mode="popLayout">
              {visible.map((listing, i) => (
                <motion.div
                  key={listing.slug}
                  layout="position"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: Math.min(i, 6) * 0.03 }}
                >
                  <ListingCard listing={listing} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : null}
        {results.length > shown && (
          <div className="mt-14 flex flex-col items-center gap-3">
            <p className="text-sm text-muted">
              Showing {shown} of {results.length}
            </p>
            <button type="button" onClick={() => setShown((n) => n + PAGE)} className="btn btn-line">
              Show {Math.min(PAGE, results.length - shown)} more
            </button>
          </div>
        )}
        {results.length > 0 ? null : (
          <div className="on-dark rounded-sm bg-ink px-6 py-16 text-center text-paper">
            <h2 className="display text-[clamp(2.2rem,5vw,4rem)]">
              Haven't found <em>the one?</em>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/80">
              Nothing matches all of those filters. Tell our concierge what you have in mind and we will put a
              personal proposal together.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to="/enquire" className="btn btn-limone">
                Ask the concierge <ArrowRight />
              </Link>
              <button type="button" onClick={() => setParams({}, { replace: true, preventScrollReset: true })} className="btn btn-line">
                Reset search
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
