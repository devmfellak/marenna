/** Dates travel through the app as local 'YYYY-MM-DD' strings so they survive URLs and storage. */
export type ISODate = string

export const toISO = (d: Date): ISODate => {
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export const fromISO = (iso: ISODate): Date => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const isISODate = (value: string | null | undefined): value is ISODate => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return toISO(fromISO(value)) === value
}

export const addDays = (iso: ISODate, days: number): ISODate => {
  const d = fromISO(iso)
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export const today = (): ISODate => toISO(new Date())

/** Calendar days from a to b. Uses UTC so a daylight-saving change cannot skew the count. */
export const daysBetween = (a: ISODate, b: ISODate): number => {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000)
}

export const eachDay = (from: ISODate, to: ISODate): ISODate[] => {
  const days: ISODate[] = []
  for (let d = from; d < to; d = addDays(d, 1)) days.push(d)
  return days
}

export const formatDate = (iso: ISODate, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) =>
  fromISO(iso).toLocaleDateString('en-US', opts)

export const formatRange = (from: ISODate | null, to: ISODate | null) => {
  if (!from) return null
  if (!to || to === from) return formatDate(from)
  return `${formatDate(from)} – ${formatDate(to)}`
}

/** Six rows of a Monday-first month, with null for the leading blanks. */
export const monthGrid = (year: number, month: number): (ISODate | null)[] => {
  const first = new Date(year, month, 1)
  const lead = (first.getDay() + 6) % 7
  const count = new Date(year, month + 1, 0).getDate()
  const cells: (ISODate | null)[] = Array.from({ length: lead }, () => null)
  for (let day = 1; day <= count; day++) cells.push(toISO(new Date(year, month, day)))
  return cells
}
