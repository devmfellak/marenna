import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

type Props = {
  label: string
  value: ReactNode
  placeholder?: boolean
  align?: 'left' | 'right'
  direction?: 'up' | 'down'
  width?: string
  className?: string
  /** Called with a closer so the content can dismiss the panel after a choice. */
  children: (close: () => void) => ReactNode
}

/** A labelled field that opens a floating panel, or a bottom sheet on small screens. */
export default function Popover({
  label,
  value,
  placeholder,
  align = 'left',
  direction = 'down',
  width = 'lg:w-80',
  className = '',
  children,
}: Props) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => {
    setOpen(false)
    trigger.current?.focus()
  }

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="block min-h-[4.25rem] w-full px-5 py-3 text-left transition-colors hover:bg-ink/[0.04]"
      >
        <span className="eyebrow block text-[0.68rem] text-muted">{label}</span>
        <span className={`mt-1 block truncate text-[1.05rem] font-medium ${placeholder ? 'text-muted' : ''}`}>{value}</span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              aria-hidden="true"
              className="fixed inset-0 z-40 bg-ink/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              data-lenis-prevent
              initial={{ opacity: 0, y: direction === 'up' ? 12 : -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: direction === 'up' ? 8 : -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className={`fixed inset-x-0 bottom-0 z-50 max-h-[85svh] overflow-y-auto rounded-t-2xl bg-white p-5 text-ink shadow-2xl lg:absolute lg:inset-x-auto lg:max-h-[min(70vh,34rem)] lg:rounded-xl ${width} ${
                direction === 'up' ? 'lg:bottom-[calc(100%+0.75rem)]' : 'lg:bottom-auto lg:top-[calc(100%+0.75rem)]'
              } ${align === 'right' ? 'lg:right-0' : 'lg:left-0'}`}
            >
              {children(close)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
