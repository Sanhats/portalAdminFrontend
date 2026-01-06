"use client";

import { useState, useEffect, useRef } from "react";
import { QrCode, Loader2, X, CheckCircle2, Copy, Clock, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PaymentMethod, Payment } from "@/types/payments";
import { isQRPaymentMethod } from "@/lib/payment-helpers";
import { getErrorMessage } from "@/lib/error-handler";
import Notification from "@/components/Notification";
import { fixQRCodeImage } from "@/lib/qr-crc-fix";

interface PaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string;
  balanceAmount: string;
  onSuccess: () => void;
}

export function PaymentQRModal({
  isOpen,
  onClose,
  saleId,
  balanceAmount,
  onSuccess,
}: PaymentQRModalProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPayment, setCreatedPayment] = useState<Payment | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [polling, setPolling] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [correctedQRCode, setCorrectedQRCode] = useState<string | undefined>(undefined);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const POLLING_INTERVAL = 5000; // 5 segundos

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
      // Resetear formulario
      setAmount('');
      setPaymentMethodId('');
      setReference('');
      setError(null);
      setCreatedPayment(null);
      setPolling(false);
      setTimeRemaining('');
      setIsExpired(false);
    }

    // Cleanup polling al cerrar
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isOpen]);

  // Cleanup polling al desmontar
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // Manejo de expiración del QR
  useEffect(() => {
    if (!createdPayment?.gateway_metadata?.expires_at) {
      setIsExpired(false);
      setTimeRemaining('');
      return;
    }

    const expiresAt = createdPayment.gateway_metadata.expires_at;
    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expirado');
        stopPolling();
        return;
      }

      setIsExpired(false);
      
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [createdPayment?.gateway_metadata?.expires_at]);

  const loadPaymentMethods = async () => {
    setLoadingMethods(true);
    try {
      const methods = await api.getPaymentMethods({ isActive: true }) as PaymentMethod[];
      const filteredMethods = Array.isArray(methods) 
        ? methods.filter(method => {
            // Filtrar SOLO el método QR principal que funciona (code='qr')
            // Este es el único método que genera QR interoperable válido
            const isMainQR = method.code === 'qr';
            
            // Si tiene category, verificar que sea QR
            if (method.category) {
              const isQR = isQRPaymentMethod(method.category);
              // Solo aceptar el método principal 'qr'
              return isQR && isMainQR;
            }
            
            // Si no tiene category, filtrar por type (qr) y código 'qr'
            return method.type === 'qr' && isMainQR;
          })
          // Ordenar: método 'qr' primero
          .sort((a, b) => {
            if (a.code === 'qr') return -1;
            if (b.code === 'qr') return 1;
            return 0;
          })
          // Tomar solo el primero (el método principal que funciona)
          .slice(0, 1)
        : [];
      
      setPaymentMethods(filteredMethods);
      
      // Auto-seleccionar el método si solo hay uno
      if (filteredMethods.length === 1) {
        setPaymentMethodId(filteredMethods[0].id);
      }
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

  const handleCreateQRPayment = async () => {
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
      // Para pagos QR, el método siempre es 'qr'
      const idempotencyKey = `${saleId}-qr-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Crear pago con el nuevo modelo
      // El backend determina automáticamente provider (mercadopago) y status (pending)
      const payment = await api.createPayment(saleId, {
        amount: amountNum,
        method: 'qr', // Nuevo enum de métodos de pago
        // provider se determina automáticamente: mercadopago (porque method = qr)
        // status se determina automáticamente: pending (porque provider = mercadopago)
        paymentMethodId, // Mantener para backward compatibility
        reference: reference.trim() || undefined,
        idempotencyKey,
      });

      setCreatedPayment(payment);
      
      // Iniciar polling si el pago está pending
      if (payment.status === 'pending') {
        startPolling(payment.id);
      }
      
      setNotification({
        message: "Pago QR creado. Muestra el código al cliente.",
        type: "success",
      });
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const startPolling = (paymentId: string) => {
    setPolling(true);
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        // Verificar estado del pago
        const paymentsData = await api.getSalePayments(saleId) as { payments: Payment[] };
        const payment = paymentsData.payments?.find((p: Payment) => p.id === paymentId);

        if (payment) {
          // Actualizar estado del pago
          setCreatedPayment(payment);

          // Si el pago se confirmó, detener polling
          if (payment.status === 'confirmed') {
            stopPolling();
            setNotification({
              message: "¡Pago confirmado exitosamente!",
              type: "success",
            });
            // Refrescar y cerrar después de un momento
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 2000);
          } else if (payment.status === 'failed') {
            stopPolling();
            setError("El pago fue rechazado o falló");
          }
        }
      } catch (err) {
        console.error("Error en polling:", err);
        // Continuar polling aunque haya error
      }
    }, POLLING_INTERVAL);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setPolling(false);
  };

  // Manejo de expiración del QR
  useEffect(() => {
    if (!createdPayment?.gateway_metadata?.expires_at) {
      setIsExpired(false);
      setTimeRemaining('');
      return;
    }

    const expiresAt = createdPayment.gateway_metadata.expires_at;
    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expirado');
        stopPolling();
        return;
      }

      setIsExpired(false);
      
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [createdPayment?.gateway_metadata?.expires_at]);

  const handleCopyReference = () => {
    if (createdPayment?.reference || createdPayment?.external_reference) {
      const ref = createdPayment.reference || createdPayment.external_reference || '';
      navigator.clipboard.writeText(ref);
      setNotification({
        message: "Referencia copiada al portapapeles",
        type: "success",
      });
    }
  };

  const handleManualRefresh = async () => {
    if (!createdPayment) return;
    
    try {
      await onSuccess();
      const paymentsData = await api.getSalePayments(saleId) as { payments: Payment[] };
      const payment = paymentsData.payments?.find((p: Payment) => p.id === createdPayment.id);
      
      if (payment) {
        setCreatedPayment(payment);
        if (payment.status === 'confirmed') {
          setNotification({
            message: "¡Pago confirmado exitosamente!",
            type: "success",
          });
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleClose = () => {
    stopPolling();
    if (createdPayment) {
      // Si ya se creó el pago, refrescar y cerrar
      onSuccess();
    }
    onClose();
  };

  // Corregir el QR si el payload tiene CRC incorrecto
  useEffect(() => {
    if (createdPayment?.gateway_metadata?.qr_code && createdPayment?.gateway_metadata?.qr_payload) {
      fixQRCodeImage(
        createdPayment.gateway_metadata.qr_code,
        createdPayment.gateway_metadata.qr_payload
      )
        .then((corrected) => {
          if (corrected && corrected !== createdPayment.gateway_metadata?.qr_code) {
            setCorrectedQRCode(corrected);
          } else {
            setCorrectedQRCode(undefined);
          }
        })
        .catch(() => {
          setCorrectedQRCode(undefined);
        });
    } else {
      setCorrectedQRCode(undefined);
    }
  }, [createdPayment?.gateway_metadata?.qr_code, createdPayment?.gateway_metadata?.qr_payload]);

  if (!isOpen) return null;

  // Si ya se creó el pago, mostrar QR/referencia según estado
  if (createdPayment) {
    const isPending = createdPayment.status === 'pending';
    const isConfirmed = createdPayment.status === 'confirmed';
    const isFailed = createdPayment.status === 'failed';
    const qrCode = correctedQRCode || createdPayment.gateway_metadata?.qr_code;
    const expiresAt = createdPayment.gateway_metadata?.expires_at;
    const paymentReference = createdPayment.gateway_metadata?.reference || createdPayment.reference;
    const hasSuggestedTransfer = createdPayment.gateway_metadata?.confidence && createdPayment.gateway_metadata?.confidence > 0.5;

    const handleConfirmSuggestedPayment = async () => {
      if (!createdPayment) return;
      try {
        await api.confirmPayment(createdPayment.id);
        setNotification({
          message: "Pago confirmado exitosamente",
          type: "success",
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };

    return (
      <div className="fixed inset-0 bg-background/90 flex items-center justify-center z-50 overflow-y-auto">
        <div className="neu-elevated border-0 rounded-2xl p-6 max-w-lg w-full mx-4 my-8">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className={`p-2 rounded-lg flex-shrink-0 ${
              isConfirmed ? 'bg-green-500/20' : 
              isFailed ? 'bg-red-500/20' : 
              'bg-yellow-500/20'
            }`}>
              {isConfirmed ? (
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              ) : isFailed ? (
                <X className="h-6 w-6 text-red-400" />
              ) : (
                <QrCode className="h-6 w-6 text-yellow-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">
                  {isConfirmed ? 'Pago Confirmado' : 
                   isFailed ? 'Pago Fallido' : 
                   'Pago QR - Esperando Pago'}
                </h3>
                <button
                  onClick={handleClose}
                  className="text-white/60 hover:text-white flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Estado visual */}
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                isConfirmed ? 'bg-green-500/20 text-green-400' : 
                isFailed ? 'bg-red-500/20 text-red-400' : 
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                {isConfirmed && <CheckCircle className="h-3 w-3" />}
                {isFailed && <X className="h-3 w-3" />}
                <span>
                  {isConfirmed ? 'Confirmado' : isFailed ? 'Fallido' : 'Esperando pago'}
                </span>
              </div>
            </div>
          </div>

          {/* Monto */}
          <div className="mb-6 text-center">
            <div className="text-white/60 text-sm mb-1">Monto a pagar</div>
            <div className="text-white text-3xl font-bold">
              {formatCurrency(createdPayment.amount)}
            </div>
          </div>

          {/* QR Code - Simplificado para máximo escaneo */}
          {isPending && qrCode && (
            <div className="mb-6">
              <div className="text-center mb-4">
                <div className="text-white/60 text-xs mb-3">Escaneá este código con tu billetera</div>
                {/* QR Code - Optimizado para escaneo máximo */}
                <div className="bg-white p-8 rounded-lg inline-block shadow-lg">
                  <img 
                    src={qrCode} 
                    alt="QR Code de pago" 
                    width="400"
                    height="400"
                    style={{ 
                      width: '400px',
                      height: '400px',
                      display: 'block',
                      imageRendering: 'crisp-edges',
                      backgroundColor: '#FFFFFF'
                    }}
                    draggable={false}
                    loading="eager"
                  />
                </div>
                {isExpired && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
                    ⚠️ QR Expirado
                  </div>
                )}
                {expiresAt && !isExpired && timeRemaining && (
                  <div className="mt-3 flex items-center justify-center gap-1 text-yellow-400 text-xs">
                    <Clock className="h-3 w-3" />
                    <span>Expira en: {timeRemaining}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Referencia de Pago (MUY IMPORTANTE) */}
          {paymentReference && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="text-blue-400 text-xs font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-3 w-3" />
                Referencia de pago
              </div>
              <div className="text-white text-center mb-2">
                <code className="text-lg font-mono font-bold bg-white/10 px-4 py-2 rounded block">
                  {paymentReference}
                </code>
              </div>
              <div className="text-blue-300/80 text-xs text-center">
                Usá esta referencia al pagar para que el sistema lo confirme automáticamente
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(paymentReference);
                  setNotification({
                    message: "Referencia copiada al portapapeles",
                    type: "success",
                  });
                }}
                className="w-full mt-2 text-blue-300 hover:text-blue-200 hover:bg-blue-500/20"
              >
                <Copy className="h-3 w-3 mr-2" />
                Copiar referencia
              </Button>
            </div>
          )}

          {/* Instrucciones de pago */}
          {isPending && qrCode && (
            <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-white/80 text-sm font-semibold mb-3">Cómo pagar:</div>
              <ul className="text-white/60 text-xs space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">1.</span>
                  <span>Escaneá el QR con cualquier billetera (Mercado Pago, Ualá, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">2.</span>
                  <span>Pagá el monto indicado: <strong className="text-white">{formatCurrency(createdPayment.amount)}</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">3.</span>
                  <span>Usá la referencia mostrada al realizar el pago</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">4.</span>
                  <span>El pago se confirmará automáticamente</span>
                </li>
              </ul>
            </div>
          )}

          {/* Confirmación asistida (si backend lo sugiere) */}
          {isPending && hasSuggestedTransfer && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-green-400 text-sm font-semibold mb-1">
                    Transferencia detectada
                  </div>
                  <div className="text-green-300/80 text-xs mb-3">
                    El sistema detectó una transferencia que coincide con este pago (confianza: {Math.round((createdPayment.gateway_metadata?.confidence || 0) * 100)}%)
                  </div>
                  <Button
                    onClick={handleConfirmSuggestedPayment}
                    className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30"
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar pago detectado
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Estado final */}
          {isConfirmed && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
              <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <div className="text-green-400 text-sm font-semibold">
                ✓ El pago ha sido confirmado exitosamente
              </div>
            </div>
          )}

          {isFailed && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
              <X className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <div className="text-red-400 text-sm font-semibold">
                ✗ El pago fue rechazado o falló
              </div>
            </div>
          )}

          {/* Polling indicator */}
          {isPending && polling && (
            <div className="mb-6 flex items-center justify-center gap-2 text-white/60 text-xs">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verificando estado del pago automáticamente...</span>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3">
            {isPending && !hasSuggestedTransfer && (
              <Button
                variant="ghost"
                onClick={handleManualRefresh}
                className="flex-1 text-white/60 hover:text-white hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Estado
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleClose}
              className={`flex-1 text-white/60 hover:text-white hover:bg-white/10 ${isPending && !hasSuggestedTransfer ? '' : 'flex-1'}`}
            >
              {isConfirmed ? 'Cerrar' : 'Cerrar y Verificar Más Tarde'}
            </Button>
          </div>
          
          {notification && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          )}
        </div>
      </div>
    );
  }

  // Formulario para crear pago QR
  return (
    <div className="fixed inset-0 bg-background/90 flex items-center justify-center z-50">
      <div className="neu-elevated border-0 rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <QrCode className="h-6 w-6 text-yellow-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Crear Pago QR</h3>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-white/70 text-sm mb-4">
              Crea un pago QR que quedará pendiente hasta confirmación manual
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Método de Pago QR - Solo mostrar el método principal que funciona */}
              {paymentMethods.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-white/80">Método de Pago QR</Label>
                  {loadingMethods ? (
                    <div className="text-white/60 text-sm">Cargando métodos...</div>
                  ) : paymentMethods.length === 1 ? (
                    <div className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm">
                      {paymentMethods[0].label}
                    </div>
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
                </div>
              )}
              {paymentMethods.length === 0 && !loadingMethods && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-300 text-sm">
                    No hay métodos de pago QR disponibles. Contacta al administrador.
                  </p>
                </div>
              )}
              
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
                  placeholder="Número de referencia, código, etc."
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
            onClick={handleCreateQRPayment}
            disabled={creating || !amount || !paymentMethodId || loadingMethods}
            className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 disabled:opacity-50"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                Crear Pago QR
              </>
            )}
          </Button>
        </div>
        
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  );
}

