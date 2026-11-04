import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from '../components/Icons'
import { Img } from '../components/media'
import { destinationBySlug } from '../data/destinations'
import { kindLabels, listingBySlug } from '../data/listings'
import { DEPOSIT_RATE, checkBooking, extraCost, extrasFor, money, quote, seasonLabels } from '../lib/booking'
import { formatDate, isISODate } from '../lib/dates'
import { addBooking, makeCode } from '../lib/store'

const steps = ['Your details', 'Extras', 'Confirm']

type Traveller = { name: string; email: string; phone: string; notes: string }
type Errors = Partial<Record<keyof Traveller, string>>

const validate = (t: Traveller): Errors => {
  const errors: Errors = {}
  if (t.name.trim().length < 2) errors.name = 'Please enter the lead traveller\'s full name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email.trim())) errors.email = 'Please enter a valid email address.'
  if (t.phone.replace(/\D/g, '').length < 7) errors.phone = 'Please enter a phone number with its country code.'
  return errors
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export default function Checkout() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const listing = slug ? listingBySlug(slug) : undefined

  const [step, setStep] = useState(0)
  const [traveller, setTraveller] = useState<Traveller>({ name: '', email: '', phone: '', notes: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [extras, setExtras] = useState<string[]>([])
  const [plan, setPlan] = useState<'full' | 'deposit'>('full')
  const [agreed, setAgreed] = useState(false)
  const [agreeError, setAgreeError] = useState(false)

  const from = params.get('from')
  const to = params.get('to')
  const guests = Number(params.get('guests')) || 1
  const validFrom = isISODate(from) ? from : null
  const validTo = isISODate(to) ? to : null
  const room = listing?.rooms?.find((r) => r.id === params.get('room')) ?? null
  const slot = listing?.slots?.find((s) => s.time === params.get('slot'))?.time ?? null
  const problem = listing ? checkBooking(listing, validFrom, validTo, guests, { room, slot }) : 'missing-dates'

  const q = useMemo(
    () => (listing && validFrom && !problem ? quote(listing, validFrom, validTo, guests, { room, slot }) : null),
    [listing, validFrom, validTo, guests, problem, room, slot],
  )

  if (!listing) return <Navigate to="/explore" replace />
  if (!q || !validFrom) return <Navigate to={`/listing/${listing.slug}`} replace />
  const backTo = `/listing/${listing.slug}?${params.toString()}`

  const destination = destinationBySlug(listing.destination)!
  const available = extrasFor(listing)
  const chosen = available.filter((e) => extras.includes(e.id))
  const extrasTotal = chosen.reduce((sum, e) => sum + extraCost(e, guests), 0)
  const total = q.total + extrasTotal
  const dueNow = plan === 'full' ? total : Math.round(total * DEPOSIT_RATE)

  const set = (key: keyof Traveller) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTraveller((t) => ({ ...t, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const next = () => {
    if (step === 0) {
      const found = validate(traveller)
      setErrors(found)
      const first = Object.keys(found)[0]
      if (first) {
        document.getElementById(`checkout-${first}`)?.focus()
        return
      }
    }
    setStep((s) => s + 1)
  }

  const confirm = () => {
    if (!agreed) {
      setAgreeError(true)
      return
    }
    const code = makeCode()
    addBooking({
      code,
      slug: listing.slug,
      from: validFrom,
      to: validTo,
      guests,
      room: room?.id,
      slot: slot ?? undefined,
      traveller,
      extras,
      total,
      dueNow,
      plan,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    })
    navigate(`/trips/${code}?new=1`, { replace: true })
  }

  const dates = validTo
    ? `${formatDate(validFrom, { month: 'short', day: 'numeric', year: 'numeric' })} – ${formatDate(validTo, { month: 'short', day: 'numeric', year: 'numeric' })}`
    : `${formatDate(validFrom, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}${slot ? ` at ${slot}` : ''}`

  return (
    <div className="gutter pb-24 pt-[6.5rem]">
      <Link to={backTo} className="inline-flex min-h-11 items-center gap-2 font-medium">
        <ArrowLeft /> Back to {listing.name}
      </Link>

      <h1 className="display mt-4 text-[clamp(2.8rem,6vw,5.2rem)]">
        Almost <em>there.</em>
      </h1>

      <ol className="mt-8 grid max-w-2xl grid-cols-3 gap-2" aria-label="Checkout progress">
        {steps.map((label, i) => (
          <li key={label} aria-current={i === step ? 'step' : undefined}>
            <span className={`block h-[3px] rounded-full ${i <= step ? 'bg-majolica' : 'bg-ink/15'}`} />
            <span className={`mt-2 block text-sm ${i === step ? 'font-semibold' : 'text-muted'}`}>
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_25.5rem] lg:gap-16">
        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 0 && (
                <form
                  noValidate
                  className="grid gap-5 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    next()
                  }}
                >
                  <div className="sm:col-span-2">
                    <Field id="checkout-name" label="Lead traveller's full name" error={errors.name}>
                      <input id="checkout-name" className="field" autoComplete="name" value={traveller.name} onChange={set('name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'checkout-name-error' : undefined} />
                    </Field>
                  </div>
                  <Field id="checkout-email" label="Email" error={errors.email}>
                    <input id="checkout-email" type="email" className="field" autoComplete="email" value={traveller.email} onChange={set('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'checkout-email-error' : undefined} />
                  </Field>
                  <Field id="checkout-phone" label="Phone, with country code" error={errors.phone}>
                    <input id="checkout-phone" type="tel" className="field" autoComplete="tel" value={traveller.phone} onChange={set('phone')} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'checkout-phone-error' : undefined} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field id="checkout-notes" label="Anything we should know? (optional)">
                      <textarea id="checkout-notes" rows={4} className="field" placeholder="Allergies, celebrations, arrival times" value={traveller.notes} onChange={set('notes')} />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <button type="submit" className="btn btn-primary">
                      Continue <ArrowRight />
                    </button>
                  </div>
                </form>
              )}

              {step === 1 && (
                <div>
                  <h2 className="display text-[2.2rem]">Make it easier</h2>
                  <p className="mt-1 text-muted">All optional, and you can add them later.</p>
                  <ul className="mt-6 space-y-3">
                    {available.map((extra) => {
                      const on = extras.includes(extra.id)
                      return (
                        <li key={extra.id}>
                          <label className={`flex min-h-16 cursor-pointer items-center gap-4 rounded-lg border bg-white p-4 transition-colors ${on ? 'border-majolica' : 'border-ink/20 hover:border-ink/50'}`}>
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => setExtras((list) => (on ? list.filter((id) => id !== extra.id) : [...list, extra.id]))}
                              className="h-5 w-5 shrink-0 accent-majolica"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block font-semibold">{extra.label}</span>
                              <span className="block text-[0.95rem] text-muted">{extra.detail}</span>
                            </span>
                            <span className="shrink-0 text-right font-medium tabular-nums">
                              {money(extraCost(extra, guests))}
                              {extra.per === 'guest' && <span className="block text-xs font-normal text-muted">{money(extra.price)} each</span>}
                            </span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" className="btn btn-line" onClick={() => setStep(0)}>
                      Back
                    </button>
                    <button type="button" className="btn btn-primary" onClick={next}>
                      Continue <ArrowRight />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="display text-[2.2rem]">How would you like to pay?</h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment plan">
                    {(
                      [
                        { id: 'full', title: 'Pay in full', detail: `${money(total)} today` },
                        { id: 'deposit', title: `${Math.round(DEPOSIT_RATE * 100)}% deposit`, detail: `${money(Math.round(total * DEPOSIT_RATE))} today, the rest 30 days before` },
                      ] as const
                    ).map((option) => (
                      <label key={option.id} className={`flex cursor-pointer gap-3 rounded-lg border bg-white p-4 transition-colors ${plan === option.id ? 'border-majolica' : 'border-ink/20 hover:border-ink/50'}`}>
                        <input type="radio" name="plan" checked={plan === option.id} onChange={() => setPlan(option.id)} className="mt-1 h-5 w-5 shrink-0 accent-majolica" />
                        <span>
                          <span className="block font-semibold">{option.title}</span>
                          <span className="block text-[0.95rem] text-muted">{option.detail}</span>
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-6 rounded-lg bg-paper-2 p-4 text-[0.95rem]">
                    <strong className="font-semibold">Demo checkout.</strong> This portfolio site doesn't take card details,
                    so no payment is requested or made. Your booking is saved only in this browser.
                  </div>

                  <label className="mt-6 flex min-h-11 cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={agreed}
                      aria-describedby={agreeError ? 'agree-error' : undefined}
                      onChange={(e) => {
                        setAgreed(e.target.checked)
                        setAgreeError(false)
                      }}
                      className="mt-0.5 h-5 w-5 shrink-0 accent-majolica"
                    />
                    <span>I understand this is a demo and that changes are free until 14 days before travel.</span>
                  </label>
                  {agreeError && (
                    <p id="agree-error" className="mt-1.5 text-sm font-medium text-danger">
                      Please tick this box to continue.
                    </p>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" className="btn btn-line" onClick={() => setStep(1)}>
                      Back
                    </button>
                    <button type="button" className="btn btn-primary" onClick={confirm}>
                      <Check /> Confirm booking
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <aside aria-label="Booking summary" className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-xl border border-ink/15 bg-white">
            <div className="aspect-[16/9]">
              <Img name={listing.images[0]} alt="" sizes="(min-width: 1024px) 26rem, 100vw" className="h-full w-full object-cover" />
            </div>
            <div className="p-5">
              <p className="eyebrow text-[0.66rem] text-majolica">
                {kindLabels[listing.kind]} · {destination.name}
              </p>
              <h2 className="display mt-1.5 text-[1.9rem] leading-tight">{listing.name}</h2>
              {room && <p className="mt-2 font-medium">{room.name}</p>}
              <p className="mt-1 text-[0.95rem]">{dates}</p>
              <p className="text-[0.95rem] text-muted">
                {guests} {guests === 1 ? 'guest' : 'guests'} · {seasonLabels[q.season]}
              </p>
              <dl className="mt-4 space-y-1.5 border-t border-ink/10 pt-4 text-[0.95rem]">
                {q.lines.map((line) => (
                  <div key={line.label} className="flex justify-between gap-4">
                    <dt className="text-muted">{line.label}</dt>
                    <dd className="tabular-nums">{money(line.amount)}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Service fee</dt>
                  <dd className="tabular-nums">{money(q.service)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Taxes</dt>
                  <dd className="tabular-nums">{money(q.tax)}</dd>
                </div>
                {chosen.map((extra) => (
                  <div key={extra.id} className="flex justify-between gap-4">
                    <dt className="text-muted">{extra.label}</dt>
                    <dd className="tabular-nums">{money(extraCost(extra, guests))}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 border-t border-ink/10 pt-2 text-[1.1rem] font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{money(total)}</dd>
                </div>
                {plan === 'deposit' && (
                  <div className="flex justify-between gap-4 font-medium text-majolica">
                    <dt>Due today</dt>
                    <dd className="tabular-nums">{money(dueNow)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
