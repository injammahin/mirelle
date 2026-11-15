import { BookOpen, Feather, Film, Leaf, Mail, Ribbon, Sparkles } from 'lucide-react'

// Line icons for the vibe chips (replaces the old emoji).
const ICONS = { coquette: Ribbon, darkAcademia: BookOpen, softBotanical: Leaf, vintage90s: Film, minimalEditorial: Feather, letters: Mail, all: Sparkles }

export default function VibeIcon({ id, size = 14, className = '' }) {
  const Icon = ICONS[id] || Sparkles
  return <Icon size={size} strokeWidth={1.9} className={`shrink-0 ${className}`} />
}
