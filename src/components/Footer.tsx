import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { destinations } from '../data/destinations'
import { ArrowRight, Check } from './Icons'

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

function Newsletter() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(false)
  const [done, setDone] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!isEmail(email)) {
      setError(true)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <p role="status" className="flex items-center gap-2 font-medium text-limone">
        <Check /> You are on the list. This demo has not stored your email.
      </p>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="max-w-md">
      <label htmlFor="newsletter" className="sr-only">
        Email address
      </label>
      <div className="flex items-center border-b border-white/40 focus-within:border-limone">
        <input
          id="newsletter"
          type="email"
          autoComplete="email"
          placeholder="Your email"
          value={email}
          aria-invalid={error}
          aria-describedby={error ? 'newsletter-error' : undefined}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(false)
          }}
          className="min-h-12 w-full bg-transparent pr-3 text-lg placeholder:text-white/55 focus:outline-none"
        />
        <button type="submit" aria-label="Subscribe" className="grid h-11 w-11 shrink-0 place-items-center hover:text-limone">
          <ArrowRight />
        </button>
      </div>
      {error && (
        <p id="newsletter-error" className="mt-2 text-sm text-limone">
          Please enter a valid email address.
        </p>
      )}
    </form>
  )
}

export default function Footer() {
  return (
    <footer className="on-dark bg-ink text-paper">
      <div className="gutter grid gap-12 pb-12 pt-20 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <p className="display max-w-lg text-[2.2rem] leading-[1.08] md:text-[3rem]">
            One good place a month, <em>in your inbox.</em>
          </p>
          <div className="mt-7">
            <Newsletter />
          </div>
        </div>
        <nav aria-label="Book">
          <h2 className="eyebrow mb-4 text-white/60">Book</h2>
          <ul className="space-y-2.5">
            <li><Link className="hover:text-limone" to="/explore?kind=stay">Stays</Link></li>
            <li><Link className="hover:text-limone" to="/explore?kind=yacht">Yacht charters</Link></li>
            <li><Link className="hover:text-limone" to="/explore?kind=experience">Experiences</Link></li>
            <li><Link className="hover:text-limone" to="/trips">My trips</Link></li>
            <li><Link className="hover:text-limone" to="/enquire">Ask the concierge</Link></li>
          </ul>
        </nav>
        <nav aria-label="Destinations">
          <h2 className="eyebrow mb-4 text-white/60">Destinations</h2>
          <ul className="columns-2 gap-4 space-y-2.5">
            {destinations.map((d) => (
              <li key={d.slug} className="break-inside-avoid">
                <Link className="hover:text-limone" to={`/destinations/${d.slug}`}>
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="gutter flex flex-col gap-3 border-t border-white/15 py-6 text-sm text-white/65 lg:flex-row lg:justify-between">
        <p>
          Portfolio demo. The places and their facts are real. Properties, prices, ratings and guest quotes are
          illustrative, and no bookings are charged.
        </p>
        <p className="shrink-0">
          Photography via Wikimedia Commons. Film via Mixkit. Earth imagery by NASA.{" "}
          <Link to="/credits" className="underline underline-offset-4 hover:text-limone">
            Full credits
          </Link>
        </p>
      </div>
    </footer>
  )
}
