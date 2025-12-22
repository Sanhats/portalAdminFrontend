import { TrendUpIcon, TrendDownIcon } from "./icons/custom-icons"
import type { ComponentType, SVGProps } from "react"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  trend?: {
    value: number
    isPositive: boolean
  }
  iconColor?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  iconColor,
}: StatCardProps) {
  const trendClass = trend?.isPositive
    ? "neu-elevated text-foreground"
    : "neu-pressed text-muted-foreground"

  return (
    <div className="relative overflow-hidden rounded-2xl neu-elevated p-5 group neu-hover neu-active transition-all duration-300">
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[13px] font-medium tracking-wide uppercase text-muted-foreground mb-1">{title}</p>
          <div className="mt-3 flex items-baseline gap-2.5">
            <h3 className="text-[36px] font-bold tracking-[-0.02em] text-foreground leading-none">{value}</h3>
            {trend && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight ${trendClass}`}
              >
                {trend.isPositive ? <TrendUpIcon className="h-3 w-3" /> : <TrendDownIcon className="h-3 w-3" />}
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {description && <p className="mt-3 text-[13px] font-light text-muted-foreground leading-relaxed">{description}</p>}
        </div>

        <div
          className={`flex h-[52px] w-[52px] items-center justify-center rounded-[15px] neu-elevated transition-all duration-300 group-hover:scale-105 ${iconColor || ""}`}
        >
          <Icon className="h-[26px] w-[26px] text-foreground" />
        </div>
      </div>
    </div>
  )
}
