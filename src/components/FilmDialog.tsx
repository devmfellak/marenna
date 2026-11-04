import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Film } from '../data/content'
import { useScrollLock } from '../lib/scroll'
import { ArrowLeft, ArrowRight, Close } from './Icons'
import { posterUrl, videoUrl } from './media'

/** Full-screen film player built on the native dialog, which traps focus and handles Escape. */
export default function FilmDialog({
  films,
  index,
  onChange,
  onClose,
}: {
  films: Film[]
  index: number | null
  onChange: (i: number) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const open = index !== null
  useScrollLock(open)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const film = index === null ? null : films[index]
  const step = (by: number) => {
    if (index !== null) onChange((index + by + films.length) % films.length)
  }

  return (
    <dialog
      ref={ref}
      aria-label={film ? `Film: ${film.title}` : 'Film'}
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') step(-1)
        if (e.key === 'ArrowRight') step(1)
      }}
      className="on-dark m-0 h-dvh max-h-none w-screen max-w-none bg-ink text-paper backdrop:bg-ink"
    >
      {film && (
        <div className="flex h-full flex-col">
          <div className="gutter flex h-[4.5rem] shrink-0 items-center justify-between gap-4">
            <p className="min-w-0 truncate">
              <span className="display text-2xl italic">{film.title}</span>
              <span className="ml-3 text-sm text-white/65">{film.place}</span>
            </p>
            <button type="button" onClick={onClose} className="flex min-h-11 shrink-0 items-center gap-2 font-medium">
              <Close /> Close
            </button>
          </div>
          <div className="min-h-0 flex-1 px-4 md:px-16">
            <video
              key={film.video}
              src={videoUrl(film.video)}
              poster={posterUrl(film.video)}
              autoPlay
              muted
              loop
              controls
              playsInline
              className="h-full w-full object-contain"
            />
          </div>
          <div className="gutter flex h-20 shrink-0 items-center justify-between gap-4">
            <div className="flex gap-2">
              <button type="button" aria-label="Previous film" onClick={() => step(-1)} className="grid h-12 w-12 place-items-center rounded-full border border-white/40 hover:bg-white hover:text-ink">
                <ArrowLeft />
              </button>
              <button type="button" aria-label="Next film" onClick={() => step(1)} className="grid h-12 w-12 place-items-center rounded-full border border-white/40 hover:bg-white hover:text-ink">
                <ArrowRight />
              </button>
            </div>
            <Link to={film.to} onClick={onClose} className="btn btn-limone min-h-11 py-2">
              Take me there <ArrowRight />
            </Link>
          </div>
        </div>
      )}
    </dialog>
  )
}
