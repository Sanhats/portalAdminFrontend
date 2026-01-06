"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Eye, CheckCircle2, XCircle, Clock, DollarSign, Filter, Zap } from "lucide-react";
import { api } from "@/lib/api-client";
import Notification from "@/components/Notification";
import { DashboardLayout } from "@/components/dashboard-layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type SaleStatus = 'draft' | 'confirmed' | 'cancelled' | 'paid';

interface SaleItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: string;
  subtotal: string;
  products: {
    id: string;
    sku: string;
    name_internal: string;
    price: string;
  };
  variants: {
    id: string;
    name: string;
    value: string;
  } | null;
}

interface Sale {
  id: string;
  tenant_id: string;
  status: SaleStatus;
  total_amount: string;
  payment_method: string | null;
  notes: string | null;
  created_by: string;
  payment_status: string | null;
  external_reference: string | null;
  created_at: string;
  updated_at: string;
  sale_items: SaleItem[];
}

interface NotificationState {
  message: string;
  type: "success" | "error" | "info";
}

const getStatusColor = (status: SaleStatus) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    case 'confirmed':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'paid':
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'cancelled':
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
};

const getStatusLabel = (status: SaleStatus) => {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'confirmed':
      return 'Confirmada';
    case 'paid':
      return 'Pagada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
};

const getStatusIcon = (status: SaleStatus) => {
  switch (status) {
    case 'draft':
      return <Clock className="h-3 w-3" />;
    case 'confirmed':
      return <CheckCircle2 className="h-3 w-3" />;
    case 'paid':
      return <DollarSign className="h-3 w-3" />;
    case 'cancelled':
      return <XCircle className="h-3 w-3" />;
    default:
      return null;
  }
};

const getPaymentMethodLabel = (method: string | null) => {
  if (!method) return 'No especificado';
  switch (method) {
    case 'cash':
      return 'Efectivo';
    case 'transfer':
      return 'Transferencia';
    case 'mercadopago':
      return 'Mercado Pago';
    case 'other':
      return 'Otro';
    default:
      return method;
  }
};

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<SaleStatus | ''>('');
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const limit = 50;

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }

      const data: any = await api.getSales(params);
      
      let salesArray: Sale[] = [];
      if (Array.isArray(data)) {
        salesArray = data;
      } else if (data && Array.isArray(data.data)) {
        salesArray = data.data;
      }

      setSales(salesArray);

      if (data && data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotal(data.pagination.total || 0);
      } else if (data && typeof data.totalPages === 'number') {
        setTotalPages(data.totalPages);
        setTotal(data.total || 0);
      }
    } catch (error: any) {
      console.error("Error al cargar ventas:", error);
      setNotification({
        message: error.message || "Error al cargar ventas",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(num);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Ventas</h1>
            <p className="text-muted-foreground mt-1">Gestiona las ventas del sistema</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/admin/payments/quick')}
              className="neu-button bg-green-600 hover:bg-green-700 text-white border-0"
            >
              <Zap className="h-4 w-4 mr-2" />
              Cobro Rápido
            </Button>
            <Button
              onClick={() => router.push('/admin/sales/new')}
              className="neu-button text-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Venta
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as SaleStatus | '');
                setPage(1);
              }}
              className="w-48"
            >
              <option value="">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="confirmed">Confirmada</option>
              <option value="paid">Pagada</option>
              <option value="cancelled">Cancelada</option>
            </Select>
          </div>
          <div className="text-muted-foreground text-sm">
            Total: {total} ventas
          </div>
        </div>

        {/* Tabla de ventas */}
        <div className="overflow-hidden rounded-2xl neu-elevated border-0">
          {loading ? (
            <LoadingSpinner />
          ) : sales.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground neu-pressed rounded-2xl">No hay ventas para mostrar</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="neu-pressed border-0">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fecha</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Método de Pago</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cantidad</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="neu-flat neu-hover transition-all duration-200 border-0"
                    >
                      <td className="px-6 py-4 text-sm text-foreground font-mono">
                        {sale.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {formatDate(sale.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground font-semibold">
                        {formatCurrency(sale.total_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(sale.status)}`}>
                          {getStatusIcon(sale.status)}
                          {getStatusLabel(sale.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {getPaymentMethodLabel(sale.payment_method)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {sale.sale_items?.reduce((sum, item) => sum + item.quantity, 0) || 0} unidades
                        {sale.sale_items && sale.sale_items.length > 0 && (
                          <span className="text-muted-foreground text-xs block mt-0.5">
                            ({sale.sale_items.length} {sale.sale_items.length === 1 ? 'producto' : 'productos'})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/sales/${sale.id}`)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Anterior
              </Button>
              <Button
                variant="ghost"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

