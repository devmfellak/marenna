import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { destinationBySlug, destinations } from '../data/destinations'
import { kindLabels, type Kind } from '../data/listings'
import { formatRange, type ISODate } from '../lib/dates'
import Calendar from './Calendar'
import { ArrowRight, Check, Minus, Plus } from './Icons'
import Popover from './Popover'

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 12,
  label,
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  label: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Fewer ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="grid h-11 w-11 place-items-center rounded-full border border-ink/25 hover:border-ink disabled:opacity-30"
        >
          <Minus />
        </button>
        <output className="w-6 text-center text-lg font-semibold tabular-nums" aria-live="polite">
          {value}
        </output>
        <button
          type="button"
          aria-label={`More ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="grid h-11 w-11 place-items-center rounded-full border border-ink/25 hover:border-ink disabled:opacity-30"
        >
          <Plus />
        </button>
      </div>
    </div>
  )
}

function OptionButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-paper-2 ${
        selected ? 'font-semibold text-majolica' : ''
      }`}
    >
      <span className="min-w-0">{children}</span>
      {selected && <Check className="shrink-0" />}
    </button>
  )
}

export default function SearchDock({ direction = 'up' }: { direction?: 'up' | 'down' }) {
  const navigate = useNavigate()
  const [dest, setDest] = useState('')
  const [kind, setKind] = useState<Kind | ''>('')
  const [from, setFrom] = useState<ISODate | null>(null)
  const [to, setTo] = useState<ISODate | null>(null)
  const [guests, setGuests] = useState(2)

  const search = () => {
    const params = new URLSearchParams()
    if (dest) params.set('dest', dest)
    if (kind) params.set('kind', kind)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    params.set('guests', String(guests))
    navigate(`/explore?${params}`)
  }

  const range = formatRange(from, to)

  return (
    <form
      role="search"
      aria-label="Search trips"
      onSubmit={(e) => {
        e.preventDefault()
        search()
      }}
      className="grid rounded-xl bg-white text-ink shadow-[0_24px_70px_-20px_rgb(8_19_31/0.55)] sm:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1.15fr_0.85fr_auto] lg:items-center"
    >
      <Popover
        label="Where"
        value={dest ? destinationBySlug(dest)!.name : 'Anywhere beautiful'}
        placeholder={!dest}
        direction={direction}
        width="lg:w-[34rem]"
        className="border-b border-ink/10 sm:border-r lg:border-b-0"
      >
        {(close) => (
          <div className="grid gap-x-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <OptionButton selected={!dest} onClick={() => { setDest(''); close() }}>
                Anywhere beautiful
              </OptionButton>
            </div>
            {destinations.map((d) => (
              <OptionButton key={d.slug} selected={dest === d.slug} onClick={() => { setDest(d.slug); close() }}>
                {d.name} {d.country !== d.name && <span className="font-normal text-muted">· {d.country}</span>}
              </OptionButton>
            ))}
          </div>
        )}
      </Popover>

      <Popover
        label="Looking for"
        value={kind ? `${kindLabels[kind]}s` : 'Everything'}
        placeholder={!kind}
        direction={direction}
        width="lg:w-64"
        className="border-b border-ink/10 lg:border-b-0 lg:border-r"
      >
        {(close) => (
          <>
            <OptionButton selected={!kind} onClick={() => { setKind(''); close() }}>Everything</OptionButton>
            {(Object.keys(kindLabels) as Kind[]).map((k) => (
              <OptionButton key={k} selected={kind === k} onClick={() => { setKind(k); close() }}>
                {kindLabels[k]}s
              </OptionButton>
            ))}
          </>
        )}
      </Popover>

      <Popover
        label="When"
        value={range ?? 'Add dates'}
        placeholder={!range}
        direction={direction}
        width="lg:w-[42rem]"
        align="right"
        className="border-b border-ink/10 sm:border-r lg:border-b-0"
      >
        {(close) => (
          <>
            <Calendar
              from={from}
              to={to}
              onChange={(f, t) => {
                setFrom(f)
                setTo(t)
              }}
            />
            <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
              <button
                type="button"
                className="min-h-11 px-2 font-medium underline underline-offset-4"
                onClick={() => {
                  setFrom(null)
                  setTo(null)
                }}
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

      <Popover
        label="Guests"
        value={`${guests} ${guests === 1 ? 'guest' : 'guests'}`}
        direction={direction}
        align="right"
        className="border-b border-ink/10 lg:border-b-0"
      >
        {(close) => (
          <>
            <Stepper label="Guests" value={guests} onChange={setGuests} />
            <button type="button" onClick={close} className="btn btn-primary mt-4 w-full lg:hidden">
              Done
            </button>
          </>
        )}
      </Popover>

      <div className="p-2 sm:col-span-2 lg:col-span-1">
        <button type="submit" className="btn btn-primary min-h-14 w-full px-7 lg:w-auto">
          Search <ArrowRight />
        </button>
      </div>
    </form>
  )
}
