type IconProps = { className?: string }

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export const ArrowRight = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
)
export const ArrowLeft = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M20 12H5M11 6l-6 6 6 6" />
  </svg>
)
export const Close = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
)
export const Play = ({ className }: IconProps) => (
  <svg {...base} fill="currentColor" stroke="none" className={className}>
    <path d="M7 4.5v15l13-7.5z" />
  </svg>
)
export const Pause = ({ className }: IconProps) => (
  <svg {...base} fill="currentColor" stroke="none" className={className}>
    <path d="M7 4.5h3.6v15H7zM13.4 4.5H17v15h-3.6z" />
  </svg>
)
export const Star = ({ className }: IconProps) => (
  <svg {...base} fill="currentColor" stroke="none" className={className}>
    <path d="M12 3l2.7 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17.2l-5.6 3.1 1.2-6.3L3 9.6l6.3-.8z" />
  </svg>
)
export const Heart = ({ filled, className }: IconProps & { filled?: boolean }) => (
  <svg {...base} fill={filled ? 'currentColor' : 'none'} className={className}>
    <path d="M12 20s-7.5-4.6-9-9.3C2 7.2 4.3 4.5 7.2 4.5c2 0 3.7 1.1 4.8 3 1.1-1.9 2.8-3 4.8-3 2.9 0 5.2 2.7 4.2 6.2C19.5 15.4 12 20 12 20z" />
  </svg>
)
export const Check = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
)
export const Minus = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 12h14" />
  </svg>
)
export const Plus = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const Pin = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 21s7-6.3 7-11.5A7 7 0 005 9.5C5 14.7 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
)
