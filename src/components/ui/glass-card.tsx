import type { ReactNode } from "react"

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  const base =
    "rounded-2xl p-6 bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-all duration-300"
  const hoverClass = hover
    ? "hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_12px_48px_rgba(0,0,0,0.6)]"
    : ""
  const extra = className ? className : ""

  return (
    <div
      className={`${base} ${hoverClass} ${extra}`.trim()}
    >
      {children}
    </div>
  )
}
