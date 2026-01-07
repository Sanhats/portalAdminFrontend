"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { api } from "@/lib/api-client";
import { ArrowLeft, Filter, Search, TrendingUp, TrendingDown, Eye, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function MovementsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cashBoxId, setCashBoxId] = useState<string | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    type: '' as '' | 'income' | 'expense',
    paymentMethod: '' as '' | 'cash' | 'transfer',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMovement, setNewMovement] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'transfer',
    reference: '',
  });
  const [creating, setCreating] = useState(false);

  const loadCashBox = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response: any = await api.getCashBoxes({
        dateFrom: today,
        dateTo: today,
        limit: 1,
      });

      if (response.data && response.data.length > 0) {
        setCashBoxId(response.data[0].id);
        return response.data[0].id;
      } else {
        setError("No hay caja abierta para hoy. Abre una caja primero.");
        return null;
      }
    } catch (err: any) {
      console.error("Error al cargar caja:", err);
      setError(err.message || "Error al cargar caja");
      return null;
    }
  }, []);

  const loadMovements = useCallback(async (boxId: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        limit: 20,
      };
      
      if (filters.type) {
        params.type = filters.type;
      }
      
      if (filters.paymentMethod) {
        params.paymentMethod = filters.paymentMethod;
      }

      const data: any = await api.getCashBoxMovements(boxId, params);
      
      // El backend devuelve { data: [...], pagination: {...} }
      if (data.data) {
        setMovements(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      } else if (Array.isArray(data)) {
        setMovements(data);
        setTotalPages(1);
      } else {
        setMovements([]);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error("Error al cargar movimientos:", err);
      setError(err.message || "Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  }, [page, filters.type, filters.paymentMethod]);

  useEffect(() => {
    const init = async () => {
      const boxId = await loadCashBox();
      if (boxId) {
        await loadMovements(boxId);
      } else {
        setLoading(false);
      }
    };
    init();
  }, [loadCashBox]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Resetear a primera página al filtrar
  };

  const clearFilters = () => {
    setFilters({ type: '', paymentMethod: '', search: '' });
    setPage(1);
  };

  // Recargar movimientos cuando cambian los filtros o la página
  useEffect(() => {
    if (cashBoxId) {
      loadMovements(cashBoxId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cashBoxId, page, filters.type, filters.paymentMethod]);

  const handleCreateMovement = async () => {
    if (!cashBoxId) {
      setError("No hay caja abierta");
      return;
    }

    if (!newMovement.amount || parseFloat(newMovement.amount) <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await api.createCashMovement(cashBoxId, {
        type: newMovement.type,
        amount: parseFloat(newMovement.amount),
        paymentMethod: newMovement.paymentMethod,
        reference: newMovement.reference || undefined,
      });
      setShowCreateModal(false);
      setNewMovement({ type: 'expense', amount: '', paymentMethod: 'cash', reference: '' });
      await loadMovements(cashBoxId);
    } catch (err: any) {
      setError(err.message || "Error al crear movimiento");
    } finally {
      setCreating(false);
    }
  };

  const filteredMovements = movements.filter(movement => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        movement.reference?.toLowerCase().includes(searchLower) ||
        movement.payment_method?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/accounting"
              className="neu-elevated p-2 rounded-[var(--radius)] hover:neu-pressed transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Movimientos</h1>
              <p className="text-muted-foreground mt-1">
                Registro de ingresos y egresos
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {cashBoxId && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="neu-elevated px-4 py-2 rounded-[var(--radius)] text-sm font-medium text-foreground hover:neu-pressed transition-all flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuevo Movimiento
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "neu-elevated px-4 py-2 rounded-[var(--radius)] text-sm font-medium text-foreground hover:neu-pressed transition-all flex items-center gap-2",
                showFilters && "neu-pressed"
              )}
            >
              <Filter className="h-4 w-4" />
              Filtros
            </button>
          </div>
        </div>

        {error && (
          <div className="neu-elevated p-4 rounded-[var(--radius)] bg-red-500/10 border border-red-500/30">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Filtros */}
        {showFilters && (
          <div className="neu-elevated p-4 rounded-[var(--radius)]">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tipo
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-4 py-2 rounded-[var(--radius)] bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todos</option>
                  <option value="income">Ingreso</option>
                  <option value="expense">Egreso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Método
                </label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                  className="w-full px-4 py-2 rounded-[var(--radius)] bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todos</option>
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-[var(--radius)] bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Descripción, referencia..."
                  />
                </div>
              </div>
            </div>
            {(filters.type || filters.paymentMethod || filters.search) && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-muted-foreground hover:text-foreground"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Lista de movimientos */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="neu-elevated p-12 rounded-[var(--radius)] text-center">
            <p className="text-muted-foreground">
              {filters.type || filters.paymentMethod || filters.search
                ? "No se encontraron movimientos con los filtros aplicados"
                : cashBoxId 
                  ? "No hay movimientos registrados para esta caja"
                  : "No hay caja abierta. Abre una caja primero."}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {filteredMovements.map((movement) => (
                <div
                  key={movement.id}
                  className={cn(
                    "neu-elevated p-4 rounded-[var(--radius)] hover:neu-pressed transition-all cursor-pointer",
                    movement.type === 'income' ? "border-l-4 border-green-500" : "border-l-4 border-red-500"
                  )}
                  onClick={() => router.push(`/admin/accounting/movements/${movement.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={cn(
                        "p-2 rounded-[var(--radius)]",
                        movement.type === 'income' ? "bg-green-500/10" : "bg-red-500/10"
                      )}>
                        {movement.type === 'income' ? (
                          <TrendingUp className={cn("h-5 w-5", movement.type === 'income' ? "text-green-400" : "text-red-400")} />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {movement.sale_id 
                              ? `Venta #${movement.sale_id.slice(-4).toUpperCase()}`
                              : movement.reference || 'Sin referencia'}
                          </p>
                          {movement.sale_id && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-300">
                              Automático
                            </span>
                          )}
                          {!movement.sale_id && !movement.payment_id && (
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-500/10 text-gray-300">
                              Manual
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-muted-foreground capitalize">
                            {movement.payment_method}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(movement.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-lg font-bold",
                          movement.type === 'income' ? "text-green-300" : "text-red-300"
                        )}>
                          {movement.type === 'income' ? '+' : '-'}
                          {formatCurrency(Math.abs(parseFloat(movement.amount)))}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/accounting/movements/${movement.id}`);
                        }}
                        className="neu-flat p-2 rounded-[var(--radius)] hover:neu-pressed transition-all"
                      >
                        <Eye className="h-4 w-4 text-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="neu-elevated px-4 py-2 rounded-[var(--radius)] text-sm font-medium text-foreground hover:neu-pressed transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="neu-elevated px-4 py-2 rounded-[var(--radius)] text-sm font-medium text-foreground hover:neu-pressed transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}

        {/* Modal Crear Movimiento Manual */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="neu-elevated p-6 rounded-[var(--radius)] w-full max-w-md mx-4">
              <h3 className="text-xl font-semibold text-foreground mb-4">Nuevo Movimiento Manual</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tipo *
                  </label>
                  <select
                    value={newMovement.type}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                    className="w-full px-4 py-2 rounded-[var(--radius)] bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="income">Ingreso</option>
                    <option value="expense">Egreso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Monto *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newMovement.amount}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-2 rounded-[var(--radius)] bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Método de Pago *
                  </label>
                  <select
                    value={newMovement.paymentMethod}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, paymentMethod: e.target.value as 'cash' | 'transfer' }))}
                    className="w-full px-4 py-2 rounded-[var(--radius)] bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Referencia / Descripción
                  </label>
                  <input
                    type="text"
                    value={newMovement.reference}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, reference: e.target.value }))}
                    className="w-full px-4 py-2 rounded-[var(--radius)] bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: Compra insumos, Ajuste de caja..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Describe el motivo del movimiento
                  </p>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewMovement({ type: 'expense', amount: '', paymentMethod: 'cash', reference: '' });
                      setError(null);
                    }}
                    className="px-4 py-2 rounded-[var(--radius)] text-sm font-medium text-muted-foreground hover:neu-pressed transition-all"
                    disabled={creating}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateMovement}
                    disabled={creating}
                    className="px-4 py-2 rounded-[var(--radius)] text-sm font-medium text-foreground bg-primary hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {creating ? "Creando..." : "Crear Movimiento"}
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
