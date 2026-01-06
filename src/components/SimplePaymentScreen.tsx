"use client";

import { useState, useRef } from "react";
import { DollarSign, Building2, X, CheckCircle2, Loader2, FileImage, Camera } from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Notification from "@/components/Notification";
import { getErrorMessage } from "@/lib/error-handler";

interface SimplePaymentScreenProps {
  saleId: string;
  totalAmount: number;
  onComplete: () => void;
  onCancel: () => void;
}

export function SimplePaymentScreen({
  saleId,
  totalAmount,
  onComplete,
  onCancel,
}: SimplePaymentScreenProps) {
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'transfer' | null>(null);
  const [reference, setReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showTransferDetails, setShowTransferDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setNotification({
        message: "El archivo es demasiado grande. Máximo 5MB",
        type: "error",
      });
      return;
    }

    setProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCashPayment = async () => {
    setProcessing(true);
    try {
      await api.createPayment(saleId, {
        amount: totalAmount,
        method: 'cash',
      });

      setNotification({
        message: `✅ Cobro de ${formatCurrency(totalAmount)} registrado exitosamente`,
        type: "success",
      });

      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error: any) {
      console.error("Error al registrar cobro en efectivo:", error);
      setNotification({
        message: getErrorMessage(error),
        type: "error",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleTransferPayment = async () => {
    if (!showTransferDetails) {
      setShowTransferDetails(true);
      return;
    }

    setProcessing(true);
    try {
      // Si hay comprobante, subirlo primero
      let proofUrl: string | undefined;
      if (proofFile) {
        try {
          const uploadResponse = await api.uploadImage(proofFile) as { url?: string; comprobante_url?: string; file?: { url: string } };
          proofUrl = uploadResponse.url || uploadResponse.comprobante_url || uploadResponse.file?.url;
        } catch (uploadError) {
          console.error("Error al subir comprobante:", uploadError);
          // Continuar sin comprobante si falla la subida
        }
      }

      // Crear pago de transferencia
      // El backend automáticamente determina:
      // - provider: "banco" (para method: "transfer")
      // - status: "pending" (para provider: "banco")
      await api.createPayment(saleId, {
        amount: totalAmount,
        method: 'transfer',
        reference: reference.trim() || undefined,
        metadata: proofUrl ? { comprobante_url: proofUrl } : undefined,
      });

      setNotification({
        message: `✅ Pago de ${formatCurrency(totalAmount)} registrado como pendiente. Puedes confirmarlo más tarde.`,
        type: "success",
      });

      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error: any) {
      console.error("Error al registrar cobro por transferencia:", error);
      setNotification({
        message: getErrorMessage(error),
        type: "error",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (selectedMethod === null) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="neu-elevated border-0 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Cobrar Venta</h2>
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="text-center py-6">
            <p className="text-white/60 text-sm mb-2">Total a cobrar</p>
            <p className="text-5xl font-bold text-white mb-4">{formatCurrency(totalAmount)}</p>
          </div>
        </div>

        {/* Métodos de pago */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Efectivo */}
          <button
            onClick={handleCashPayment}
            disabled={processing}
            className="neu-elevated border-0 rounded-2xl p-8 bg-green-600/20 hover:bg-green-600/30 active:bg-green-600/40 border-2 border-green-500/50 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-green-500/20 rounded-full">
                <DollarSign className="h-12 w-12 text-green-400" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Efectivo</h3>
                <p className="text-white/70 text-sm">Pago confirmado automáticamente</p>
              </div>
              {processing && (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              )}
            </div>
          </button>

          {/* Transferencia */}
          <button
            onClick={() => setSelectedMethod('transfer')}
            disabled={processing}
            className="neu-elevated border-0 rounded-2xl p-8 bg-blue-600/20 hover:bg-blue-600/30 active:bg-blue-600/40 border-2 border-blue-500/50 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-blue-500/20 rounded-full">
                <Building2 className="h-12 w-12 text-blue-400" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Transferencia</h3>
                <p className="text-white/70 text-sm">Pago pendiente de confirmación</p>
              </div>
            </div>
          </button>
        </div>

        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    );
  }

  // Vista de detalles de transferencia
  if (selectedMethod === 'transfer') {
    return (
      <div className="space-y-4">
        {/* Header compacto */}
        <div className="neu-elevated border-0 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Transferencia</h2>
              <p className="text-white/60 text-sm">{formatCurrency(totalAmount)}</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedMethod(null);
                setShowTransferDetails(false);
                setReference("");
                setProofFile(null);
                setProofPreview(null);
              }}
              className="text-white/60 hover:text-white hover:bg-white/10 h-10 w-10 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Formulario de transferencia - Optimizado para móvil */}
        <div className="neu-elevated border-0 rounded-2xl p-4 sm:p-6 space-y-4">
          {/* Referencia - Opcional, compacto */}
          <div className="space-y-2">
            <Label className="text-white/80 text-sm">Referencia (opcional)</Label>
            <Input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Número, alias, etc."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12 text-base"
              inputMode="text"
            />
          </div>

          {/* Comprobante - Prioridad visual */}
          <div className="space-y-3">
            <Label className="text-white/80 text-sm">Comprobante (opcional)</Label>
            {proofPreview ? (
              <div className="space-y-3">
                {/* Preview grande y visible */}
                <div className="relative rounded-xl overflow-hidden border-2 border-white/20 bg-white/5">
                  <img
                    src={proofPreview}
                    alt="Comprobante"
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                  <div className="absolute top-2 right-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setProofFile(null);
                        setProofPreview(null);
                        // Resetear inputs para permitir seleccionar otra imagen
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        if (cameraInputRef.current) cameraInputRef.current.value = '';
                      }}
                      className="bg-red-500/80 hover:bg-red-500 text-white h-10 w-10 p-0 rounded-full shadow-lg"
                      size="sm"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <p className="text-white/60 text-xs text-center">
                  ✓ Comprobante listo. Puedes tomar otra foto si lo necesitas.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Botones grandes para móvil */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => cameraInputRef.current?.click()}
                    className="h-16 bg-blue-600/20 hover:bg-blue-600/30 active:bg-blue-600/40 border-2 border-blue-500/50 text-white font-semibold text-base touch-manipulation"
                  >
                    <Camera className="h-6 w-6 mr-2" />
                    Tomar Foto
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-16 bg-white/10 hover:bg-white/20 active:bg-white/30 border-2 border-white/20 text-white font-semibold text-base touch-manipulation"
                  >
                    <FileImage className="h-6 w-6 mr-2" />
                    Seleccionar
                  </Button>
                </div>
                <p className="text-white/50 text-xs text-center">
                  Puedes adjuntar un comprobante ahora o confirmarlo más tarde
                </p>
              </div>
            )}
          </div>

          {/* Botones de acción - Fijos en la parte inferior en móvil */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedMethod(null);
                setShowTransferDetails(false);
                setReference("");
                setProofFile(null);
                setProofPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                if (cameraInputRef.current) cameraInputRef.current.value = '';
              }}
              className="flex-1 h-14 text-white/60 hover:text-white hover:bg-white/10 text-base font-medium"
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleTransferPayment}
              disabled={processing}
              className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-lg shadow-lg shadow-blue-600/30 disabled:opacity-50 touch-manipulation"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Registrar Pago
                </>
              )}
            </Button>
          </div>
        </div>

        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    );
  }

  return null;
}

