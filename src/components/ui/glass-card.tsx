import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface NeumorphicCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  variant?: "elevated" | "pressed" | "flat"
}

export function GlassCard({ children, className, hover = true, variant = "elevated" }: NeumorphicCardProps) {
  const baseVariants = {
    elevated: "neu-elevated",
    pressed: "neu-pressed",
    flat: "neu-flat"
  }

  const base = cn(
    "p-6 transition-all duration-300",
    baseVariants[variant],
    hover && "neu-hover neu-active"
  )

  return (
    <div className={cn(base, className)}>
      {children}
    </div>
  )
}
