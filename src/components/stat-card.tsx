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
  iconColor = "bg-white/[0.06]",
}: StatCardProps) {
  const trendClass = trend?.isPositive
    ? "bg-white/[0.1] text-white/80 border border-white/[0.15]"
    : "bg-white/[0.05] text-white/60 border border-white/[0.08]"

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-5 group shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-2xl" />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[13px] font-medium tracking-wide uppercase text-white/50 mb-1">{title}</p>
          <div className="mt-3 flex items-baseline gap-2.5">
            <h3 className="text-[36px] font-bold tracking-[-0.02em] text-white leading-none">{value}</h3>
            {trend && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight ${trendClass}`}
              >
                {trend.isPositive ? <TrendUpIcon className="h-3 w-3" /> : <TrendDownIcon className="h-3 w-3" />}
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {description && <p className="mt-3 text-[13px] font-light text-white/40 leading-relaxed">{description}</p>}
        </div>

        <div
          className={`flex h-[52px] w-[52px] items-center justify-center rounded-[15px] icon-container transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_8px_32px_rgba(255,255,255,0.08)] ${iconColor}`}
        >
          <Icon className="h-[26px] w-[26px] text-white/90 drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]" />
        </div>
      </div>
    </div>
  )
}
