"use client";

import { useState, useEffect, useRef } from "react";
import { CreditCard, Loader2, X, ExternalLink, RefreshCw, Clock } from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PaymentMethod } from "@/types/payments";
import { isGatewayPaymentMethod } from "@/lib/payment-helpers";
import { getErrorMessage } from "@/lib/error-handler";
import Notification from "@/components/Notification";

interface PaymentMercadoPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string;
  balanceAmount: string;
  onSuccess: () => void;
}

export function PaymentMercadoPagoModal({
  isOpen,
  onClose,
  saleId,
  balanceAmount,
  onSuccess,
}: PaymentMercadoPagoModalProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPayment, setCreatedPayment] = useState<any>(null);
  const [polling, setPolling] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  const [timeout, setTimeout] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const MAX_POLLING_ATTEMPTS = 60; // 10 minutos (60 * 10s)
  const POLLING_INTERVAL = 10000; // 10 segundos

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
      // Resetear formulario
      setAmount('');
      setPaymentMethodId('');
      setError(null);
      setCreatedPayment(null);
      setPolling(false);
      setPollingCount(0);
      setTimeout(false);
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
      }
    };
  }, []);

  const loadPaymentMethods = async () => {
    setLoadingMethods(true);
    try {
      const methods = await api.getPaymentMethods({ isActive: true }) as PaymentMethod[];
      const filteredMethods = Array.isArray(methods) 
        ? methods.filter(method => {
            // Filtrar por código que contenga 'mercadopago' o 'mp'
            const codeMatch = method.code?.toLowerCase().includes('mercadopago') || 
                             method.code?.toLowerCase().includes('mp') ||
                             method.label?.toLowerCase().includes('mercadopago') ||
                             method.label?.toLowerCase().includes('mercado pago');
            
            // Si tiene category, verificar que sea gateway
            if (method.category) {
              return isGatewayPaymentMethod(method.category) && codeMatch;
            }
            // Si no tiene category, filtrar por type (gateway) y código
            return method.type === 'gateway' && codeMatch;
          })
        : [];
      
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

  const handleCreateMPPayment = async () => {
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
      
      // Mapear el tipo del método de pago al nuevo enum
      // Para Mercado Pago, puede ser 'mp_point' o 'qr'
      let method: 'cash' | 'transfer' | 'mp_point' | 'qr' | 'card' | 'other' = 'mp_point';
      
      if (selectedMethod) {
        switch (selectedMethod.type) {
          case 'qr':
            method = 'qr';
            break;
          case 'gateway':
          default:
            method = 'mp_point';
            break;
        }
      }
      
      const idempotencyKey = `${saleId}-mp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Crear pago con el nuevo modelo
      // El backend determina automáticamente provider (mercadopago) y status (pending)
      const payment = await api.createPayment(saleId, {
        amount: amountNum,
        method, // Nuevo enum de métodos de pago
        // provider se determina automáticamente: mercadopago
        // status se determina automáticamente: pending (porque provider = mercadopago)
        paymentMethodId, // Mantener para backward compatibility
        idempotencyKey,
      });

      setCreatedPayment(payment);
      setNotification({
        message: "Pago Mercado Pago creado. Redirigiendo...",
        type: "success",
      });

      // Iniciar polling automático
      startPolling(payment.id);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const startPolling = (paymentId: string) => {
    setPolling(true);
    setPollingCount(0);
    setTimeout(false);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        setPollingCount(prev => {
          const newCount = prev + 1;
          
          // Timeout después de MAX_POLLING_ATTEMPTS
          if (newCount >= MAX_POLLING_ATTEMPTS) {
            setTimeout(true);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setPolling(false);
            return newCount;
          }

          return newCount;
        });

        // Verificar estado del pago
        const paymentsData = await api.getSalePayments(saleId) as { payments: any[] };
        const payment = paymentsData.payments?.find((p: any) => p.id === paymentId);

        if (payment && payment.status === 'confirmed') {
          // Pago confirmado - detener polling y refrescar
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setPolling(false);
          setNotification({
            message: "¡Pago confirmado exitosamente!",
            type: "success",
          });
          onSuccess();
          // Cerrar modal después de un momento
          (setTimeout as typeof global.setTimeout)(() => onClose(), 2000);
        } else if (payment && payment.status === 'failed') {
          // Pago fallido - detener polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setPolling(false);
          setError("El pago fue rechazado o falló");
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

  const handleManualRefresh = async () => {
    if (!createdPayment) return;
    
    try {
      await onSuccess();
      const paymentsData = await api.getSalePayments(saleId) as { payments: any[] };
      const payment = paymentsData.payments?.find((p: any) => p.id === createdPayment.id);
      
      if (payment && payment.status === 'confirmed') {
        setNotification({
          message: "¡Pago confirmado exitosamente!",
          type: "success",
        });
        (setTimeout as typeof global.setTimeout)(() => onClose(), 2000);
      } else {
        setNotification({
          message: "El pago aún está pendiente",
          type: "error",
        });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleRedirectToMP = () => {
    if (createdPayment?.gateway_metadata?.init_point) {
      window.open(createdPayment.gateway_metadata.init_point, '_blank');
    }
  };

  const handleClose = () => {
    stopPolling();
    if (createdPayment) {
      onSuccess();
    }
    onClose();
  };

  if (!isOpen) return null;

  // Si ya se creó el pago, mostrar vista de espera
  if (createdPayment) {
    const initPoint = createdPayment.gateway_metadata?.init_point;
    const isConfirmed = createdPayment.status === 'confirmed';
    const isFailed = createdPayment.status === 'failed';

    return (
      <div className="fixed inset-0 bg-background/90 flex items-center justify-center z-50">
        <div className="neu-elevated border-0 rounded-2xl p-6 max-w-md w-full mx-4">
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-2 rounded-lg ${
              isConfirmed ? 'bg-green-500/20' : 
              isFailed ? 'bg-red-500/20' : 
              'bg-blue-500/20'
            }`}>
              <CreditCard className={`h-6 w-6 ${
                isConfirmed ? 'text-green-400' : 
                isFailed ? 'text-red-400' : 
                'text-blue-400'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">
                  {isConfirmed ? 'Pago Confirmado' : 
                   isFailed ? 'Pago Fallido' : 
                   'Esperando Confirmación'}
                </h3>
                <button
                  onClick={handleClose}
                  className="text-white/60 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4 mt-4">
                <div className={`p-4 rounded-lg border ${
                  isConfirmed ? 'bg-green-500/10 border-green-500/30' : 
                  isFailed ? 'bg-red-500/10 border-red-500/30' : 
                  'bg-white/5 border-blue-500/30'
                }`}>
                  <div className={`text-lg font-semibold mb-2 ${
                    isConfirmed ? 'text-green-400' : 
                    isFailed ? 'text-red-400' : 
                    'text-blue-400'
                  }`}>
                    {formatCurrency(createdPayment.amount)}
                  </div>
                  
                  {createdPayment.external_reference && (
                    <div className="mt-2">
                      <Label className="text-white/60 text-xs">Referencia Externa:</Label>
                      <code className="block mt-1 bg-white/10 px-3 py-2 rounded text-white text-sm font-mono">
                        {createdPayment.external_reference}
                      </code>
                    </div>
                  )}

                  {isConfirmed && (
                    <div className="mt-3 text-green-400 text-sm">
                      ✓ El pago ha sido confirmado exitosamente
                    </div>
                  )}

                  {isFailed && (
                    <div className="mt-3 text-red-400 text-sm">
                      ✗ El pago fue rechazado o falló
                    </div>
                  )}

                  {!isConfirmed && !isFailed && (
                    <div className="mt-3 text-white/60 text-sm">
                      El pago está pendiente de confirmación desde Mercado Pago
                    </div>
                  )}
                </div>

                {!isConfirmed && !isFailed && initPoint && (
                  <div className="space-y-3">
                    <Button
                      onClick={handleRedirectToMP}
                      className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Checkout de Mercado Pago
                    </Button>

                    {polling && (
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verificando estado... ({pollingCount}/{MAX_POLLING_ATTEMPTS})</span>
                      </div>
                    )}

                    {timeout && (
                      <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                        <div className="text-yellow-400 text-sm font-medium mb-1">
                          Tiempo de espera agotado
                        </div>
                        <div className="text-white/60 text-xs mb-2">
                          El polling automático se detuvo. Puedes verificar manualmente o cerrar esta ventana.
                        </div>
                        <Button
                          onClick={handleManualRefresh}
                          size="sm"
                          className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Verificar Manualmente
                        </Button>
                      </div>
                    )}

                    {!polling && !timeout && (
                      <Button
                        onClick={handleManualRefresh}
                        variant="ghost"
                        size="sm"
                        className="w-full text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Verificar Estado
                      </Button>
                    )}
                  </div>
                )}

                {createdPayment.last_webhook && (
                  <div className="pt-3 border-t border-white/10">
                    <div className="text-white/50 text-xs">
                      Último webhook: {new Date(createdPayment.last_webhook).toLocaleString('es-AR')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="flex-1 text-white/60 hover:text-white hover:bg-white/10"
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

  // Formulario para crear pago MP
  return (
    <div className="fixed inset-0 bg-background/90 flex items-center justify-center z-50">
      <div className="neu-elevated border-0 rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <CreditCard className="h-6 w-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Crear Pago Mercado Pago</h3>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-white/70 text-sm mb-4">
              Crea un pago online que redirigirá al cliente a Mercado Pago
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/80">Método de Pago Mercado Pago</Label>
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
                    No hay métodos de pago Mercado Pago disponibles
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
            onClick={handleCreateMPPayment}
            disabled={creating || !amount || !paymentMethodId || loadingMethods}
            className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 disabled:opacity-50"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Crear Pago MP
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

