import { useId } from 'react'

// Mirelle brand mark: terracotta disc, italic serif "M" with a leaf sprig, gold sparkles.
export function LogoMark({ size = 36, className = '' }) {
  // unique gradient id per instance (a shared id breaks when the first copy is display:none)
  const gid = 'mrl-' + useId().replace(/:/g, '')
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-label="Mirelle" role="img">
      <defs>
        <radialGradient id={gid} cx="0.32" cy="0.25" r="0.85">
          <stop offset="0" stopColor="#e3a088" />
          <stop offset="0.55" stopColor="#c97b62" />
          <stop offset="1" stopColor="#a85c47" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${gid})`} />
      <text x="52" y="66" textAnchor="middle" fontFamily="'Playfair Display', Georgia, serif" fontStyle="italic" fontWeight="600" fontSize="54" fill="#fbf3e8">
        M
      </text>
      {/* leaf sprig */}
      <g stroke="#fbf3e8" strokeLinecap="round" fill="#fbf3e8">
        <path d="M38 64 C34 72 30 78 26 84" strokeWidth="2.6" fill="none" />
        <path d="M33 72 C26 70 21 72 18 76 C24 78 29 76 33 72Z" stroke="none" />
        <path d="M30 78 C34 80 38 84 38 89 C33 88 30 84 30 78Z" stroke="none" />
        <circle cx="26" cy="85" r="1.8" stroke="none" />
      </g>
      {/* sparkles */}
      <path d="M78 18 Q79 23 84 24 Q79 25 78 30 Q77 25 72 24 Q77 23 78 18Z" fill="#f2c86b" />
      <path d="M69 13 Q69.5 15.5 72 16 Q69.5 16.5 69 19 Q68.5 16.5 66 16 Q68.5 15.5 69 13Z" fill="#f2c86b" />
    </svg>
  )
}

export function Wordmark({ compact = false }) {
  return (
    <div className="leading-none">
      <div className={`font-serif italic font-semibold text-espresso ${compact ? 'text-[20px]' : 'text-[24px]'}`}>Mirelle</div>
      <div className={`mt-0.5 font-sans font-medium uppercase tracking-[0.28em] text-taupe ${compact ? 'text-[7.5px]' : 'text-[8.5px]'}`}>Aesthetic Studio</div>
    </div>
  )
}
