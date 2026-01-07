"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { api } from "@/lib/api-client";
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, User, FileText, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CashMovement {
  id: string;
  cash_box_id: string;
  type: 'income' | 'expense';
  amount: string;
  payment_method: 'cash' | 'transfer';
  reference?: string;
  payment_id?: string | null;
  sale_id?: string | null;
  created_at: string;
}

export default function MovementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const movementId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [movement, setMovement] = useState<CashMovement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMovement = async () => {
      setLoading(true);
      setError(null);
      try {
        // Obtener todas las cajas y buscar el movimiento
        const today = new Date().toISOString().split('T')[0];
        const boxesResponse: any = await api.getCashBoxes({
          dateFrom: today,
          dateTo: today,
          limit: 10,
        });

        // Buscar el movimiento en todas las cajas
        let foundMovement: CashMovement | null = null;
        for (const box of boxesResponse.data || []) {
          const boxDetails: any = await api.getCashBox(box.id);
          if (boxDetails.movements) {
            foundMovement = boxDetails.movements.find((m: CashMovement) => m.id === movementId) || null;
            if (foundMovement) break;
          }
        }

        if (foundMovement) {
          setMovement(foundMovement);
        } else {
          setError("Movimiento no encontrado");
        }
      } catch (err: any) {
        console.error("Error al cargar movimiento:", err);
        setError(err.message || "Error al cargar movimiento");
      } finally {
        setLoading(false);
      }
    };

    if (movementId) {
      loadMovement();
    }
  }, [movementId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "long",
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

  if (error || !movement) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Link
            href="/admin/accounting/movements"
            className="inline-flex items-center gap-2 neu-elevated px-4 py-2 rounded-[var(--radius)] text-sm font-medium text-foreground hover:neu-pressed transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Movimientos
          </Link>
          <div className="neu-elevated p-4 rounded-[var(--radius)] bg-red-500/10 border border-red-500/30">
            <p className="text-red-300">{error || "Movimiento no encontrado"}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/accounting/movements"
              className="neu-elevated p-2 rounded-[var(--radius)] hover:neu-pressed transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Detalle de Movimiento</h1>
              <p className="text-muted-foreground mt-1">
                Información completa del movimiento
              </p>
            </div>
          </div>
        </div>

        {/* Tarjeta principal */}
        <div className={cn(
          "neu-elevated p-6 rounded-[var(--radius)] border-l-4",
          movement.type === 'income' ? "border-green-500" : "border-red-500"
        )}>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-4 rounded-[var(--radius)]",
                movement.type === 'income' ? "bg-green-500/10" : "bg-red-500/10"
              )}>
                {movement.type === 'income' ? (
                  <TrendingUp className="h-8 w-8 text-green-400" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-400" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {movement.sale_id 
                    ? `Venta #${movement.sale_id.slice(-4).toUpperCase()}`
                    : movement.reference || 'Sin referencia'}
                </h2>
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  movement.type === 'income' 
                    ? "bg-green-500/10 text-green-300" 
                    : "bg-red-500/10 text-red-300"
                )}>
                  {movement.type === 'income' ? 'Ingreso' : 'Egreso'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-4xl font-bold",
                movement.type === 'income' ? "text-green-300" : "text-red-300"
              )}>
                {movement.type === 'income' ? '+' : '-'}
                {formatCurrency(Math.abs(parseFloat(movement.amount)))}
              </p>
            </div>
          </div>

          {/* Información detallada */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="neu-flat p-4 rounded-[var(--radius)]">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Método de Pago</span>
              </div>
              <p className="text-lg font-semibold text-foreground capitalize">{movement.payment_method}</p>
            </div>

            {movement.reference && (
              <div className="neu-flat p-4 rounded-[var(--radius)]">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Referencia</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{movement.reference}</p>
              </div>
            )}

            <div className="neu-flat p-4 rounded-[var(--radius)]">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Fecha y Hora</span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {formatDateTime(movement.created_at)}
              </p>
            </div>

            {(movement.sale_id || movement.payment_id) && (
              <div className="neu-flat p-4 rounded-[var(--radius)]">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Asociado a</span>
                </div>
                <div className="space-y-1">
                  {movement.sale_id && (
                    <p className="text-sm text-foreground">Venta: <span className="font-mono">{movement.sale_id}</span></p>
                  )}
                  {movement.payment_id && (
                    <p className="text-sm text-foreground">Pago: <span className="font-mono">{movement.payment_id}</span></p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Información de la caja */}
          <div className="mt-6 neu-flat p-4 rounded-[var(--radius)]">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Información de Caja</h3>
            <p className="text-sm text-foreground">
              ID de Caja: <span className="font-mono">{movement.cash_box_id}</span>
            </p>
          </div>

          {/* ID del movimiento */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              ID: <span className="font-mono">{movement.id}</span>
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
