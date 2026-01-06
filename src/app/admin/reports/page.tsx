"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { api } from "@/lib/api-client";
import { PaymentMethodEnum } from "@/types/payments";
import { getPaymentMethodEnumLabel } from "@/lib/payment-mappings";
import { FileText, Calendar, Filter, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportData {
  totalSales: number;
  totalRevenue: number;
  totalPayments: number;
  totalCollected: number;
  byMethod: Record<PaymentMethodEnum, {
    count: number;
    amount: number;
  }>;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodEnum | 'all'>('all');
  const [data, setData] = useState<ReportData>({
    totalSales: 0,
    totalRevenue: 0,
    totalPayments: 0,
    totalCollected: 0,
    byMethod: {
      cash: { count: 0, amount: 0 },
      transfer: { count: 0, amount: 0 },
      mp_point: { count: 0, amount: 0 },
      qr: { count: 0, amount: 0 },
      card: { count: 0, amount: 0 },
      other: { count: 0, amount: 0 },
    },
  });
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Calcular rango de fechas para el día seleccionado
      const selectedDateObj = new Date(selectedDate);
      selectedDateObj.setHours(0, 0, 0, 0);
      const endDateObj = new Date(selectedDateObj);
      endDateObj.setHours(23, 59, 59, 999);

      const startDateISO = selectedDateObj.toISOString();
      const endDateISO = endDateObj.toISOString();

      // Obtener reporte de ventas por método del día
      const salesByMethodData: any = await api.getSalesByMethod({
        startDate: startDateISO,
        endDate: endDateISO,
      });

      // Obtener reporte de caja diaria
      const dailyCashData: any = await api.getDailyCash({ date: selectedDate });

      // Procesar datos de ventas por método
      const totalSales = salesByMethodData.total?.totalSales || 0;
      const totalRevenue = parseFloat(salesByMethodData.total?.totalAmount || '0');

      // Procesar datos de pagos
      const totalPayments = dailyCashData.payments?.byMethod?.reduce((sum: number, method: any) => {
        return sum + (method.count || 0);
      }, 0) || 0;
      const totalCollected = parseFloat(dailyCashData.payments?.totalAmount || '0');

      // Construir objeto byMethod desde el reporte de ventas por método
      const byMethod: Record<PaymentMethodEnum, { count: number; amount: number }> = {
        cash: { count: 0, amount: 0 },
        transfer: { count: 0, amount: 0 },
        mp_point: { count: 0, amount: 0 },
        qr: { count: 0, amount: 0 },
        card: { count: 0, amount: 0 },
        other: { count: 0, amount: 0 },
      };

      // Mapear datos del reporte de ventas por método
      if (salesByMethodData.byMethod && Array.isArray(salesByMethodData.byMethod)) {
        salesByMethodData.byMethod.forEach((item: any) => {
          if (item.method && byMethod[item.method as PaymentMethodEnum]) {
            byMethod[item.method as PaymentMethodEnum].count = item.totalSales || 0;
            byMethod[item.method as PaymentMethodEnum].amount = parseFloat(item.totalAmount || '0');
          }
        });
      }

      // Si hay filtro por método, aplicar filtro
      if (selectedMethod !== 'all') {
        // Filtrar solo el método seleccionado
        Object.keys(byMethod).forEach((method) => {
          if (method !== selectedMethod) {
            byMethod[method as PaymentMethodEnum] = { count: 0, amount: 0 };
          }
        });
      }

      setData({
        totalSales,
        totalRevenue,
        totalPayments,
        totalCollected,
        byMethod,
      });
    } catch (err: any) {
      console.error("Error al cargar reportes:", err);
      setError(err.message || "Error al cargar datos de reportes");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedMethod]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

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

  const paymentMethods: PaymentMethodEnum[] = ['cash', 'transfer', 'mp_point', 'qr', 'card', 'other'];

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
            <h1 className="text-3xl font-bold text-foreground">Reportes</h1>
            <p className="text-muted-foreground mt-1">
              Análisis de ventas y pagos
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="neu-elevated p-6 rounded-[var(--radius)]">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Filtro por fecha */}
            <div>
              <label htmlFor="date-select" className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="h-4 w-4 inline mr-2" />
                Fecha
              </label>
              <input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 rounded-[var(--radius)] bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(selectedDate)}
              </p>
            </div>

            {/* Filtro por método */}
            <div>
              <label htmlFor="method-select" className="block text-sm font-medium text-foreground mb-2">
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Método de Pago
              </label>
              <select
                id="method-select"
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value as PaymentMethodEnum | 'all')}
                className="w-full px-4 py-2 rounded-[var(--radius)] bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos los métodos</option>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {getPaymentMethodEnumLabel(method)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="neu-elevated p-4 rounded-[var(--radius)] bg-red-500/10 border border-red-500/30">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Resumen general */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="neu-elevated p-6 rounded-[var(--radius)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Ventas</h3>
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">{data.totalSales}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {formatCurrency(data.totalRevenue)} en total
            </p>
          </div>

          <div className="neu-elevated p-6 rounded-[var(--radius)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Pagos</h3>
              <FileText className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">{data.totalPayments}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {formatCurrency(data.totalCollected)} cobrado
            </p>
          </div>

          <div className="neu-elevated p-6 rounded-[var(--radius)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Ingresos</h3>
              <BarChart3 className="h-5 w-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(data.totalRevenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              De {data.totalSales} ventas
            </p>
          </div>

          <div className="neu-elevated p-6 rounded-[var(--radius)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Cobrado</h3>
              <BarChart3 className="h-5 w-5 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(data.totalCollected)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              De {data.totalPayments} pagos
            </p>
          </div>
        </div>

        {/* Reporte por método */}
        <div className="neu-elevated p-6 rounded-[var(--radius)]">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Desglose por Método de Pago
          </h3>
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const methodData = data.byMethod[method];
              if (methodData.count === 0 && selectedMethod !== 'all' && selectedMethod !== method) {
                return null;
              }
              return (
                <div
                  key={method}
                  className="flex items-center justify-between p-4 rounded-[var(--radius)] neu-flat"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[var(--radius)] neu-pressed flex items-center justify-center">
                      <span className="text-lg font-semibold text-foreground">
                        {getPaymentMethodEnumLabel(method).charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {getPaymentMethodEnumLabel(method)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {methodData.count} {methodData.count === 1 ? 'pago' : 'pagos'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(methodData.amount)}
                    </p>
                    {data.totalCollected > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {((methodData.amount / data.totalCollected) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

