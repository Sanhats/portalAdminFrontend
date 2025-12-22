"use client"

import {
  DashboardIcon,
  PackageIcon,
  GridIcon,
  CartIcon,
  UsersIcon,
  FileIcon,
  HomeIcon,
} from "./icons/custom-icons"
import { ShoppingBag } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: DashboardIcon },
  { name: "Productos", href: "/admin/products", icon: PackageIcon },
  { name: "Categorías", href: "/admin/categories", icon: GridIcon },
  { name: "Ventas", href: "/admin/sales", icon: ShoppingBag },
  // Rutas futuras del panel admin:
  // { name: "Pedidos", href: "/admin/orders", icon: CartIcon },
  // { name: "Clientes", href: "/admin/customers", icon: UsersIcon },
  // { name: "Reportes", href: "/admin/reports", icon: FileIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:block fixed left-0 top-0 z-40 h-screen w-20 neu-elevated">
      <div className="flex h-full flex-col items-center py-6">
        <nav className="flex flex-1 flex-col items-center gap-3 justify-center w-full px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const linkClasses = isActive
              ? "neu-pressed"
              : "neu-flat neu-hover neu-active"
            const iconClasses = isActive
              ? "text-primary drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
              : "text-muted-foreground group-hover:text-foreground"
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group relative flex h-12 w-12 items-center justify-center rounded-[var(--radius)] transition-all duration-300 ${linkClasses}`}
              >
                <item.icon
                  className={`h-[22px] w-[22px] transition-all duration-300 ${iconClasses}`}
                />
                {isActive && (
                  <div className="absolute -left-1 h-6 w-1 rounded-full bg-primary shadow-[0_0_12px_rgba(0,0,0,0.6)]" />
                )}

                <div className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-[var(--radius)] neu-elevated px-3.5 py-2 text-[13px] font-medium tracking-[-0.01em] text-foreground opacity-0 transition-opacity group-hover:opacity-100 z-50">
                  {item.name}
                </div>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
