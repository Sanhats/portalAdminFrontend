"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { DashboardLayout } from "@/components/dashboard-layout"
import { StatCard } from "@/components/stat-card"
import { DataTable } from "@/components/data-table"
import { PackageIcon, CartIcon, UsersIcon, ChartIcon } from "@/components/icons/custom-icons"
import { api } from "@/lib/api-client"

interface DashboardStat {
  title: string
  value: string | number
  description?: string
  icon: any
  iconColor?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

interface RecentProduct {
  id: string
  name: string
  category: string
  price: string
  stock: number
  status: "Active" | "Low Stock" | "Out of Stock"
}

const INITIAL_STATS: DashboardStat[] = [
  {
    title: "Total productos",
    value: "-",
    description: "No hay estadísticas por el momento",
    icon: PackageIcon,
    iconColor: "bg-white/[0.06]",
    trend: undefined,
  },
  {
    title: "Total órdenes",
    value: "-",
    description: "No hay estadísticas por el momento",
    icon: CartIcon,
    iconColor: "bg-white/[0.06]",
    trend: undefined,
  },
  {
    title: "Clientes",
    value: "-",
    description: "No hay estadísticas por el momento",
    icon: UsersIcon,
    iconColor: "bg-white/[0.06]",
    trend: undefined,
  },
  {
    title: "Ingresos",
    value: "-",
    description: "No hay estadísticas por el momento",
    icon: ChartIcon,
    iconColor: "bg-white/[0.06]",
    trend: undefined,
  },
]

export default function AdminHome() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStat[]>(INITIAL_STATS)
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const data: any = await api.getProducts({ page: 1, limit: 5 })

      let productsArray: any[] = []
      if (Array.isArray(data)) {
        productsArray = data
      } else if (data && Array.isArray(data.data)) {
        productsArray = data.data
      } else if (data && Array.isArray(data.products)) {
        productsArray = data.products
      }

      const normalizedProducts: RecentProduct[] = productsArray.map((product: any) => {
        const categoryName =
          product.categories?.name ||
          product.category?.name ||
          product.category_name ||
          product.categoryName ||
          "Sin categoría"

        const priceNumber = Number(product.price ?? 0)
        const priceFormatted = isNaN(priceNumber)
          ? "-"
          : new Intl.NumberFormat("es-MX", {
              style: "currency",
              currency: "MXN",
              maximumFractionDigits: 0,
            }).format(priceNumber)

        let status: RecentProduct["status"] = "Active"
        if (product.stock === 0) {
          status = "Out of Stock"
        } else if (product.stock < 10) {
          status = "Low Stock"
        }

        return {
          id: String(product.id),
          name: product.name,
          category: categoryName,
          price: priceFormatted,
          stock: Number(product.stock ?? 0),
          status,
        }
      })

      setRecentProducts(normalizedProducts)

      let totalProducts = normalizedProducts.length
      if (data?.pagination?.total) {
        totalProducts = data.pagination.total
      } else if (typeof data?.total === "number") {
        totalProducts = data.total
      }

      setStats((prev) =>
        prev.map((stat) =>
          stat.title === "Total productos"
            ? {
                ...stat,
                value: totalProducts.toLocaleString("es-MX"),
              }
            : stat,
        ),
      )
    } catch (error) {
      console.error("Error al cargar dashboard admin:", error)
      setRecentProducts([])
      setStats(INITIAL_STATS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const productColumns = useMemo(
    () => [
      { key: "name", label: "Producto" },
      { key: "category", label: "Categoría" },
      { key: "price", label: "Precio" },
      { key: "stock", label: "Stock" },
      {
        key: "status",
        label: "Estado",
        render: (item: RecentProduct) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight border ${
              item.status === "Active"
                ? "bg-white/[0.1] text-white/80 border-white/[0.15]"
                : item.status === "Low Stock"
                  ? "bg-amber-500/10 text-amber-200 border-amber-500/40"
                  : "bg-red-500/10 text-red-200 border-red-500/40"
            }`}
          >
            {item.status === "Active"
              ? "Activo"
              : item.status === "Low Stock"
                ? "Stock bajo"
                : "Sin stock"}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="space-y-4">
          <h1 className="font-serif text-[28px] sm:text-[36px] lg:text-[44px] font-semibold tracking-[-0.03em] text-white leading-[1.1]">
            Panel de administración
          </h1>
          <div className="ornamental-divider w-24" />
          <p className="text-[15px] font-light text-white/45 leading-relaxed tracking-[-0.005em] max-w-xl">
            Resumen de tu catálogo y acceso rápido a la gestión de productos.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
            <h2 className="font-serif text-[22px] sm:text-[26px] lg:text-[32px] font-semibold text-white tracking-[-0.02em] leading-tight">
                Productos recientes
              </h2>
              <p className="mt-2 text-[14px] font-light text-white/45 tracking-[-0.005em]">
                Últimos productos cargados en tu catálogo
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="rounded-full border border-white/15 bg-white/[0.03] px-4 py-1.5 text-[13px] font-medium text-white/80 backdrop-blur-md transition hover:bg-white/[0.08]"
            >
              Ver todos los productos
            </button>
          </div>

          <DataTable
            data={recentProducts}
            columns={productColumns}
            onView={() => router.push("/admin/products")}
            onEdit={() => router.push("/admin/products")}
            onDelete={() => router.push("/admin/products")}
          />

          {loading && (
            <p className="text-[13px] text-white/40 mt-2">
              Cargando datos del panel...
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
