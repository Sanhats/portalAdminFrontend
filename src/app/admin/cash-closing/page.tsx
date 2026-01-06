"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { api } from "@/lib/api-client";
import { getPaymentMethodEnumLabel } from "@/lib/payment-mappings";
import { Calculator, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface CashClosingData {
  totalExpected: number;
  totalCollected: number;
  difference: number;
  salesCount: number;
  paymentsCount: number;
  pendingAmount: number;
  cancelledAmount: number;
  salesByStatus: {
    total: number;
    confirmed: number;
    paid: number;
    cancelled: number;
  };
  paymentsByMethod: Array<{
    method: string;
    provider: string;
    amount: number;
    count: number;
  }>;
}

export default function CashClosingPage() {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Fecha actual en formato YYYY-MM-DD
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [data, setData] = useState<CashClosingData>({
    totalExpected: 0,
    totalCollected: 0,
    difference: 0,
    salesCount: 0,
    paymentsCount: 0,
    pendingAmount: 0,
    cancelledAmount: 0,
    salesByStatus: {
      total: 0,
      confirmed: 0,
      paid: 0,
      cancelled: 0,
    },
    paymentsByMethod: [],
  });
  const [error, setError] = useState<string | null>(null);

  const loadCashClosing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Usar el endpoint del backend para obtener el resumen de caja diaria
      const reportData: any = await api.getDailyCash({ date: selectedDate });

      // Extraer datos del reporte
      const totalExpected = parseFloat(reportData.financial?.totalSales || '0');
      const totalCollected = parseFloat(reportData.financial?.totalPaid || '0');
      const difference = totalCollected - totalExpected;
      const pendingAmount = parseFloat(reportData.financial?.pendingAmount || '0');
      const cancelledAmount = parseFloat(reportData.financial?.cancelledAmount || '0');
      const salesCount = reportData.sales?.total || 0;
      
      // Contar total de pagos desde el desglose por método
      const paymentsCount = reportData.payments?.byMethod?.reduce((sum: number, method: any) => {
        return sum + (method.count || 0);
      }, 0) || 0;

      setData({
        totalExpected,
        totalCollected,
        difference,
        salesCount,
        paymentsCount,
        pendingAmount,
        cancelledAmount,
        salesByStatus: {
          total: reportData.sales?.total || 0,
          confirmed: reportData.sales?.confirmed || 0,
          paid: reportData.sales?.paid || 0,
          cancelled: reportData.sales?.cancelled || 0,
        },
        paymentsByMethod: reportData.payments?.byMethod || [],
      });
    } catch (err: any) {
      console.error("Error al cargar cierre de caja:", err);
      setError(err.message || "Error al cargar datos de cierre de caja");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadCashClosing();
  }, [loadCashClosing]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cierre de Caja</h1>
            <p className="text-muted-foreground mt-1">
              Resumen financiero del día
            </p>
          </div>
        </div>

        {/* Selector de fecha */}
        <div className="neu-elevated p-4 rounded-[var(--radius)]">
          <label htmlFor="date-select" className="block text-sm font-medium text-foreground mb-2">
            Seleccionar fecha
          </label>
          <input
            id="date-select"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full max-w-xs px-4 py-2 rounded-[var(--radius)] bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Mostrando datos del {formatDate(selectedDate)}
          </p>
        </div>

        {error && (
          <div className="neu-elevated p-4 rounded-[var(--radius)] bg-red-500/10 border border-red-500/30">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Tarjetas de resumen */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Esperado */}
          <div className="neu-elevated p-6 rounded-[var(--radius)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Esperado</h3>
              <DollarSign className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(data.totalExpected)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {data.salesCount} {data.salesCount === 1 ? 'venta' : 'ventas'}
            </p>
          </div>

          {/* Total Cobrado */}
          <div className="neu-elevated p-6 rounded-[var(--radius)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Cobrado</h3>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(data.totalCollected)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {data.paymentsCount} {data.paymentsCount === 1 ? 'pago' : 'pagos'} confirmados
            </p>
          </div>

          {/* Diferencia */}
          <div className={cn(
            "neu-elevated p-6 rounded-[var(--radius)]",
            data.difference >= 0 
              ? "border border-green-500/30" 
              : "border border-red-500/30"
          )}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Diferencia</h3>
              {data.difference >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-400" />
              )}
            </div>
            <p className={cn(
              "text-2xl font-bold",
              data.difference >= 0 ? "text-green-300" : "text-red-300"
            )}>
              {data.difference >= 0 ? '+' : ''}{formatCurrency(data.difference)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {data.difference >= 0 ? 'Sobrante' : 'Faltante'}
            </p>
          </div>

          {/* Resumen */}
          <div className="neu-elevated p-6 rounded-[var(--radius)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Resumen</h3>
              <Calculator className="h-5 w-5 text-purple-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ventas:</span>
                <span className="text-foreground font-medium">{data.salesCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pagos:</span>
                <span className="text-foreground font-medium">{data.paymentsCount}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground">Eficiencia:</span>
                <span className={cn(
                  "font-medium",
                  data.totalExpected > 0 
                    ? (data.totalCollected / data.totalExpected >= 0.95 ? "text-green-300" : "text-yellow-300")
                    : "text-muted-foreground"
                )}>
                  {data.totalExpected > 0 
                    ? `${((data.totalCollected / data.totalExpected) * 100).toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Desglose por método de pago */}
        {data.paymentsByMethod.length > 0 && (
          <div className="neu-elevated p-6 rounded-[var(--radius)]">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Desglose por Método de Pago
            </h3>
            <div className="space-y-3">
              {data.paymentsByMethod.map((method, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-[var(--radius)] neu-flat"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[var(--radius)] neu-pressed flex items-center justify-center">
                      <span className="text-lg font-semibold text-foreground">
                        {method.method.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {getPaymentMethodEnumLabel(method.method as any)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {method.count} {method.count === 1 ? 'pago' : 'pagos'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(method.amount)}
                    </p>
                    {data.totalCollected > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {((method.amount / data.totalCollected) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen de ventas por estado */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="neu-elevated p-6 rounded-[var(--radius)]">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Ventas por Estado
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium text-foreground">{data.salesByStatus.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Confirmadas:</span>
                <span className="font-medium text-blue-300">{data.salesByStatus.confirmed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pagadas:</span>
                <span className="font-medium text-green-300">{data.salesByStatus.paid}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Canceladas:</span>
                <span className="font-medium text-red-300">{data.salesByStatus.cancelled}</span>
              </div>
            </div>
          </div>

          <div className="neu-elevated p-6 rounded-[var(--radius)]">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Montos Pendientes
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pendiente:</span>
                <span className="font-medium text-yellow-300">
                  {formatCurrency(data.pendingAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Cancelado:</span>
                <span className="font-medium text-red-300">
                  {formatCurrency(data.cancelledAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="neu-elevated p-6 rounded-[var(--radius)]">
          <h3 className="text-lg font-semibold text-foreground mb-4">Información</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              • <strong className="text-foreground">Total Esperado:</strong> Suma de todas las ventas confirmadas o pagadas del día.
            </p>
            <p>
              • <strong className="text-foreground">Total Cobrado:</strong> Suma de todos los pagos confirmados del día.
            </p>
            <p>
              • <strong className="text-foreground">Diferencia:</strong> Diferencia entre lo cobrado y lo esperado. Un valor positivo indica sobrante, negativo indica faltante.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

