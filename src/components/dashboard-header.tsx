"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { DashboardIcon, PackageIcon, GridIcon } from "./icons/custom-icons"

export function DashboardHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_48px_rgba(0,0,0,0.9)]">
      <div className="flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex flex-col">
          <span className="text-[18px] sm:text-[20px] font-semibold text-white/90 tracking-[-0.02em]">
            Panel Admin
          </span>
          <span className="text-[11px] text-white/50 tracking-[-0.01em]">
            by Toludev
          </span>
        </div>

        {/* Botón hamburguesa solo en mobile */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="md:hidden inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] px-2.5 py-1.5 text-white/80 hover:bg-white/[0.08] hover:text-white transition-all"
          aria-label="Abrir menú de navegación"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Menú móvil desplegable */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.1] bg-black/85 backdrop-blur-xl">
          <nav className="px-4 py-3 flex flex-col gap-2">
            <Link
              href="/admin"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/85 hover:bg-white/[0.08] transition-colors"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
                <DashboardIcon className="h-4 w-4 text-white/85" />
              </span>
              <span className="tracking-[-0.01em]">Dashboard</span>
            </Link>

            <Link
              href="/admin/products"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/85 hover:bg-white/[0.08] transition-colors"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
                <PackageIcon className="h-4 w-4 text-white/85" />
              </span>
              <span className="tracking-[-0.01em]">Productos</span>
            </Link>

            <Link
              href="/admin/categories"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/85 hover:bg-white/[0.08] transition-colors"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
                <GridIcon className="h-4 w-4 text-white/85" />
              </span>
              <span className="tracking-[-0.01em]">Categorías</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
