"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Loader2, Edit, Save, X, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import Notification from "@/components/Notification";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SaleFinancialCard } from "@/components/SaleFinancialCard";
import { PaymentModal } from "@/components/PaymentModal";
import { PaymentQRModal } from "@/components/PaymentQRModal";
import { PaymentMercadoPagoModal } from "@/components/PaymentMercadoPagoModal";
import { PaymentTimeline } from "@/components/PaymentTimeline";
import { PaymentQRDisplay } from "@/components/PaymentQRDisplay";
import { Sale, Payment, SaleStatus, PaymentStatus } from "@/types/payments";
import { canPaySale, canDeletePayment, canConfirmPayment } from "@/lib/payment-helpers";
import { 
  getSaleStatusColor, 
  getSaleStatusLabel, 
  getSaleStatusIcon,
  getPaymentStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusIcon,
  getPaymentMethodTypeLabel,
  getPaymentMethodEnumLabel,
  getPaymentProviderLabel,
} from "@/lib/payment-mappings";
import { getErrorMessage } from "@/lib/error-handler";

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

interface ExtendedSale extends Sale {
  sale_items: SaleItem[];
}

interface NotificationState {
  message: string;
  type: "success" | "error" | "info";
}

const getPaymentMethodLabel = (method: string | null) => {
  if (!method) return 'No especificado';
  return getPaymentMethodTypeLabel(method as any);
};

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.id as string;
  const [sale, setSale] = useState<ExtendedSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  
  // Estados para edición
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Estados para pagos
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showQRPaymentDialog, setShowQRPaymentDialog] = useState(false);
  const [showMPPaymentDialog, setShowMPPaymentDialog] = useState(false);
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  const loadSale = async () => {
    if (!saleId) return;
    setLoading(true);
    try {
      const data = await api.getSale(saleId) as ExtendedSale;
      setSale(data);
      // Inicializar valores de edición
      setEditPaymentMethod(data.payment_method || 'cash');
      setEditNotes(data.notes || '');
    } catch (error: any) {
      console.error("Error al cargar venta:", error);
      setNotification({
        message: getErrorMessage(error),
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

  // Cargar pagos cuando la venta esté confirmada o pagada
  useEffect(() => {
    if (sale && canPaySale(sale)) {
      loadPayments();
    }
  }, [sale?.id, sale?.status]);

  const loadPayments = async () => {
    if (!saleId) return;
    setLoadingPayments(true);
    try {
      const data = await api.getSalePayments(saleId) as { payments: Payment[]; financial?: any };
      setPayments(Array.isArray(data.payments) ? data.payments : []);
      // Actualizar resumen financiero desde la respuesta
      if (data.financial && sale) {
        setSale({ ...sale, financial: data.financial });
      }
    } catch (error: any) {
      console.error("Error al cargar pagos:", error);
      setNotification({
        message: getErrorMessage(error),
        type: "error",
      });
    } finally {
      setLoadingPayments(false);
    }
  };

  const handlePaymentSuccess = async () => {
    // Refrescar pagos y venta después de crear un pago
    await loadPayments();
    await loadSale();
  };

  const handleConfirm = async () => {
    if (!sale) return;

    setConfirming(true);
    try {
      const confirmedSale = await api.confirmSale(sale.id) as ExtendedSale;
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
      const cancelledSale = await api.cancelSale(sale.id) as ExtendedSale;
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

  const handleEdit = () => {
    if (!sale) return;
    setEditPaymentMethod(sale.payment_method || 'cash');
    setEditNotes(sale.notes || '');
    setEditing(true);
  };

  const handleCancelEdit = () => {
    if (!sale) return;
    setEditPaymentMethod(sale.payment_method || 'cash');
    setEditNotes(sale.notes || '');
    setEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!sale) return;

    setSaving(true);
    try {
      const updatedSale = await api.updateSale(sale.id, {
        paymentMethod: editPaymentMethod as 'cash' | 'transfer' | 'mercadopago' | 'other',
        notes: editNotes.trim() || undefined,
      }) as ExtendedSale;
      
      setSale(updatedSale);
      setEditing(false);
      setNotification({
        message: "Venta actualizada exitosamente",
        type: "success",
      });
    } catch (error: any) {
      console.error("Error al actualizar venta:", error);
      setNotification({
        message: error.message || "Error al actualizar venta",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };


  const handleDeletePayment = async (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment || !canDeletePayment(payment)) {
      setNotification({
        message: "Solo se pueden eliminar pagos pendientes",
        type: "error",
      });
      return;
    }

    if (!confirm("¿Estás seguro de que deseas eliminar este pago?")) {
      return;
    }

    try {
      await api.deletePayment(paymentId);
      await loadPayments();
      await loadSale();
      setNotification({
        message: "Pago eliminado exitosamente",
        type: "success",
      });
    } catch (error: any) {
      console.error("Error al eliminar pago:", error);
      setNotification({
        message: getErrorMessage(error),
        type: "error",
      });
    }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment || !canConfirmPayment(payment)) {
      setNotification({
        message: "Este pago no puede ser confirmado",
        type: "error",
      });
      return;
    }

    if (!confirm("¿Confirmar este pago? Esta acción no se puede deshacer.")) {
      return;
    }

    setConfirmingPaymentId(paymentId);
    try {
      await api.confirmPayment(paymentId);
      await loadPayments();
      await loadSale();
      setNotification({
        message: "Pago confirmado exitosamente",
        type: "success",
      });
    } catch (error: any) {
      console.error("Error al confirmar pago:", error);
      setNotification({
        message: getErrorMessage(error),
        type: "error",
      });
    } finally {
      setConfirmingPaymentId(null);
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
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${getSaleStatusColor(sale.status)}`}>
            {getSaleStatusIcon(sale.status)}
            {getSaleStatusLabel(sale.status)}
          </span>
        </div>

        {/* Información general */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="neu-elevated border-0 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Información General</h3>
              {sale.status === 'draft' && !editing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Fecha de creación:</span>
                <span className="text-white">{formatDate(sale.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Última actualización:</span>
                <span className="text-white">{formatDate(sale.updated_at)}</span>
              </div>
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-white/80">Método de pago</Label>
                    <Select
                      value={editPaymentMethod}
                      onChange={(e) => setEditPaymentMethod(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    >
                      <option value="cash">Efectivo</option>
                      <option value="transfer">Transferencia</option>
                      <option value="mercadopago">Mercado Pago</option>
                      <option value="other">Otro</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Notas (opcional)</Label>
                    <Textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Agregar notas sobre la venta..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="flex-1 text-white/60 hover:text-white hover:bg-white/10"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1" />
                          Guardar
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          {sale.financial ? (
            <SaleFinancialCard financial={sale.financial} />
          ) : (
            <div className="neu-elevated border-0 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Resumen Financiero</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span className="text-white/80">Total:</span>
                  <span className="text-2xl font-bold text-white">
                    {formatCurrency(sale.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="text-white/60">Items:</span>
                  <span className="text-white">{sale.sale_items?.length || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Items de la venta */}
        <div className="neu-elevated border-0 rounded-2xl p-6">
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

        {/* Sección de Pagos - Solo para ventas confirmed o paid */}
        {canPaySale(sale) && (
          <div className="neu-elevated border-0 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-white">Pagos</h3>
                {payments.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTimeline(!showTimeline)}
                    className="text-white/60 hover:text-white hover:bg-white/10"
                  >
                    {showTimeline ? 'Ocultar' : 'Ver'} Timeline
                  </Button>
                )}
              </div>
              {sale.status === 'confirmed' && !sale.financial?.isPaid && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowMPPaymentDialog(true)}
                    size="sm"
                    className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Mercado Pago
                  </Button>
                  <Button
                    onClick={() => setShowQRPaymentDialog(true)}
                    size="sm"
                    className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Pago QR
                  </Button>
                  <Button
                    onClick={() => setShowPaymentDialog(true)}
                    size="sm"
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Pago Manual
                  </Button>
                </div>
              )}
              {sale.financial?.isPaid && (
                <div className="text-green-400 text-sm font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Completamente Pagada
                </div>
              )}
            </div>

            {loadingPayments ? (
              <div className="text-center py-8 text-white/60">Cargando pagos...</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-white/60">No hay pagos registrados</div>
            ) : showTimeline ? (
              <PaymentTimeline payments={payments} />
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex-1">
                      {/* Estado, Método y Monto - Información principal */}
                      <div className="flex items-center gap-3 mb-2">
                        {/* Estado */}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getPaymentStatusColor(payment.status)}`}>
                          {getPaymentStatusIcon(payment.status)}
                          {getPaymentStatusLabel(payment.status)}
                        </span>
                        {/* Método */}
                        <span className="text-white font-medium">
                          {payment.method 
                            ? getPaymentMethodEnumLabel(payment.method)
                            : payment.payment_methods?.label || 'Sin método'}
                        </span>
                        {/* Provider (opcional, solo si está disponible) */}
                        {payment.provider && (
                          <span className="text-white/60 text-xs">
                            ({getPaymentProviderLabel(payment.provider)})
                          </span>
                        )}
                      </div>
                      
                      {/* Información adicional */}
                      {payment.reference && (
                        <div className="text-white/60 text-sm mt-1">
                          Referencia: {payment.reference}
                        </div>
                      )}
                      {payment.confirmed_at && (
                        <div className="text-white/50 text-xs mt-1">
                          Confirmado: {formatDate(payment.confirmed_at)}
                          {payment.confirmed_by && ' (por usuario)'}
                        </div>
                      )}
                      {!payment.confirmed_at && (
                        <div className="text-white/50 text-xs mt-1">
                          Creado: {formatDate(payment.created_at)}
                        </div>
                      )}
                      
                      {/* Backward compatibility - campos antiguos */}
                      {payment.external_reference && (
                        <div className="text-white/50 text-xs mt-1">
                          Ref. Externa: {payment.external_reference}
                        </div>
                      )}
                      {payment.last_webhook && (
                        <div className="text-white/40 text-xs mt-1">
                          Último webhook: {formatDate(payment.last_webhook)}
                        </div>
                      )}
                      
                      {/* Mostrar QR si es pago QR pendiente */}
                      <PaymentQRDisplay payment={payment} />
                      
                      {/* Estados especiales */}
                      {payment.status === 'failed' && (
                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
                          Este pago falló o fue rechazado
                        </div>
                      )}
                      {payment.status === 'refunded' && (
                        <div className="mt-2 p-2 bg-gray-500/10 border border-gray-500/30 rounded text-xs text-gray-300">
                          Este pago fue reembolsado
                        </div>
                      )}
                      {payment.status === 'confirmed' && payment.gateway_metadata?.qr_code && (
                        <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-300">
                          ✓ Pago confirmado (QR ya no es necesario)
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Monto */}
                      <span className="text-white font-semibold text-lg">
                        {formatCurrency(payment.amount)}
                      </span>
                      <div className="flex gap-2">
                        {/* Acción: Confirmar pago */}
                        {canConfirmPayment(payment) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConfirmPayment(payment.id)}
                            disabled={confirmingPaymentId === payment.id}
                            className="text-green-400 hover:text-green-300 hover:bg-green-500/10 disabled:opacity-50"
                          >
                            {confirmingPaymentId === payment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Confirmar
                              </>
                            )}
                          </Button>
                        )}
                        {canDeletePayment(payment) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePayment(payment.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Acciones */}
        {sale.status === 'draft' && !editing && (
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

        {sale.status === 'confirmed' && !sale.financial?.isPaid && (
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

        {sale.status === 'paid' && (
          <div className="neu-elevated border-0 rounded-2xl p-6 bg-green-500/10 border-green-500/30">
            <div className="flex items-center justify-center gap-3 text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <div className="text-center">
                <div className="font-semibold">Venta Completamente Pagada</div>
                <div className="text-sm text-white/60 mt-1">
                  Esta venta está completamente pagada y no puede ser cancelada ni modificada.
                </div>
                {sale.financial?.paymentCompletedAt && (
                  <div className="text-xs text-white/50 mt-2">
                    Completada el {formatDate(sale.financial.paymentCompletedAt)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Diálogo de confirmación */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-background/90 flex items-center justify-center z-50">
            <div className="neu-elevated border-0 rounded-2xl p-6 max-w-md w-full mx-4">
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

        {/* Modal de pago manual */}
        {showPaymentDialog && sale.financial && (
          <PaymentModal
            isOpen={showPaymentDialog}
            onClose={() => setShowPaymentDialog(false)}
            saleId={sale.id}
            balanceAmount={sale.financial.balanceAmount}
            onSuccess={handlePaymentSuccess}
            filterManualOnly={true} // Sprint FE-2: Solo métodos manuales
          />
        )}

        {/* Modal de pago QR */}
        {showQRPaymentDialog && sale.financial && (
          <PaymentQRModal
            isOpen={showQRPaymentDialog}
            onClose={() => setShowQRPaymentDialog(false)}
            saleId={sale.id}
            balanceAmount={sale.financial.balanceAmount}
            onSuccess={handlePaymentSuccess}
          />
        )}

        {/* Modal de pago Mercado Pago */}
        {showMPPaymentDialog && sale.financial && (
          <PaymentMercadoPagoModal
            isOpen={showMPPaymentDialog}
            onClose={() => setShowMPPaymentDialog(false)}
            saleId={sale.id}
            balanceAmount={sale.financial.balanceAmount}
            onSuccess={handlePaymentSuccess}
          />
        )}

        {/* Diálogo de cancelación */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-background/90 flex items-center justify-center z-50">
            <div className="neu-elevated border-0 rounded-2xl p-6 max-w-md w-full mx-4">
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

