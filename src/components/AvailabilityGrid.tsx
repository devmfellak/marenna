import { useState } from 'react'
import { money } from '../lib/booking'
import { addDays, formatDate, fromISO, today, type ISODate } from '../lib/dates'
import { ArrowLeft, ArrowRight } from './Icons'

export type GridCell = { price: number; left: number } | null

export type GridRow = {
  key: string
  label: string
  sub?: string
  cell: (iso: ISODate) => GridCell
}

const DAYS = 14

/**
 * Two weeks of availability at a glance: one row per room type or hotel, one column per night.
 * Each open cell is a button that starts a stay on that night.
 */
export default function AvailabilityGrid({
  rows,
  start,
  caption,
  selected,
  onPick,
}: {
  rows: GridRow[]
  start: ISODate
  caption: string
  selected?: { row: string | null; from: ISODate | null; to: ISODate | null }
  onPick: (row: string, iso: ISODate) => void
}) {
  const [offset, setOffset] = useState(0)
  const first = addDays(start, offset)
  const days = Array.from({ length: DAYS }, (_, i) => addDays(first, i))
  const canGoBack = addDays(first, -7) >= today()

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {formatDate(days[0], { month: 'short', day: 'numeric' })} to {formatDate(days[DAYS - 1], { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <div className="flex gap-2">
          <button type="button" aria-label="Earlier week" disabled={!canGoBack} onClick={() => setOffset((o) => o - 7)} className="grid h-10 w-10 place-items-center rounded-full border border-ink/25 hover:bg-ink hover:text-paper disabled:opacity-30">
            <ArrowLeft />
          </button>
          <button type="button" aria-label="Later week" onClick={() => setOffset((o) => o + 7)} className="grid h-10 w-10 place-items-center rounded-full border border-ink/25 hover:bg-ink hover:text-paper">
            <ArrowRight />
          </button>
        </div>
      </div>
      <div data-lenis-prevent className="no-bar overflow-x-auto rounded-lg border border-ink/15 bg-white">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-52 bg-white px-4 py-3 text-left font-semibold">
                <span className="sr-only">Option</span>
              </th>
              {days.map((iso) => {
                const d = fromISO(iso)
                const weekend = d.getDay() === 5 || d.getDay() === 6
                return (
                  <th key={iso} scope="col" className={`px-1 py-2 text-center font-normal ${weekend ? 'bg-paper-2/70' : ''}`}>
                    <span className="block text-[0.7rem] uppercase tracking-wider text-muted">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="block font-semibold tabular-nums">{d.getDate()}</span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-ink/10">
                <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-2 text-left align-middle font-medium">
                  <span className="block leading-tight">{row.label}</span>
                  {row.sub && <span className="block text-xs font-normal text-muted">{row.sub}</span>}
                </th>
                {days.map((iso) => {
                  const cell = row.cell(iso)
                  const inStay = selected?.row === row.key && selected.from && iso >= selected.from && (selected.to ? iso < selected.to : iso === selected.from)
                  if (!cell) {
                    return (
                      <td key={iso} className="p-1">
                        <span className="grid h-12 place-items-center rounded-md bg-[repeating-linear-gradient(135deg,rgb(8_19_31/0.05)_0_6px,transparent_6px_12px)] text-xs text-muted">
                          Full
                        </span>
                      </td>
                    )
                  }
                  const low = cell.left <= 2
                  return (
                    <td key={iso} className="p-1">
                      <button
                        type="button"
                        onClick={() => onPick(row.key, iso)}
                        aria-label={`${row.label}, ${formatDate(iso, { weekday: 'long', month: 'long', day: 'numeric' })}: ${money(cell.price)}, ${cell.left} left`}
                        aria-pressed={!!inStay}
                        className={`grid h-12 w-full place-items-center rounded-md border text-center leading-tight transition-colors ${
                          inStay ? 'border-majolica bg-majolica text-white' : low ? 'border-limone-deep/60 bg-limone/25 hover:border-ink' : 'border-ink/10 hover:border-ink'
                        }`}
                      >
                        <span className="text-[0.78rem] font-semibold tabular-nums">{money(cell.price)}</span>
                        <span className={`text-[0.68rem] ${inStay ? 'text-white/85' : low ? 'font-semibold text-ink' : 'text-muted'}`}>{cell.left} left</span>
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-limone/60 align-middle" />2 or fewer left</span>
        <span><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm border border-ink/20 bg-ink/5 align-middle" />Sold out</span>
        <span>Prices per night, before fees.</span>
      </p>
    </div>
  )
}
