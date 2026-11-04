import { Link } from 'react-router-dom'
import Carousel from '../components/Carousel'
import { ArrowRight, Star } from '../components/Icons'
import ListingCard from '../components/ListingCard'
import { Img } from '../components/media'
import { ClipReveal, Lines, Parallax, Reveal } from '../components/motion'
import { monthNames, promises, sampleReviews } from '../data/content'
import { destinations, placeName } from '../data/destinations'
import { listings } from '../data/listings'
import Atlas from '../sections/Atlas'
import Films from '../sections/Films'
import Hero from '../sections/Hero'
import Intro from '../sections/Intro'
import Ways from '../sections/Ways'

function Spotlight() {
  // A mix of featured stays, yachts and experiences rather than a wall of hotels.
  const featured = (kind: string) => listings.filter((l) => l.featured && l.kind === kind)
  const [stays, boats, days] = [featured('stay'), featured('yacht'), featured('experience')]
  const picks = [stays[0], stays[1], boats[0], days[0], stays[2], stays[3], boats[1], days[1], stays[4], stays[5]].filter(Boolean)
  return (
    <section className="pb-24" aria-label="In the spotlight">
      <Carousel
        label="Featured stays, yachts and experiences"
        slideClass="w-[80vw] sm:w-[44vw] lg:w-[29vw]"
        headerSlot={
          <>
            <p className="eyebrow mb-4 text-majolica">02 / In the spotlight</p>
            <Lines className="display text-[clamp(2.4rem,5vw,4.6rem)]" lines={['What everyone is', <em key="asking">asking us about.</em>]} />
          </>
        }
      >
        {picks.map((listing) => (
          <ListingCard key={listing.slug} listing={listing} sizes="(min-width: 1024px) 29vw, (min-width: 640px) 44vw, 80vw" />
        ))}
      </Carousel>
    </section>
  )
}

function InSeason() {
  const now = new Date()
  const month = (now.getMonth() + 1) % 12
  const longName = new Date(now.getFullYear(), month, 1).toLocaleDateString('en-US', { month: 'long' })
  const picks = destinations.filter((d) => d.bestMonths.includes(month)).slice(0, 4)
  if (picks.length === 0) return null
  // Quiet months may have only a couple of picks, so the row always fills the page width.
  const columns = ['', 'lg:grid-cols-1', 'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4'][picks.length]
  const roomy = picks.length <= 2
  return (
    <section aria-label={`Where to go in ${longName}`} className="gutter pb-28">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-t border-ink/15 pt-8">
        <h2 className="display text-[clamp(2.2rem,4.4vw,4rem)]">
          Next month is good for <em>{picks.length === 1 ? 'one place' : 'these'}.</em>
        </h2>
        <Link to="/destinations" className="group inline-flex min-h-11 items-center gap-2 font-medium">
          <span className="link-line">All {destinations.length} destinations</span>
          <ArrowRight className="transition-transform duration-500 ease-out-soft group-hover:translate-x-1" />
        </Link>
      </div>
      <div className={`grid gap-6 sm:grid-cols-2 ${columns}`}>
        {picks.map((d, i) => (
          <Reveal key={d.slug} delay={i * 0.08} className={i % 2 === 1 ? 'lg:mt-14' : ''}>
            <Link to={`/destinations/${d.slug}`} className="group block">
              <Parallax amount={24} className={`rounded-sm ${roomy ? 'aspect-[3/4] sm:aspect-[4/3]' : 'aspect-[3/4]'}`}>
                <Img
                  name={d.images[0]}
                  alt={placeName(d)}
                  sizes={roomy ? '(min-width: 640px) 50vw, 100vw' : '(min-width: 1024px) 24vw, (min-width: 640px) 50vw, 100vw'}
                  className="h-full w-full object-cover transition-transform duration-[1.4s] ease-out-soft group-hover:scale-[1.04]"
                />
              </Parallax>
              <p className="eyebrow mt-4 text-[0.66rem] text-majolica">{monthNames[month]} · {d.country}</p>
              <h3 className="display mt-1.5 text-[1.9rem]">{d.name}</h3>
              <p className="mt-1.5 text-[0.95rem] text-muted">{d.seasonNote}</p>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Promises() {
  return (
    <section aria-label="Why book with us" className="gutter py-24">
      <p className="eyebrow mb-5 text-majolica">06 / Why book with us</p>
      <Lines className="display mb-12 text-[clamp(2.4rem,5vw,4.6rem)]" lines={['We sweat the logistics', <em key="so">so you can stop.</em>]} />
      <div className="grid gap-x-8 gap-y-10 border-t border-ink/15 pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {promises.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.07}>
            <h3 className="text-[1.15rem] font-semibold">{p.title}</h3>
            <p className="mt-2 text-muted">{p.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Reviews() {
  return (
    <section aria-label="Guest stories" className="on-dark bg-majolica py-24 text-white">
      <Carousel
        label="Sample guest stories"
        tone="dark"
        slideClass="w-[88vw] md:w-[62vw] lg:w-[44vw]"
        headerSlot={
          <>
            <p className="eyebrow mb-4 text-limone">07 / From the road</p>
            <Lines className="display text-[clamp(2.4rem,5vw,4.6rem)]" lines={['What people say', <em key="when">when they get back.</em>]} />
            <p className="mt-4 text-sm text-white/80">Sample stories, written to show this layout.</p>
          </>
        }
      >
        {sampleReviews.map((r) => (
          <figure key={r.name} className="flex h-full flex-col justify-between gap-8 border-t border-white/35 pt-6">
            <blockquote className="display text-[clamp(1.6rem,2.6vw,2.4rem)] leading-[1.18]">“{r.quote}”</blockquote>
            <figcaption className="flex items-center gap-4">
              <Img name={r.image} alt="" sizes="64px" className="h-16 w-16 rounded-full object-cover" />
              <div>
                <p className="flex items-center gap-1 font-semibold">
                  {r.name}
                  <span className="ml-2 flex" aria-label="5 out of 5">
                    {[0, 1, 2, 3, 4].map((s) => (
                      <Star key={s} className="h-3.5 w-3.5 text-limone" />
                    ))}
                  </span>
                </p>
                <Link to={r.to} className="link-line text-sm text-white/90">
                  {r.trip}
                </Link>
              </div>
            </figcaption>
          </figure>
        ))}
      </Carousel>
    </section>
  )
}

function Gift() {
  return (
    <section aria-label="Gift a trip" className="on-dark relative overflow-hidden text-white">
      <ClipReveal className="h-[78svh] min-h-[480px]">
        <Img name="bora-bora-2" alt="The lagoon at Bora Bora" className="h-full w-full object-cover" />
      </ClipReveal>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
      <div className="gutter absolute inset-x-0 bottom-0 pb-14">
        <p className="eyebrow mb-4 text-limone">Gift a trip</p>
        <h2 className="display max-w-4xl text-[clamp(2.6rem,6vw,5.6rem)]">
          Buy the trip now. <em>Let them pick the date.</em>
        </h2>
        <Link to="/enquire?about=gift" className="btn btn-limone mt-7">
          Arrange a gift <ArrowRight />
        </Link>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <Intro />
      <Spotlight />
      <InSeason />
      <Atlas />
      <Ways />
      <Films />
      <Promises />
      <Reviews />
      <Gift />
    </>
  )
}
