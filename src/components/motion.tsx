import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef, type ReactNode } from 'react'

const ease = [0.16, 1, 0.3, 1] as const

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.9, ease, delay }}
    >
      {children}
    </motion.div>
  )
}

/** Lines rise from behind a mask. Each entry in `lines` is one visual line. */
export function Lines({
  lines,
  className,
  as: Tag = 'h2',
  delay = 0,
}: {
  lines: ReactNode[]
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'p'
  delay?: number
}) {
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        // The mask watches the viewport, not the line: a line waiting below its mask is clipped
        // out of view, so an observer on the line itself may never report it as visible.
        <motion.span
          key={i}
          className="-mb-[0.24em] -ml-[0.08em] block overflow-hidden pb-[0.24em] pl-[0.08em]"
          initial="hide"
          whileInView="show"
          viewport={{ once: true }}
        >
          <motion.span
            className="block"
            variants={{
              hide: { y: '125%' },
              show: { y: 0, transition: { duration: 1.1, ease, delay: delay + i * 0.09 } },
            }}
          >
            {line}
          </motion.span>
        </motion.span>
      ))}
    </Tag>
  )
}

/** A photo or film uncovered by an expanding clip, with a slow settle inside it. */
export function ClipReveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={`overflow-hidden ${className ?? ''}`}
      initial={{ clipPath: 'inset(10% 8% 10% 8%)' }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, margin: '0px 0px -6% 0px' }}
      transition={{ duration: 1.3, ease, delay }}
    >
      <motion.div
        className="h-full w-full"
        initial={{ scale: 1.16 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease, delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

/** Moves its content against the scroll to create depth. */
export function Parallax({ children, amount = 60, className }: { children: ReactNode; amount?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [-amount, amount])
  return (
    <div ref={ref} className={`overflow-hidden ${className ?? ''}`}>
      <motion.div className="h-full w-full" style={{ y, scale: reduced ? 1 : 1 + (amount * 2.4) / 1000 }}>
        {children}
      </motion.div>
    </div>
  )
}

function Word({ word, range, progress }: { word: string; range: [number, number]; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, range, [0.16, 1])
  return (
    <motion.span style={{ opacity }} className="inline-block whitespace-pre">
      {word}{' '}
    </motion.span>
  )
}

/** Paragraph that fills in word by word as it scrolls through the viewport. */
export function ScrollWords({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const reduced = useReducedMotion()
  // Finishes while the paragraph's last line is still in the lower half of the screen, so it never
  // sits half-faded where a reader stops scrolling.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'end 0.72'] })
  if (reduced) return <p className={className}>{text}</p>
  const words = text.split(' ')
  return (
    <p ref={ref} className={className} aria-label={text}>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <Word key={i} word={word} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
        ))}
      </span>
    </p>
  )
}
