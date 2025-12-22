"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { DashboardLayout } from "@/components/dashboard-layout"
import { StatCard } from "@/components/stat-card"
import LoadingSpinner from "@/components/LoadingSpinner"
import { PackageIcon, CartIcon, GridIcon, ChartIcon, TrendUpIcon } from "@/components/icons/custom-icons"
import { AlertTriangle, TrendingUp } from "lucide-react"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"

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

const INITIAL_STATS: DashboardStat[] = [
  {
    title: "Total productos",
    value: "-",
    description: "Productos en el catálogo",
    icon: PackageIcon,
    iconColor: "neu-flat",
    trend: undefined,
  },
  {
    title: "Stock bajo",
    value: "-",
    description: "Productos con stock < 10",
    icon: AlertTriangle,
    iconColor: "neu-flat",
    trend: undefined,
  },
  {
    title: "Categorías",
    value: "-",
    description: "Categorías activas",
    icon: GridIcon,
    iconColor: "neu-flat",
    trend: undefined,
  },
  {
    title: "Total ventas",
    value: "-",
    description: "Ventas registradas",
    icon: CartIcon,
    iconColor: "neu-flat",
    trend: undefined,
  },
  {
    title: "Ingresos totales",
    value: "-",
    description: "Suma de ventas pagadas",
    icon: ChartIcon,
    iconColor: "neu-flat",
    trend: undefined,
  },
  {
    title: "Ventas del mes",
    value: "-",
    description: "Ventas del mes actual",
    icon: TrendingUp,
    iconColor: "neu-flat",
    trend: undefined,
  },
]

export default function AdminHome() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStat[]>(INITIAL_STATS)
  const [loading, setLoading] = useState<boolean>(true)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      // Cargar productos
      const productsData: any = await api.getProducts({ page: 1, limit: 1000 })
      let productsArray: any[] = []
      if (Array.isArray(productsData)) {
        productsArray = productsData
      } else if (productsData && Array.isArray(productsData.data)) {
        productsArray = productsData.data
      } else if (productsData && Array.isArray(productsData.products)) {
        productsArray = productsData.products
      }

      // Cargar categorías
      const categoriesData: any = await api.getCategories()
      const categoriesArray = Array.isArray(categoriesData) ? categoriesData : []

      // Cargar ventas
      const salesData: any = await api.getSales({ page: 1, limit: 1000 })
      let salesArray: any[] = []
      if (Array.isArray(salesData)) {
        salesArray = salesData
      } else if (salesData && Array.isArray(salesData.data)) {
        salesArray = salesData.data
      }

      // Calcular métricas
      const totalProducts = productsData?.pagination?.total || productsData?.total || productsArray.length
      const lowStockProducts = productsArray.filter((p: any) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 10).length
      const totalCategories = categoriesArray.length
      const totalSales = salesArray.length

      // Calcular ingresos totales (solo ventas pagadas)
      const totalRevenue = salesArray
        .filter((sale: any) => sale.status === 'paid' || sale.payment_status === 'paid')
        .reduce((sum: number, sale: any) => sum + parseFloat(sale.total_amount || 0), 0)

      // Calcular ventas del mes actual
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const monthlySales = salesArray.filter((sale: any) => {
        const saleDate = new Date(sale.created_at)
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear
      }).length

      // Actualizar estadísticas
      setStats((prev) =>
        prev.map((stat) => {
          switch (stat.title) {
            case "Total productos":
              return { ...stat, value: totalProducts.toLocaleString("es-AR") }
            case "Stock bajo":
              return { ...stat, value: lowStockProducts.toLocaleString("es-AR") }
            case "Categorías":
              return { ...stat, value: totalCategories.toLocaleString("es-AR") }
            case "Total ventas":
              return { ...stat, value: totalSales.toLocaleString("es-AR") }
            case "Ingresos totales":
              return { ...stat, value: formatCurrency(totalRevenue) }
            case "Ventas del mes":
              return { ...stat, value: monthlySales.toLocaleString("es-AR") }
            default:
              return stat
          }
        }),
      )
    } catch (error) {
      console.error("Error al cargar dashboard admin:", error)
      setStats(INITIAL_STATS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        

        {/* Métricas principales */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Accesos rápidos */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className={cn(
              "neu-elevated neu-hover neu-active p-6 rounded-[var(--radius)] text-left transition-all duration-300",
              "hover:scale-[1.02]"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="neu-pressed p-3 rounded-[var(--radius)]">
                <PackageIcon className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Gestionar Productos</h3>
                <p className="text-sm text-muted-foreground mt-1">Ver y editar tu catálogo</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/categories")}
            className={cn(
              "neu-elevated neu-hover neu-active p-6 rounded-[var(--radius)] text-left transition-all duration-300",
              "hover:scale-[1.02]"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="neu-pressed p-3 rounded-[var(--radius)]">
                <GridIcon className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Gestionar Categorías</h3>
                <p className="text-sm text-muted-foreground mt-1">Organiza tus productos</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/sales")}
            className={cn(
              "neu-elevated neu-hover neu-active p-6 rounded-[var(--radius)] text-left transition-all duration-300",
              "hover:scale-[1.02]"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="neu-pressed p-3 rounded-[var(--radius)]">
                <CartIcon className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Ver Ventas</h3>
                <p className="text-sm text-muted-foreground mt-1">Historial de ventas</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
