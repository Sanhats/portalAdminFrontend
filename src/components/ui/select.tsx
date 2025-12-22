"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "w-full h-10 px-3 pr-10 neu-input text-foreground transition-all duration-300 appearance-none cursor-pointer focus-visible:outline-none focus-visible:neu-elevated disabled:cursor-not-allowed disabled:opacity-50",
            error && "ring-2 ring-destructive",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown 
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" 
        />
      </div>
    )
  },
)
Select.displayName = "Select"

export { Select }

