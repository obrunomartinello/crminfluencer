import React, { useId } from 'react'

/**
 * Emblema vetorial oficial do Jackpot CRM (ficha de cassino + coroa + diamante).
 */
export default function BrandLogo({ size = 38, className = '' }) {
  const uid = useId().replace(/:/g, '')
  const feltId = `felt-${uid}`
  const goldId = `gold-${uid}`
  const gemId = `gem-${uid}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Jackpot CRM Logo"
    >
      <defs>
        <linearGradient id={feltId} x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#065F46" />
          <stop offset="55%" stopColor="#064E3B" />
          <stop offset="100%" stopColor="#022C22" />
        </linearGradient>
        <linearGradient id={goldId} x1="18" y1="14" x2="46" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="45%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id={gemId} x1="26" y1="37" x2="38" y2="49" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="55%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${feltId})`} stroke={`url(#${goldId})`} strokeWidth="2.5" />

      <circle cx="32" cy="32" r="22.5" stroke={`url(#${goldId})`} strokeWidth="3.6" strokeDasharray="6.8 4.8" strokeLinecap="round" />
      <circle cx="32" cy="32" r="18" fill="#022C22" stroke="#10B981" strokeOpacity="0.4" strokeWidth="1.2" />

      <path d="M19.5 31.5 L22 20.5 L27.8 25.8 L32 17 L36.2 25.8 L42 20.5 L44.5 31.5 Z" fill={`url(#${goldId})`} />
      <circle cx="22" cy="19.5" r="1.6" fill="#FEF08A" />
      <circle cx="32" cy="16" r="1.8" fill="#FEF08A" />
      <circle cx="42" cy="19.5" r="1.6" fill="#FEF08A" />
      <rect x="20" y="33" width="24" height="3.2" rx="1.6" fill={`url(#${goldId})`} />

      <path d="M32 38 L38.5 43.2 L32 48.5 L25.5 43.2 Z" fill={`url(#${gemId})`} stroke="#A7F3D0" strokeWidth="0.9" />
      <path d="M32 38 L35.2 43.2 L32 43.2 Z" fill="#A7F3D0" fillOpacity="0.45" />
    </svg>
  )
}
