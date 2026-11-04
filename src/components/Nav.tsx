import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { menuItems } from '../data/content'
import { useScrollLock } from '../lib/scroll'
import { useStore } from '../lib/store'
import { Close } from './Icons'
import { Img } from './media'

/** Routes that open with a full-bleed photo or film behind the nav. */
const opensOnImage = (path: string) => path === '/' || /^\/destinations\/.+/.test(path) || /^\/listing\/.+/.test(path)

const primary = [
  { label: 'Stays', to: '/explore?kind=stay' },
  { label: 'Yachts', to: '/explore?kind=yacht' },
  { label: 'Experiences', to: '/explore?kind=experience' },
  { label: 'Destinations', to: '/destinations' },
]

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`display text-[1.65rem] italic tracking-tight ${className}`} aria-label="Marenna, home">
      Marenna
    </Link>
  )
}

export default function Nav() {
  const { pathname, search } = useLocation()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [preview, setPreview] = useState(0)
  const { saved, bookings } = useStore()
  const tripCount = saved.length + bookings.filter((b) => b.status === 'confirmed').length

  useMotionValueEvent(scrollY, 'change', (y) => {
    const previous = scrollY.getPrevious() ?? 0
    setScrolled(y > 40)
    // Explore keeps the nav in place because its filter bar sticks directly beneath it.
    setHidden(pathname !== '/explore' && y > 600 && y > previous)
  })

  useEffect(() => setMenuOpen(false), [pathname, search])
  useScrollLock(menuOpen)

  const overlay = opensOnImage(pathname) && !scrolled

  return (
    <>
      <motion.header
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
          overlay ? 'on-dark text-white' : 'bg-paper/90 text-ink shadow-[0_1px_0_rgb(8_19_31/0.1)] backdrop-blur-md'
        }`}
        animate={{ y: hidden && !menuOpen ? '-100%' : 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="gutter flex h-[4.5rem] items-center justify-between gap-6">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
            {primary.map((item) => (
              <Link key={item.label} to={item.to} className="text-[0.95rem] font-medium hover:opacity-65">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-5">
            <Link to="/trips" className="hidden text-[0.95rem] font-medium hover:opacity-65 sm:block">
              My trips
              {tripCount > 0 && (
                <span className="ml-1.5 inline-grid h-5 min-w-5 place-items-center rounded-full bg-limone px-1 text-xs font-bold text-ink">
                  {tripCount}
                </span>
              )}
            </Link>
            <Link to="/enquire" className={`btn hidden min-h-10 py-2 md:inline-flex ${overlay ? 'btn-limone' : 'btn-primary'}`}>
              Enquire
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              className="flex min-h-11 items-center gap-2.5 px-1 text-[0.95rem] font-medium"
            >
              <span aria-hidden="true" className="flex w-6 flex-col gap-[5px]">
                <span className="h-px w-full bg-current" />
                <span className="h-px w-2/3 self-end bg-current" />
              </span>
              Menu
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            data-lenis-prevent
            className="on-dark fixed inset-0 z-50 overflow-y-auto bg-ink text-paper"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="gutter flex h-[4.5rem] items-center justify-between">
              <Logo />
              <button
                type="button"
                autoFocus
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center gap-2 text-[0.95rem] font-medium"
              >
                <Close /> Close
              </button>
            </div>
            <div className="gutter grid gap-10 pb-10 pt-4 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
              <nav aria-label="Menu">
                <ul>
                  {menuItems.map((item, i) => (
                    <motion.li
                      key={item.label}
                      className="border-b border-white/15"
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.22 + i * 0.05, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link
                        to={item.to}
                        onClick={() => setMenuOpen(false)}
                        onMouseEnter={() => setPreview(i)}
                        onFocus={() => setPreview(i)}
                        className="group flex items-baseline gap-5 py-3 md:py-3.5"
                      >
                        <span className="w-7 text-sm tabular-nums text-white/55">{String(i + 1).padStart(2, '0')}</span>
                        <span className="display text-[2.4rem] transition-transform duration-500 ease-out-soft group-hover:translate-x-3 group-hover:italic group-hover:text-limone md:text-[3.4rem]">
                          {item.label}
                        </span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>
              <div className="relative hidden min-h-[60vh] overflow-hidden rounded-sm lg:block">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={preview}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.08 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Img name={menuItems[preview].image} alt="" sizes="45vw" className="h-full w-full object-cover" />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
