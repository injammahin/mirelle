import { motion } from 'framer-motion'
import { useId } from 'react'

export default function Segmented({ options, value, onChange, size = 'md', className = '' }) {
  const id = useId()
  return (
    <div className={`relative flex rounded-full border border-sand bg-linen/70 p-1 ${className}`}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 font-semibold transition-colors ${size === 'sm' ? 'h-7 text-[11.5px]' : 'h-8 text-[12.5px]'} ${active ? 'text-white' : 'text-taupe hover:text-espresso'}`}
            title={o.title || o.label}
          >
            {active && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full bg-espresso" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            <span className="relative z-10 flex items-center gap-1.5">
              {o.icon}
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
