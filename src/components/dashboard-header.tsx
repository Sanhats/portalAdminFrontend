"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, ShoppingBag } from "lucide-react"
import { DashboardIcon, PackageIcon, GridIcon } from "./icons/custom-icons"

export function DashboardHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <header className="fixed top-4 left-4 z-50 md:left-4">
      <div className="group relative neu-flat neu-hover neu-active rounded-[var(--radius)] w-12 h-12 flex items-center justify-center transition-all duration-300">
        <div className="flex flex-col items-center justify-center">
          <span className="text-[10px] font-semibold text-foreground tracking-[-0.01em] leading-tight">
            PA
          </span>
          <span className="text-[8px] text-muted-foreground tracking-[-0.01em] leading-tight">
            TD
          </span>
        </div>
        {/* Tooltip como los botones de la sidebar */}
        <div className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-[var(--radius)] neu-elevated px-3.5 py-2 text-[13px] font-medium tracking-[-0.01em] text-foreground opacity-0 transition-opacity group-hover:opacity-100 z-50">
          <div className="flex flex-col">
            <span>Panel Admin</span>
            <span className="text-[11px] text-muted-foreground">by Toludev</span>
          </div>
        </div>
      </div>

      {/* Botón hamburguesa solo en mobile - posicionado a la derecha */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        className="md:hidden fixed top-4 right-4 inline-flex items-center justify-center rounded-[var(--radius)] neu-flat neu-hover neu-active px-2.5 py-1.5 text-foreground transition-all z-50"
        aria-label="Abrir menú de navegación"
      >
        {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Menú móvil desplegable */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-16 right-4 neu-pressed rounded-[var(--radius)] z-40 min-w-[200px]">
          <nav className="px-4 py-3 flex flex-col gap-2">
            <Link
              href="/admin"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm text-foreground hover:neu-elevated transition-all duration-300"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] neu-flat">
                <DashboardIcon className="h-4 w-4 text-foreground" />
              </span>
              <span className="tracking-[-0.01em]">Dashboard</span>
            </Link>

            <Link
              href="/admin/products"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm text-foreground hover:neu-elevated transition-all duration-300"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] neu-flat">
                <PackageIcon className="h-4 w-4 text-foreground" />
              </span>
              <span className="tracking-[-0.01em]">Productos</span>
            </Link>

            <Link
              href="/admin/categories"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm text-foreground hover:neu-elevated transition-all duration-300"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] neu-flat">
                <GridIcon className="h-4 w-4 text-foreground" />
              </span>
              <span className="tracking-[-0.01em]">Categorías</span>
            </Link>

            <Link
              href="/admin/sales"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm text-foreground hover:neu-elevated transition-all duration-300"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] neu-flat">
                <ShoppingBag className="h-4 w-4 text-foreground" />
              </span>
              <span className="tracking-[-0.01em]">Ventas</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
