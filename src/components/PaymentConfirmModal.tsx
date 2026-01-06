"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Payment } from "@/types/payments";
import { getPaymentMethodEnumLabel } from "@/lib/payment-mappings";
import { getErrorMessage } from "@/lib/error-handler";

interface PaymentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onSuccess: () => void;
}

export function PaymentConfirmModal({
  isOpen,
  onClose,
  payment,
  onSuccess,
}: PaymentConfirmModalProps) {
  const [reference, setReference] = useState<string>("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resetear formulario cuando se abre el modal o cambia el pago
  useEffect(() => {
    if (isOpen && payment) {
      setReference(payment.reference || "");
      setError(null);
      setConfirming(false);
    }
  }, [isOpen, payment]);

  const handleClose = () => {
    setReference("");
    setError(null);
    setConfirming(false);
    onClose();
  };

  if (!isOpen || !payment) return null;

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(num);
  };

  const handleConfirm = async () => {
    if (!payment) return;

    setConfirming(true);
    setError(null);

    try {
      // Preparar datos para confirmación
      const confirmData: {
        metadata?: Record<string, any>;
        proofType?: string;
        proofReference?: string;
        proofFileUrl?: string;
      } = {};

      // Si hay una referencia nueva o diferente, agregarla a metadata
      if (reference.trim() && reference.trim() !== payment.reference) {
        confirmData.metadata = {
          ...(payment.metadata || {}),
          reference: reference.trim(),
        };
      }

      // Confirmar el pago
      await api.confirmPayment(payment.id, confirmData);

      // Éxito - cerrar modal y refrescar
      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error("Error al confirmar pago:", err);
      setError(getErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-background/90 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="neu-elevated border-0 rounded-2xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">
                Confirmar Cobro
              </h3>
              <button
                onClick={handleClose}
                className="text-white/60 hover:text-white"
                disabled={confirming}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-white/70 text-sm mb-4">
              Verifica los datos del pago antes de confirmar
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Monto (readonly) */}
              <div className="space-y-2">
                <Label className="text-white/80">Monto</Label>
                <Input
                  type="text"
                  value={formatCurrency(payment.amount)}
                  readOnly
                  className="bg-white/5 border-white/10 text-white cursor-not-allowed"
                />
                <p className="text-white/50 text-xs">
                  Este campo no se puede modificar
                </p>
              </div>

              {/* Método (readonly) */}
              <div className="space-y-2">
                <Label className="text-white/80">Método de Pago</Label>
                <Input
                  type="text"
                  value={
                    payment.method
                      ? getPaymentMethodEnumLabel(payment.method)
                      : payment.payment_methods?.label || "Sin método"
                  }
                  readOnly
                  className="bg-white/5 border-white/10 text-white cursor-not-allowed"
                />
                {payment.provider && (
                  <p className="text-white/50 text-xs">
                    Proveedor: {payment.provider}
                  </p>
                )}
              </div>

              {/* Referencia (opcional, editable) */}
              <div className="space-y-2">
                <Label className="text-white/80">
                  Referencia <span className="text-white/50">(opcional)</span>
                </Label>
                <Textarea
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ej: Nro transferencia, comprobante, etc."
                  className="bg-white/5 border-white/10 text-white min-h-[80px]"
                  disabled={confirming}
                />
                <p className="text-white/50 text-xs">
                  Puedes agregar o modificar la referencia del pago
                </p>
              </div>

              {/* Información adicional */}
              {payment.created_at && (
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-xs">
                    Pago creado:{" "}
                    {new Date(payment.created_at).toLocaleString("es-AR")}
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  disabled={confirming}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {confirming ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirmar Cobro
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

