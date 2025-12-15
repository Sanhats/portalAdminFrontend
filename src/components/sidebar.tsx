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
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: DashboardIcon },
  { name: "Productos", href: "/admin/products", icon: PackageIcon },
  { name: "Categorías", href: "/admin/categories", icon: GridIcon },
  // Rutas futuras del panel admin:
  // { name: "Pedidos", href: "/admin/orders", icon: CartIcon },
  // { name: "Clientes", href: "/admin/customers", icon: UsersIcon },
  // { name: "Reportes", href: "/admin/reports", icon: FileIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:block fixed left-0 top-0 z-40 h-screen w-20 border-r border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_48px_rgba(0,0,0,0.9)]">
      <div className="flex h-full flex-col items-center py-10">
        <nav className="flex flex-1 flex-col items-center gap-4 justify-center">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const linkClasses = isActive
              ? "bg-white/[0.12] backdrop-blur-md shadow-[inset_0_2px_8px_rgba(0,0,0,0.3),0_4px_20px_rgba(255,255,255,0.08)] border border-white/[0.15]"
              : "hover:bg-white/[0.08] hover:backdrop-blur-md hover:shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:border hover:border-white/[0.08]"
            const iconClasses = isActive
              ? "text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]"
              : "text-white/50 group-hover:text-white/80"
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group relative flex h-11 w-11 items-center justify-center rounded-[13px] transition-all duration-300 ${linkClasses}`}
              >
                <item.icon
                  className={`h-[22px] w-[22px] transition-all duration-300 ${iconClasses}`}
                />
                {isActive && (
                  <div className="absolute -left-0.5 h-5 w-[3px] rounded-full bg-white shadow-[0_0_16px_rgba(255,255,255,0.8)]" />
                )}

                <div className="pointer-events-none absolute left-full ml-4 whitespace-nowrap rounded-xl bg-black/90 backdrop-blur-xl border border-white/[0.12] px-3.5 py-2 text-[13px] font-medium tracking-[-0.01em] text-white/95 opacity-0 shadow-[0_8px_32px_rgba(0,0,0,0.9)] transition-opacity group-hover:opacity-100">
                  {item.name}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Sin avatar ni acciones adicionales al final por ahora */}
      </div>
    </aside>
  )
}
