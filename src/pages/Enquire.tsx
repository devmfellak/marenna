import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check } from '../components/Icons'
import { Img } from '../components/media'
import { Lines } from '../components/motion'
import { listingBySlug } from '../data/listings'

const reasons = ['A stay', 'A yacht charter', 'An experience', 'A whole trip', 'A gift', 'Something else']

type Form = { name: string; email: string; reason: string; when: string; message: string }
type Errors = Partial<Record<keyof Form, string>>

export default function Enquire() {
  const [params] = useSearchParams()
  const about = params.get('about')
  const listing = about ? listingBySlug(about) : undefined

  const [form, setForm] = useState<Form>({
    name: '',
    email: '',
    reason: about === 'gift' ? 'A gift' : listing ? (listing.kind === 'yacht' ? 'A yacht charter' : listing.kind === 'stay' ? 'A stay' : 'An experience') : '',
    when: '',
    message: listing ? `I'd like to know more about ${listing.name}.` : '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState(false)

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found: Errors = {}
    if (form.name.trim().length < 2) found.name = 'Please tell us your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) found.email = 'Please enter a valid email address.'
    if (!form.reason) found.reason = 'Please choose what you are looking for.'
    if (form.message.trim().length < 10) found.message = 'Please give us a little more to go on.'
    setErrors(found)
    const first = Object.keys(found)[0]
    if (first) {
      document.getElementById(`enquire-${first}`)?.focus()
      return
    }
    setSent(true)
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="on-dark relative hidden lg:block">
        <div className="sticky top-0 h-svh">
          <Img name="venice-2" alt="Venice" sizes="50vw" priority className="h-full w-full object-cover" />
        </div>
      </div>
      <div className="gutter pb-20 pt-28 lg:pl-16">
        <p className="eyebrow mb-4 text-majolica">Ask the concierge</p>
        <Lines as="h1" className="display text-[clamp(2.8rem,6vw,5.2rem)]" lines={['Tell us where', <em key="your">your head is at.</em>]} />

        {sent ? (
          <div role="status" className="mt-10 max-w-lg rounded-lg bg-paper-2 p-6">
            <p className="flex items-center gap-2 text-[1.2rem] font-semibold">
              <Check className="text-majolica" /> Thanks, {form.name.trim().split(' ')[0]}.
            </p>
            <p className="mt-2">
              In the real product a concierge would reply within a day. This demo has no backend, so nothing has been
              sent or stored.
            </p>
            <Link to="/explore" className="btn btn-primary mt-5">
              Keep exploring
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-10 grid max-w-xl gap-5">
            <div>
              <label htmlFor="enquire-name" className="mb-1.5 block font-medium">Your name</label>
              <input id="enquire-name" className="field" autoComplete="name" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'enquire-name-error' : undefined} />
              {errors.name && <p id="enquire-name-error" className="mt-1.5 text-sm font-medium text-danger">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="enquire-email" className="mb-1.5 block font-medium">Email</label>
              <input id="enquire-email" type="email" className="field" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'enquire-email-error' : undefined} />
              {errors.email && <p id="enquire-email-error" className="mt-1.5 text-sm font-medium text-danger">{errors.email}</p>}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="enquire-reason" className="mb-1.5 block font-medium">Looking for</label>
                <select id="enquire-reason" className="field" value={form.reason} onChange={set('reason')} aria-invalid={!!errors.reason} aria-describedby={errors.reason ? 'enquire-reason-error' : undefined}>
                  <option value="">Choose one</option>
                  {reasons.map((r) => <option key={r}>{r}</option>)}
                </select>
                {errors.reason && <p id="enquire-reason-error" className="mt-1.5 text-sm font-medium text-danger">{errors.reason}</p>}
              </div>
              <div>
                <label htmlFor="enquire-when" className="mb-1.5 block font-medium">When (optional)</label>
                <input id="enquire-when" className="field" placeholder="Next May, or flexible" value={form.when} onChange={set('when')} />
              </div>
            </div>
            <div>
              <label htmlFor="enquire-message" className="mb-1.5 block font-medium">What do you have in mind?</label>
              <textarea id="enquire-message" rows={5} className="field" value={form.message} onChange={set('message')} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'enquire-message-error' : undefined} />
              {errors.message && <p id="enquire-message-error" className="mt-1.5 text-sm font-medium text-danger">{errors.message}</p>}
            </div>
            <div>
              <button type="submit" className="btn btn-primary">Send enquiry</button>
              <p className="mt-2 text-sm text-muted">Demo form: nothing is sent or stored.</p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
