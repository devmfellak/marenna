import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Img, LoopVideo } from '../components/media'
import { Lines, Reveal } from '../components/motion'
import { destinations, placeName, type Destination } from '../data/destinations'
import { fromPrice, listingsIn } from '../data/listings'
import { money } from '../lib/booking'

const regions = ['All', ...new Set(destinations.map((d) => d.region))]

function DestinationTile({ destination, wide }: { destination: Destination; wide: boolean }) {
  const [hovering, setHovering] = useState(false)
  const from = fromPrice(destination.slug)
  return (
    <Link
      to={`/destinations/${destination.slug}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="group block"
    >
      <div className={`relative overflow-hidden rounded-sm bg-paper-2 ${wide ? 'aspect-[16/10]' : 'aspect-[4/5]'}`}>
        <Img
          name={destination.images[0]}
          alt={placeName(destination)}
          sizes={wide ? '(min-width: 1024px) 60vw, 100vw' : '(min-width: 1024px) 34vw, 100vw'}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-out-soft group-hover:scale-[1.04]"
        />
        {destination.film && hovering && (
          <LoopVideo name={destination.film} active className="absolute inset-0 h-full w-full object-cover" />
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h2 className="display text-[clamp(1.9rem,3vw,2.8rem)]">{destination.name}</h2>
        {destination.country !== destination.name && <p className="shrink-0 text-[0.95rem] text-muted">{destination.country}</p>}
      </div>
      <p className="mt-1.5 max-w-xl text-[1.02rem]">{destination.tagline}</p>
      <p className="mt-1.5 text-[0.95rem] text-muted">
        {listingsIn(destination.slug).length} to book{from ? ` · from ${money(from)}` : ''}
      </p>
    </Link>
  )
}

export default function Destinations() {
  const [region, setRegion] = useState('All')
  const shown = destinations.filter((d) => region === 'All' || d.region === region)

  return (
    <div className="gutter pb-24 pt-[4.5rem]">
      <header className="pb-10 pt-12 lg:pt-16">
        <p className="eyebrow mb-4 text-majolica">Destinations</p>
        <Lines
          as="h1"
          className="display text-[clamp(3rem,8vw,7rem)]"
          lines={[`${destinations.length} places we`, <em key="keep">keep going back to.</em>]}
        />
      </header>

      <div className="no-bar mb-10 flex gap-1 overflow-x-auto" role="group" aria-label="Filter by region">
        {regions.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={region === r}
            onClick={() => setRegion(r)}
            className={`min-h-11 shrink-0 rounded-full px-4 text-[0.95rem] font-medium transition-colors ${
              region === r ? 'bg-ink text-paper' : 'hover:bg-paper-2'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="grid gap-x-6 gap-y-14 lg:grid-cols-5">
        {shown.map((destination, i) => {
          const wide = i % 4 === 0 || i % 4 === 3
          return (
            <Reveal key={destination.slug} className={wide ? 'lg:col-span-3' : 'lg:col-span-2'}>
              <DestinationTile destination={destination} wide={wide} />
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}
