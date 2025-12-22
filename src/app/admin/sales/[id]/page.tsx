"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Loader2, Clock, DollarSign } from "lucide-react";
import { api } from "@/lib/api-client";
import Notification from "@/components/Notification";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";

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
      return <Clock className="h-4 w-4" />;
    case 'confirmed':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'paid':
      return <DollarSign className="h-4 w-4" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4" />;
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

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.id as string;
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const loadSale = async () => {
    if (!saleId) return;
    setLoading(true);
    try {
      const data = await api.getSale(saleId) as Sale;
      setSale(data);
    } catch (error: any) {
      console.error("Error al cargar venta:", error);
      setNotification({
        message: error.message || "Error al cargar venta",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSale();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleId]);

  const handleConfirm = async () => {
    if (!sale) return;

    setConfirming(true);
    try {
      const confirmedSale = await api.confirmSale(sale.id) as Sale;
      setSale(confirmedSale);
      setShowConfirmDialog(false);
      setNotification({
        message: "Venta confirmada exitosamente. El stock ha sido descontado.",
        type: "success",
      });
    } catch (error: any) {
      console.error("Error al confirmar venta:", error);
      let errorMessage = error.message || "Error al confirmar venta";
      
      // Si hay detalles de stock insuficiente, mostrarlos
      if (error.details?.issues && Array.isArray(error.details.issues)) {
        errorMessage = `Stock insuficiente: ${error.details.issues.join(', ')}`;
      }
      
      setNotification({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!sale) return;

    setCancelling(true);
    try {
      const cancelledSale = await api.cancelSale(sale.id) as Sale;
      setSale(cancelledSale);
      setShowCancelDialog(false);
      setNotification({
        message: "Venta cancelada exitosamente. El stock ha sido revertido si estaba confirmada.",
        type: "success",
      });
    } catch (error: any) {
      console.error("Error al cancelar venta:", error);
      setNotification({
        message: error.message || "Error al cancelar venta",
        type: "error",
      });
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(num);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white/60">Cargando venta...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!sale) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white/60">Venta no encontrada</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/sales')}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-white">Detalle de Venta</h1>
            <p className="text-white/60 mt-1">ID: {sale.id}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${getStatusColor(sale.status)}`}>
            {getStatusIcon(sale.status)}
            {getStatusLabel(sale.status)}
          </span>
        </div>

        {/* Información general */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-semibold text-white mb-4">Información General</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Fecha de creación:</span>
                <span className="text-white">{formatDate(sale.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Última actualización:</span>
                <span className="text-white">{formatDate(sale.updated_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Método de pago:</span>
                <span className="text-white">{getPaymentMethodLabel(sale.payment_method)}</span>
              </div>
              {sale.notes && (
                <div className="pt-3 border-t border-white/10">
                  <div className="text-white/60 mb-1">Notas:</div>
                  <div className="text-white">{sale.notes}</div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-semibold text-white mb-4">Resumen</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <span className="text-white/80">Total:</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(sale.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Items:</span>
                <span className="text-white">{sale.sale_items?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items de la venta */}
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <h3 className="text-lg font-semibold text-white mb-4">Productos</h3>
          <div className="space-y-3">
            {sale.sale_items && sale.sale_items.length > 0 ? (
              sale.sale_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex-1">
                    <div className="text-white font-medium">{item.products.name_internal}</div>
                    {item.variants && (
                      <div className="text-white/60 text-sm">
                        {item.variants.name}: {item.variants.value}
                      </div>
                    )}
                    <div className="text-white/50 text-xs mt-1">
                      SKU: {item.products.sku} • Cantidad: {item.quantity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/60 text-sm">
                      {item.quantity} x {formatCurrency(item.unit_price)}
                    </div>
                    <div className="text-white font-semibold">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-white/60">No hay items en esta venta</div>
            )}
          </div>
        </div>

        {/* Acciones */}
        {sale.status === 'draft' && (
          <div className="flex gap-4">
            <Button
              onClick={() => setShowConfirmDialog(true)}
              className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar Venta
            </Button>
            <Button
              onClick={() => setShowCancelDialog(true)}
              variant="ghost"
              className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar Venta
            </Button>
          </div>
        )}

        {sale.status === 'confirmed' && (
          <div className="flex gap-4">
            <Button
              onClick={() => setShowCancelDialog(true)}
              variant="ghost"
              className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar Venta
            </Button>
          </div>
        )}

        {/* Diálogo de confirmación */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-6 max-w-md w-full mx-4 shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Confirmar Venta</h3>
                  <p className="text-white/70 text-sm">
                    Esta acción descuenta el stock de los productos. ¿Estás seguro de que deseas confirmar esta venta?
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 text-white/60 hover:text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 disabled:opacity-50"
                >
                  {confirming ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirmar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Diálogo de cancelación */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-6 max-w-md w-full mx-4 shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Cancelar Venta</h3>
                  <p className="text-white/70 text-sm">
                    {sale.status === 'confirmed' 
                      ? 'Esta acción revertirá el stock de los productos. ¿Estás seguro de que deseas cancelar esta venta?'
                      : '¿Estás seguro de que deseas cancelar esta venta?'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowCancelDialog(false)}
                  className="flex-1 text-white/60 hover:text-white hover:bg-white/10"
                >
                  No, mantener
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 disabled:opacity-50"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Sí, cancelar
                    </>
                  )}
                </Button>
              </div>
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

