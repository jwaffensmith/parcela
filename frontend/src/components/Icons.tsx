import type { ReactElement } from 'react'

const MARK_GRADIENT_ID = 'parcela-mark-gradient'

export const ParcelaMark = (): ReactElement => {
  return (
    <svg aria-hidden="true" focusable="false" width="32" height="32" viewBox="0 0 64 64">
      <defs>
        <linearGradient id={MARK_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill={`url(#${MARK_GRADIENT_ID})`} />
      <polygon points="20,30 32,16 44,30" fill="#FFFFFF" opacity="0.95" />
      <rect x="23" y="30" width="18" height="14" rx="1" fill="#FFFFFF" opacity="0.95" />
      <rect x="28" y="36" width="8" height="8" rx="1" fill={`url(#${MARK_GRADIENT_ID})`} />
      <line
        x1="14"
        y1="46"
        x2="50"
        y2="46"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeOpacity="0.35"
        strokeLinecap="round"
      />
    </svg>
  )
}

export const AlertIcon = (): ReactElement => {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      style={{ flexShrink: 0, marginTop: '2px' }}
    >
      <circle cx="10" cy="10" r="8" />
      <path d="M10 6v5" />
      <path d="M10 14h.01" />
    </svg>
  )
}
