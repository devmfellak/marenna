import { useState } from 'react'
import { Link } from 'react-router-dom'
import { destinationBySlug, placeName } from '../data/destinations'
import { kindLabels, unitLabels, type Listing } from '../data/listings'
import { money } from '../lib/booking'
import { toggleSaved, useStore } from '../lib/store'
import { Heart, Star } from './Icons'
import { Img, LoopVideo } from './media'

export function SaveButton({ slug, name, className = '' }: { slug: string; name: string; className?: string }) {
  const { saved } = useStore()
  const isSaved = saved.includes(slug)
  return (
    <button
      type="button"
      aria-pressed={isSaved}
      aria-label={isSaved ? `Remove ${name} from saved` : `Save ${name}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleSaved(slug)
      }}
      className={`grid h-11 w-11 place-items-center rounded-full bg-white/90 text-ink backdrop-blur transition-transform hover:scale-110 ${
        isSaved ? '!text-majolica' : ''
      } ${className}`}
    >
      <Heart filled={isSaved} />
    </button>
  )
}

export function PriceTag({ listing }: { listing: Listing }) {
  return (
    <p className="text-[0.95rem]">
      <span className="text-muted">From </span>
      <span className="font-semibold tabular-nums">{money(listing.price)}</span>
      <span className="text-muted"> / {unitLabels[listing.unit]}</span>
    </p>
  )
}

const canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

export default function ListingCard({
  listing,
  aspect = 'aspect-[4/5]',
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
}: {
  listing: Listing
  aspect?: string
  sizes?: string
}) {
  const [hovering, setHovering] = useState(false)
  const destination = destinationBySlug(listing.destination)!

  return (
    <article
      className="group relative"
      onMouseEnter={() => canHover() && setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className={`relative overflow-hidden rounded-sm bg-paper-2 ${aspect}`}>
        <Img
          name={listing.images[0]}
          alt={`${listing.name}, ${placeName(destination)}`}
          sizes={sizes}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-out-soft group-hover:scale-[1.05]"
        />
        {listing.film && hovering && (
          <LoopVideo
            name={listing.film}
            active
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="eyebrow rounded-full bg-white/90 px-3 py-1.5 text-[0.66rem] text-ink backdrop-blur">
            {kindLabels[listing.kind]}
          </span>
          {listing.featured && (
            <span className="eyebrow rounded-full bg-limone px-3 py-1.5 text-[0.66rem] text-ink">{listing.featured}</span>
          )}
        </div>
      </div>
      <SaveButton slug={listing.slug} name={listing.name} className="absolute right-3 top-3 z-10" />
      <div className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="display text-[1.65rem] leading-[1.08]">
            <Link to={`/listing/${listing.slug}`} className="after:absolute after:inset-0">
              {listing.name}
            </Link>
          </h3>
          <p className="flex shrink-0 items-center gap-1 pt-1 text-[0.95rem] font-semibold tabular-nums">
            <Star className="h-4 w-4 text-majolica" />
            <span className="sr-only">Rated </span>
            {listing.rating.toFixed(1)}
          </p>
        </div>
        <p className="mt-1.5 text-[0.95rem] text-muted">{placeName(destination)}</p>
        <div className="mt-1.5">
          <PriceTag listing={listing} />
        </div>
      </div>
    </article>
  )
}
