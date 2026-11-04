import { useMemo, useState } from 'react'
import { fromISO, monthGrid, today, toISO, type ISODate } from '../lib/dates'
import { ArrowLeft, ArrowRight } from './Icons'

type Props = {
  from: ISODate | null
  to: ISODate | null
  onChange: (from: ISODate | null, to: ISODate | null) => void
  mode?: 'range' | 'single'
  months?: 1 | 2
  /** Whether a day can be picked, given the check-in already chosen and waiting for a checkout. */
  isDisabled?: (iso: ISODate, pendingFrom: ISODate | null) => boolean
}

const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function Calendar({ from, to, onChange, mode = 'range', months = 2, isDisabled }: Props) {
  const start = fromISO(from ?? today())
  const [cursor, setCursor] = useState({ year: start.getFullYear(), month: start.getMonth() })
  const [hover, setHover] = useState<ISODate | null>(null)
  const now = today()
  const pending = mode === 'range' && from && !to ? from : null

  const visible = useMemo(
    () =>
      Array.from({ length: months }, (_, i) => {
        const d = new Date(cursor.year, cursor.month + i, 1)
        return { year: d.getFullYear(), month: d.getMonth(), key: toISO(d) }
      }),
    [cursor, months],
  )

  const canGoBack = new Date(cursor.year, cursor.month, 1) > new Date(fromISO(now).getFullYear(), fromISO(now).getMonth(), 1)
  const shift = (by: number) => {
    const d = new Date(cursor.year, cursor.month + by, 1)
    setCursor({ year: d.getFullYear(), month: d.getMonth() })
  }

  const pick = (iso: ISODate) => {
    if (mode === 'single') return onChange(iso, null)
    if (pending && iso > pending) return onChange(pending, iso)
    onChange(iso, null)
  }

  const end = to ?? (pending && hover && hover > pending ? hover : null)

  return (
    <div className="select-none">
      <div className={`grid gap-x-8 gap-y-5 ${months === 2 ? 'sm:grid-cols-2' : ''}`}>
        {visible.map(({ year, month, key }, index) => (
          <div key={key} className={index === 1 ? 'hidden sm:block' : undefined}>
            <div className="mb-3 flex h-10 items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                disabled={!canGoBack}
                onClick={() => shift(-1)}
                className={`grid h-10 w-10 place-items-center rounded-full hover:bg-paper-2 disabled:opacity-25 ${index === 0 ? '' : 'invisible'}`}
              >
                <ArrowLeft />
              </button>
              <p className="font-semibold" aria-live="polite">
                {new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => shift(1)}
                className={`grid h-10 w-10 place-items-center rounded-full hover:bg-paper-2 ${
                  index === months - 1 ? '' : 'invisible sm:invisible'
                } ${months === 2 && index === 0 ? 'max-sm:!visible' : ''}`}
              >
                <ArrowRight />
              </button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted">
              {weekdays.map((d, i) => (
                <span key={i} className="pb-2" aria-hidden="true">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid min-h-[16.5rem] grid-cols-7 content-start gap-y-0.5">
              {monthGrid(year, month).map((iso, i) => {
                if (!iso) return <span key={`blank-${i}`} />
                const past = iso < now
                const disabled = past || (isDisabled?.(iso, pending) ?? false)
                const isStart = iso === from
                const isEnd = iso === to
                const inRange = !!from && !!end && iso > from && iso < end
                const isHoverEnd = !to && iso === end
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={disabled}
                    onClick={() => pick(iso)}
                    onMouseEnter={() => setHover(iso)}
                    aria-label={fromISO(iso).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    aria-pressed={isStart || isEnd}
                    className={`relative h-11 text-[0.92rem] tabular-nums transition-colors ${
                      disabled ? 'text-ink/30 line-through decoration-ink/25' : 'hover:font-bold'
                    } ${inRange || isHoverEnd ? 'bg-majolica/10' : ''} ${
                      isStart && end ? 'rounded-l-full bg-majolica/10' : ''
                    } ${(isEnd || isHoverEnd) ? 'rounded-r-full' : ''}`}
                  >
                    <span
                      className={`absolute inset-0 grid place-items-center rounded-full ${
                        isStart || isEnd ? 'bg-majolica font-semibold text-white' : ''
                      } ${!disabled && !isStart && !isEnd ? 'hover:ring-1 hover:ring-ink/50' : ''}`}
                    >
                      {fromISO(iso).getDate()}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
