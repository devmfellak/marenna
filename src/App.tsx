import { MotionConfig, motion } from 'motion/react'
import { Suspense, lazy, useEffect, useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Footer from './components/Footer'
import Nav from './components/Nav'
import { getLenis, useSmoothScroll } from './lib/scroll'
import Home from './pages/Home'

const Explore = lazy(() => import('./pages/Explore'))
const ListingPage = lazy(() => import('./pages/ListingPage'))
const Destinations = lazy(() => import('./pages/Destinations'))
const DestinationPage = lazy(() => import('./pages/DestinationPage'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Trips = lazy(() => import('./pages/Trips'))
const TripDetail = lazy(() => import('./pages/TripDetail'))
const Enquire = lazy(() => import('./pages/Enquire'))
const Credits = lazy(() => import('./pages/Credits'))
const NotFound = lazy(() => import('./pages/NotFound'))

/** Ink panel that lifts off each new page. The first load skips it so nothing delays the hero. */
function Curtain({ routeKey }: { routeKey: string }) {
  const firstRoute = useRef(routeKey)
  const navigated = useRef(false)
  if (routeKey !== firstRoute.current) navigated.current = true
  if (!navigated.current) return null
  return (
    <motion.div
      key={routeKey}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] origin-top bg-ink"
      initial={{ scaleY: 1 }}
      animate={{ scaleY: 0 }}
      transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1], delay: 0.05 }}
    />
  )
}

function useRouteScroll() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    const lenis = getLenis()
    if (hash) {
      // Lazy sections need a moment to exist before they can be scrolled to.
      const timer = window.setTimeout(() => {
        const el = document.querySelector<HTMLElement>(hash)
        if (!el) return
        if (lenis) lenis.scrollTo(el, { offset: 0 })
        else el.scrollIntoView()
      }, 120)
      return () => window.clearTimeout(timer)
    }
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
    else window.scrollTo(0, 0)
  }, [pathname, hash])
}

export default function App() {
  useSmoothScroll()
  useRouteScroll()
  const location = useLocation()

  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="btn btn-limone fixed left-4 top-4 z-[80] -translate-y-24 focus-visible:translate-y-0"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Suspense fallback={<div className="min-h-screen bg-ink" />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/listing/:slug" element={<ListingPage />} />
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/destinations/:slug" element={<DestinationPage />} />
            <Route path="/checkout/:slug" element={<Checkout />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/trips/:code" element={<TripDetail />} />
            <Route path="/enquire" element={<Enquire />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <Curtain routeKey={location.pathname} />
    </MotionConfig>
  )
}
