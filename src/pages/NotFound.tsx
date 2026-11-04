import { Link } from 'react-router-dom'
import { ArrowRight } from '../components/Icons'
import { Img } from '../components/media'

export default function NotFound() {
  return (
    <section className="on-dark relative grid min-h-svh place-items-center overflow-hidden text-center text-white">
      <Img name="iceland-3" alt="" priority className="absolute inset-0 h-full w-full object-cover" />
      <div aria-hidden="true" className="absolute inset-0 bg-ink/55" />
      <div className="gutter relative">
        <p className="eyebrow mb-4 text-limone">Page not found</p>
        <h1 className="display text-[clamp(3rem,9vw,8rem)]">
          Lost, <em>beautifully.</em>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[1.1rem] text-white/90">This page doesn't exist, but plenty of other places do.</p>
        <Link to="/destinations" className="btn btn-limone mt-7">
          See the destinations <ArrowRight />
        </Link>
      </div>
    </section>
  )
}
