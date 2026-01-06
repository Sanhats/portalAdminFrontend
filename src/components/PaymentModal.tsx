"use client";

import { useState, useEffect } from "react";
import { DollarSign, Loader2, X } from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentMethod, PaymentCategory } from "@/types/payments";
import { isManualPaymentMethod } from "@/lib/payment-helpers";
import { getErrorMessage, isIdempotencyError } from "@/lib/error-handler";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string;
  balanceAmount: string;
  onSuccess: () => void;
  filterManualOnly?: boolean; // Para Sprint FE-2: filtrar solo métodos manuales
}

export function PaymentModal({
  isOpen,
  onClose,
  saleId,
  balanceAmount,
  onSuccess,
  filterManualOnly = false,
}: PaymentModalProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
      // Resetear formulario
      setAmount('');
      setPaymentMethodId('');
      setReference('');
      setError(null);
    }
  }, [isOpen, filterManualOnly]);

  const loadPaymentMethods = async () => {
    setLoadingMethods(true);
    try {
      const methods = await api.getPaymentMethods({ isActive: true }) as PaymentMethod[];
      let filteredMethods = Array.isArray(methods) ? methods : [];
      
      // Sprint FE-2: Filtrar solo métodos manuales si se requiere
      if (filterManualOnly) {
        filteredMethods = filteredMethods.filter(method => {
          // Si tiene category, usar el helper
          if (method.category) {
            return isManualPaymentMethod(method.category);
          }
          // Si no tiene category, filtrar por type (cash o transfer)
          return method.type === 'cash' || method.type === 'transfer';
        });
      }
      
      setPaymentMethods(filteredMethods);
    } catch (err) {
      console.error("Error al cargar métodos de pago:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoadingMethods(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(num);
  };

  const handleSubmit = async () => {
    if (!amount || !paymentMethodId) {
      setError('Debes completar todos los campos requeridos');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('El monto debe ser un número positivo');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      // Obtener el método de pago seleccionado para mapear al nuevo enum
      const selectedMethod = paymentMethods.find(m => m.id === paymentMethodId);
      
      // Mapear el tipo del método de pago al nuevo enum según el modelo del backend
      // El backend determina automáticamente el provider si no se proporciona
      let method: 'cash' | 'transfer' | 'mp_point' | 'qr' | 'card' | 'other' = 'other';
      
      if (selectedMethod) {
        // Mapear según el tipo del método de pago
        switch (selectedMethod.type) {
          case 'cash':
            method = 'cash';
            break;
          case 'transfer':
            method = 'transfer';
            break;
          case 'qr':
            method = 'qr';
            break;
          case 'card':
            method = 'card';
            break;
          default:
            method = 'other';
        }
      }
      
      // Generar idempotency key para evitar duplicados
      const idempotencyKey = `${saleId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Crear pago con el nuevo modelo
      // El backend determina automáticamente provider y status según el método
      await api.createPayment(saleId, {
        amount: amountNum,
        method, // Nuevo enum de métodos de pago
        // provider se determina automáticamente en el backend
        // status se determina automáticamente según provider (manual → confirmed, otros → pending)
        reference: reference.trim() || undefined,
        // Mantener paymentMethodId para backward compatibility
        paymentMethodId,
        idempotencyKey,
      });

      // Éxito - cerrar modal y refrescar
      onSuccess();
      onClose();
    } catch (err: any) {
      // Manejo de idempotencia: si el pago ya existe, es un éxito silencioso
      if (isIdempotencyError(err)) {
        onSuccess();
        onClose();
        return;
      }
      
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/90 flex items-center justify-center z-50">
      <div className="neu-elevated border-0 rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <DollarSign className="h-6 w-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Registrar Pago</h3>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-white/70 text-sm mb-4">
              {filterManualOnly 
                ? 'Registra un pago manual (efectivo o transferencia)'
                : 'Registra un nuevo pago para esta venta'}
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/80">Método de Pago</Label>
                {loadingMethods ? (
                  <div className="text-white/60 text-sm">Cargando métodos...</div>
                ) : (
                  <Select
                    value={paymentMethodId}
                    onChange={(e) => setPaymentMethodId(e.target.value)}
                    className="bg-white/5 border-white/10 text-white w-full"
                  >
                    <option value="">Seleccionar método...</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.label}
                      </option>
                    ))}
                  </Select>
                )}
                {paymentMethods.length === 0 && !loadingMethods && (
                  <p className="text-white/50 text-xs">
                    {filterManualOnly 
                      ? 'No hay métodos de pago manual disponibles'
                      : 'No hay métodos de pago disponibles'}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-white/80">Monto</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  step="0.01"
                  min="0"
                />
                <p className="text-white/50 text-xs">
                  Saldo pendiente: {formatCurrency(balanceAmount)}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white/80">Referencia (opcional)</Label>
                <Input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Número de transferencia, comprobante, etc."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 text-white/60 hover:text-white hover:bg-white/10"
            disabled={creating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={creating || !amount || !paymentMethodId || loadingMethods}
            className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 disabled:opacity-50"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Registrar Pago
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

