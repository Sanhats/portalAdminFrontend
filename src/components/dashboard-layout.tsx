import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { DashboardHeader } from "./dashboard-header"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <DashboardHeader />
      <div className="md:ml-20">
        <main className="p-4 sm:p-6 lg:p-8 pt-20 md:pt-4">{children}</main>
      </div>
    </div>
  )
}
