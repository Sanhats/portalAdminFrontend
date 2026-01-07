"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { api } from "@/lib/api-client";
import { Wallet, TrendingUp, TrendingDown, DollarSign, Lock, Unlock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CashBox {
  id: string;
  tenant_id: string;
  date: string;
  opening_balance: string;
  closing_balance: string | null;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  totals?: {
    totalIncome: number;
    totalExpense: number;
    finalBalance: number;
    incomeCash: number;
    incomeTransfer: number;
    expenseCash: number;
    expenseTransfer: number;
  };
  associatedMovements?: number;
  pendingPaymentsCount?: number;
}

export default function AccountingPage() {
  const [loading, setLoading] = useState(true);
  const [cashBox, setCashBox] = useState<CashBox | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<{ count: number; hasPending: boolean } | null>(null);

  const loadCashBoxStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Buscar caja de hoy
      const response: any = await api.getCashBoxes({
        dateFrom: today,
        dateTo: today,
        limit: 1,
      });

      if (response.data && response.data.length > 0) {
        const box = response.data[0];
        // Obtener detalles completos de la caja
        const details: any = await api.getCashBox(box.id);
        setCashBox(details);
      } else {
        // No hay caja para hoy
        setCashBox(null);
      }

      // Cargar pagos pendientes
      try {
        const pending: any = await api.getPendingPayments();
        setPendingPayments(pending);
      } catch {
        // Ignorar error si no hay endpoint o no hay permisos
      }
    } catch (err: any) {
      console.error("Error al cargar estado de caja:", err);
      setError(err.message || "Error al cargar estado de caja");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCashBoxStatus();
  }, [loadCashBoxStatus]);

  const handleOpenCashBox = async () => {
    if (!openingAmount || parseFloat(openingAmount) < 0) {
      setError("El monto de apertura debe ser mayor o igual a 0");
      return;
    }

    setProcessing(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      await api.openCashBox({
        date: today,
        openingBalance: parseFloat(openingAmount),
      });
      setShowOpenModal(false);
      setOpeningAmount("");
      await loadCashBoxStatus();
    } catch (err: any) {
      setError(err.message || "Error al abrir la caja");
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseCashBox = async () => {
    if (!cashBox?.id) {
      setError("No hay caja para cerrar");
      return;
    }

    setProcessing(true);
    setError(null);
    try {
      await api.closeCashBox(cashBox.id);
      setShowCloseModal(false);
      await loadCashBoxStatus();
    } catch (err: any) {
      setError(err.message || "Error al cerrar la caja");
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  const statusConfig = {
    open: {
      label: "Caja Abierta",
      color: "text-green-300",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      icon: Unlock,
    },
    closed: {
      label: "Caja Cerrada",
      color: "text-yellow-300",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      icon: Lock,
    },
    none: {
      label: "Sin Caja",
      color: "text-muted-foreground",
      bgColor: "bg-muted/10",
      borderColor: "border-border",
      icon: Wallet,
    },
  };

  const currentStatus = cashBox?.status || 'none';
  const config = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.none;
  const StatusIcon = config.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contabilidad</h1>
            <p className="text-muted-foreground mt-1">
              Gestión de caja y movimientos
            </p>
          </div>
          <Link
            href="/admin/accounting/movements"
            className="neu-elevated px-4 py-2 rounded-[var(--radius)] text-sm font-medium text-foreground hover:neu-pressed transition-all"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Ver Movimientos
          </Link>
        </div>

        {error && (
          <div className="neu-elevated p-4 rounded-[var(--radius)] bg-red-500/10 border border-red-500/30">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Estado de Caja */}
        <div className={cn(
          "neu-elevated p-6 rounded-[var(--radius)] border",
          config.borderColor
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <StatusIcon className={cn("h-6 w-6", config.color)} />
              <h2 className="text-xl font-semibold text-foreground">Caja de Hoy</h2>
            </div>
            <span className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              config.bgColor,
              config.color
            )}>
              {config.label}
            </span>
          </div>

          {currentStatus === 'none' && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                No hay caja abierta para hoy. Abre una caja para comenzar a registrar movimientos.
              </p>
              {pendingPayments?.hasPending && (
                <div className="neu-flat p-4 rounded-[var(--radius)] bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-sm text-yellow-300">
                    ⚠️ Hay {pendingPayments.count} pago(s) confirmado(s) pendiente(s) de asociar. 
                    Se asociarán automáticamente al abrir la caja.
                  </p>
                </div>
              )}
              <button
                onClick={() => setShowOpenModal(true)}
                className="neu-elevated px-6 py-3 rounded-[var(--radius)] font-medium text-foreground hover:neu-pressed transition-all flex items-center gap-2"
              >
                <Unlock className="h-5 w-5" />
                Abrir Caja
              </button>
            </div>
          )}

          {currentStatus === 'open' && cashBox && (
            <div className="space-y-6">
              {/* Tarjetas de resumen */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="neu-flat p-4 rounded-[var(--radius)]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Apertura</h3>
                    <DollarSign className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(parseFloat(cashBox.opening_balance || '0'))}
                  </p>
                  {cashBox.created_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(cashBox.created_at)}
                    </p>
                  )}
                </div>

                <div className="neu-flat p-4 rounded-[var(--radius)]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Ingresos</h3>
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-green-300">
                    {formatCurrency(cashBox.totals?.totalIncome || 0)}
                  </p>
                </div>

                <div className="neu-flat p-4 rounded-[var(--radius)]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Egresos</h3>
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  </div>
                  <p className="text-2xl font-bold text-red-300">
                    {formatCurrency(cashBox.totals?.totalExpense || 0)}
                  </p>
                </div>

                <div className={cn(
                  "neu-flat p-4 rounded-[var(--radius)] border",
                  (cashBox.totals?.finalBalance || 0) >= 0 ? "border-green-500/30" : "border-red-500/30"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Saldo</h3>
                    <Wallet className={cn(
                      "h-4 w-4",
                      (cashBox.totals?.finalBalance || 0) >= 0 ? "text-green-400" : "text-red-400"
                    )} />
                  </div>
                  <p className={cn(
                    "text-2xl font-bold",
                    (cashBox.totals?.finalBalance || 0) >= 0 ? "text-green-300" : "text-red-300"
                  )}>
                    {formatCurrency(cashBox.totals?.finalBalance || 0)}
                  </p>
                </div>
              </div>

              {/* Información adicional */}
              {cashBox.associatedMovements !== undefined && (
                <div className="text-sm text-muted-foreground">
                  Movimientos asociados: <span className="text-foreground">{cashBox.associatedMovements}</span>
                </div>
              )}
              {cashBox.pendingPaymentsCount !== undefined && cashBox.pendingPaymentsCount > 0 && (
                <div className="text-sm text-yellow-300">
                  Pagos pendientes: <span className="text-foreground">{cashBox.pendingPaymentsCount}</span>
                </div>
              )}

              {/* Botón cerrar caja */}
              <button
                onClick={() => setShowCloseModal(true)}
                className="neu-elevated px-6 py-3 rounded-[var(--radius)] font-medium text-foreground hover:neu-pressed transition-all flex items-center gap-2"
              >
                <Lock className="h-5 w-5" />
                Cerrar Caja
              </button>
            </div>
          )}

          {currentStatus === 'closed' && cashBox && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="neu-flat p-4 rounded-[var(--radius)]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Apertura</h3>
                    <DollarSign className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(parseFloat(cashBox.opening_balance || '0'))}
                  </p>
                </div>

                <div className="neu-flat p-4 rounded-[var(--radius)]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Ingresos</h3>
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  </div>
                  <p className="text-xl font-bold text-green-300">
                    {formatCurrency(cashBox.totals?.totalIncome || 0)}
                  </p>
                </div>

                <div className="neu-flat p-4 rounded-[var(--radius)]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Egresos</h3>
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  </div>
                  <p className="text-xl font-bold text-red-300">
                    {formatCurrency(cashBox.totals?.totalExpense || 0)}
                  </p>
                </div>

                <div className="neu-flat p-4 rounded-[var(--radius)]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Cierre</h3>
                    <Lock className="h-4 w-4 text-yellow-400" />
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(parseFloat(cashBox.closing_balance || '0'))}
                  </p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                {cashBox.updated_at && (
                  <p>Cerrada el: <span className="text-foreground">{formatDateTime(cashBox.updated_at)}</span></p>
                )}
              </div>

              <p className="text-muted-foreground">
                La caja está cerrada. Abre una nueva caja para el día de hoy.
              </p>
            </div>
          )}
        </div>

        {/* Modal Abrir Caja */}
        {showOpenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="neu-elevated p-6 rounded-[var(--radius)] w-full max-w-md mx-4">
              <h3 className="text-xl font-semibold text-foreground mb-4">Abrir Caja</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Monto de Apertura *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    className="w-full px-4 py-2 rounded-[var(--radius)] bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowOpenModal(false);
                      setOpeningAmount("");
                    }}
                    className="px-4 py-2 rounded-[var(--radius)] text-sm font-medium text-muted-foreground hover:neu-pressed transition-all"
                    disabled={processing}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleOpenCashBox}
                    disabled={processing}
                    className="px-4 py-2 rounded-[var(--radius)] text-sm font-medium text-foreground bg-primary hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {processing ? "Abriendo..." : "Abrir Caja"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Cerrar Caja */}
        {showCloseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="neu-elevated p-6 rounded-[var(--radius)] w-full max-w-md mx-4">
              <h3 className="text-xl font-semibold text-foreground mb-4">Cerrar Caja</h3>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="neu-flat p-4 rounded-[var(--radius)]">
                    <p className="text-sm text-muted-foreground mb-1">Apertura</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(parseFloat(cashBox?.opening_balance || '0'))}
                    </p>
                  </div>
                  <div className="neu-flat p-4 rounded-[var(--radius)] bg-green-500/10">
                    <p className="text-sm text-muted-foreground mb-1">Total Ingresos</p>
                    <p className="text-lg font-semibold text-green-300">
                      {formatCurrency(cashBox?.totals?.totalIncome || 0)}
                    </p>
                  </div>
                  <div className="neu-flat p-4 rounded-[var(--radius)] bg-red-500/10">
                    <p className="text-sm text-muted-foreground mb-1">Total Egresos</p>
                    <p className="text-lg font-semibold text-red-300">
                      {formatCurrency(cashBox?.totals?.totalExpense || 0)}
                    </p>
                  </div>
                  <div className="neu-flat p-4 rounded-[var(--radius)] border-2 border-primary">
                    <p className="text-sm text-muted-foreground mb-1">Saldo Final Calculado</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(cashBox?.totals?.finalBalance || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Este será el saldo de cierre registrado.
                    </p>
                  </div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-[var(--radius)] p-3">
                  <p className="text-sm text-yellow-300">
                    ⚠️ Al cerrar la caja, no podrás crear más movimientos para el día de hoy.
                  </p>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowCloseModal(false);
                    }}
                    className="px-4 py-2 rounded-[var(--radius)] text-sm font-medium text-muted-foreground hover:neu-pressed transition-all"
                    disabled={processing}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCloseCashBox}
                    disabled={processing}
                    className="px-4 py-2 rounded-[var(--radius)] text-sm font-medium text-foreground bg-primary hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {processing ? "Cerrando..." : "Confirmar Cierre"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
