"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  CreditCard, 
  QrCode, 
  Building2, 
  DollarSign, 
  Wallet, 
  Plus,
  ArrowLeft,
  X,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { api } from "@/lib/api-client";
import Notification from "@/components/Notification";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sale, PaymentMethodEnum } from "@/types/payments";
import { getErrorMessage } from "@/lib/error-handler";

interface NotificationState {
  message: string;
  type: "success" | "error" | "info";
}

interface QuickPaymentMethod {
  id: PaymentMethodEnum;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  hoverColor: string;
}

export default function QuickPaymentPage() {
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loadingSale, setLoadingSale] = useState(false);
  const [saleId, setSaleId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodEnum | null>(null);
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Métodos de pago disponibles
  const paymentMethods: QuickPaymentMethod[] = [
    {
      id: "cash",
      label: "Efectivo",
      icon: <DollarSign className="h-8 w-8" />,
      color: "text-green-600",
      bgColor: "bg-green-500",
      hoverColor: "hover:bg-green-600",
    },
    {
      id: "transfer",
      label: "Transferencia",
      icon: <Building2 className="h-8 w-8" />,
      color: "text-blue-600",
      bgColor: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
    },
    {
      id: "qr",
      label: "QR / Billetera",
      icon: <QrCode className="h-8 w-8" />,
      color: "text-purple-600",
      bgColor: "bg-purple-500",
      hoverColor: "hover:bg-purple-600",
    },
    {
      id: "card",
      label: "Tarjeta",
      icon: <CreditCard className="h-8 w-8" />,
      color: "text-orange-600",
      bgColor: "bg-orange-500",
      hoverColor: "hover:bg-orange-600",
    },
    {
      id: "mp_point",
      label: "Mercado Pago Point",
      icon: <Wallet className="h-8 w-8" />,
      color: "text-teal-600",
      bgColor: "bg-teal-500",
      hoverColor: "hover:bg-teal-600",
    },
    {
      id: "other",
      label: "Otro",
      icon: <Plus className="h-8 w-8" />,
      color: "text-gray-600",
      bgColor: "bg-gray-500",
      hoverColor: "hover:bg-gray-600",
    },
  ];

  // Cargar venta si hay un saleId en la URL o localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const saleIdParam = urlParams.get("saleId");
    if (saleIdParam) {
      setSaleId(saleIdParam);
      loadSale(saleIdParam);
    } else {
      // Intentar cargar desde localStorage (última venta activa)
      const lastSaleId = localStorage.getItem("lastActiveSaleId");
      if (lastSaleId) {
        setSaleId(lastSaleId);
        loadSale(lastSaleId);
      }
    }
  }, []);

  const loadSale = async (id: string) => {
    setLoadingSale(true);
    try {
      const saleData = await api.getSale(id) as Sale;
      setSale(saleData);
      // Si la venta tiene balance, pre-llenar el monto
      if (saleData.financial?.balanceAmount) {
        const balance = parseFloat(saleData.financial.balanceAmount);
        if (balance > 0) {
          setAmount(balance.toFixed(2));
        }
      }
    } catch (error: any) {
      console.error("Error al cargar venta:", error);
      setNotification({
        message: "No se pudo cargar la venta. Verifica el ID.",
        type: "error",
      });
    } finally {
      setLoadingSale(false);
    }
  };

  const handleMethodClick = (method: PaymentMethodEnum) => {
    setSelectedMethod(method);
    
    // Si hay balance y no hay monto ingresado, usar el balance completo
    if (sale?.financial && parseFloat(sale.financial.balanceAmount) > 0 && (!amount || parseFloat(amount) <= 0)) {
      const balanceAmount = parseFloat(sale.financial.balanceAmount);
      // Procesar directamente con el balance completo
      handleQuickPayment(method, balanceAmount);
    } else if (amount && parseFloat(amount) > 0) {
      // Si ya hay monto ingresado, procesar directamente
      handleQuickPayment(method, parseFloat(amount));
    } else {
      // Si no hay monto, abrir modal para ingresarlo
      setShowAmountModal(true);
    }
  };

  const handleAmountSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setNotification({
        message: "Ingresa un monto válido",
        type: "error",
      });
      return;
    }

    if (selectedMethod) {
      setShowAmountModal(false);
      handleQuickPayment(selectedMethod, parseFloat(amount));
    }
  };

  const handleQuickPayment = async (method: PaymentMethodEnum, amountValue: number) => {
    if (!sale || !saleId) {
      setNotification({
        message: "No hay una venta seleccionada",
        type: "error",
      });
      return;
    }

    setProcessing(true);
    try {
      // Crear el pago con el nuevo modelo
      await api.createPayment(saleId, {
        amount: amountValue,
        method,
        // El backend determina automáticamente provider y status
      });

      // Éxito - mostrar notificación y recargar venta
      setNotification({
        message: `✅ Cobro de $${amountValue.toLocaleString('es-AR', { minimumFractionDigits: 2 })} registrado exitosamente`,
        type: "success",
      });

      // Recargar venta para actualizar balance
      await loadSale(saleId);

      // Resetear monto si el balance es 0
      if (sale && sale.financial && parseFloat(sale.financial.balanceAmount) <= amountValue) {
        setAmount("");
      }

      // Cerrar modal si está abierto
      setShowAmountModal(false);
      setSelectedMethod(null);
    } catch (error: any) {
      console.error("Error al registrar cobro:", error);
      setNotification({
        message: getErrorMessage(error),
        type: "error",
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "$0.00";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(num);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 safe-area-inset">
        {/* Header - Mobile First */}
        <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b-2 border-white/20 p-4 safe-area-top">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                onClick={() => router.push("/admin/sales")}
                className="text-white hover:bg-white/10 flex-shrink-0"
                size="sm"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">Registrar Cobro</h1>
                {sale && (
                  <p className="text-white/70 text-xs sm:text-sm truncate">
                    #{sale.id.slice(0, 8)} • {sale.financial ? formatCurrency(sale.financial.balanceAmount) : "$0.00"}
                  </p>
                )}
              </div>
            </div>
            {saleId && (
              <Input
                type="text"
                placeholder="ID Venta"
                value={saleId}
                onChange={(e) => setSaleId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && saleId) {
                    loadSale(saleId);
                  }
                }}
                className="w-full sm:w-48 bg-white/10 border-2 border-white/20 text-white placeholder:text-white/50 text-sm"
              />
            )}
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="max-w-7xl mx-auto p-4 pb-8">
          {loadingSale ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <Loader2 className="h-12 w-12 text-white animate-spin" />
            </div>
          ) : !sale ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <p className="text-white/60 text-lg mb-4">
                Ingresa el ID de una venta para comenzar
              </p>
              <div className="flex gap-4 w-full max-w-md">
                <Input
                  type="text"
                  placeholder="ID de Venta"
                  value={saleId}
                  onChange={(e) => setSaleId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && saleId) {
                      loadSale(saleId);
                    }
                  }}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 text-lg"
                />
                <Button
                  onClick={() => saleId && loadSale(saleId)}
                  disabled={!saleId}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  Cargar
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Monto Actual (si hay balance) - Mobile First */}
              {sale && sale.financial && parseFloat(sale.financial.balanceAmount) > 0 && (
                <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-white/10 rounded-2xl border-4 border-white/30 shadow-xl">
                  <div className="text-center">
                    <p className="text-white/70 text-xs sm:text-sm mb-2 font-medium">Monto a Cobrar</p>
                    <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">
                      {formatCurrency(sale.financial.balanceAmount)}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-white/50 text-xs sm:text-sm">
                      <span>Total: {formatCurrency(sale.financial.totalAmount)}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Pagado: {formatCurrency(sale.financial.paidAmount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid de Métodos de Pago - Mobile First */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleMethodClick(method.id)}
                    disabled={processing}
                    className={`
                      relative p-6 sm:p-8 rounded-2xl border-4 border-white/30
                      ${method.bgColor} ${method.hoverColor}
                      text-white font-bold
                      transition-all duration-150
                      active:scale-95 active:brightness-90
                      disabled:opacity-50 disabled:cursor-not-allowed
                      shadow-2xl shadow-black/50
                      flex flex-col items-center justify-center gap-3 sm:gap-4
                      min-h-[140px] sm:min-h-[180px]
                      touch-manipulation
                    `}
                    style={{
                      // Alto contraste para accesibilidad
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <div className="text-white drop-shadow-lg">
                      {method.icon}
                    </div>
                    <span className="text-white font-bold text-base sm:text-lg drop-shadow-md text-center">
                      {method.label}
                    </span>
                    {processing && selectedMethod === method.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl backdrop-blur-sm">
                        <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 text-white animate-spin" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Modal de Monto - Mobile First */}
        {showAmountModal && (
          <div
            className="fixed inset-0 bg-black/90 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={() => !processing && setShowAmountModal(false)}
          >
            <div
              className="bg-gray-900 rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md border-t-4 sm:border-2 border-white/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Ingresar Monto</h2>
                <button
                  onClick={() => setShowAmountModal(false)}
                  disabled={processing}
                  className="text-white/60 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">
                    Monto a Cobrar
                  </label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAmountSubmit();
                      }
                    }}
                    placeholder="0.00"
                    autoFocus
                    className="text-4xl sm:text-5xl font-bold text-center bg-white/10 border-2 border-white/30 text-white h-20 sm:h-24 focus:border-white/50 focus:ring-2 focus:ring-white/20"
                  />
                  {amount && (
                    <p className="text-white/60 text-sm mt-2 text-center">
                      {formatCurrency(amount)}
                    </p>
                  )}
                </div>

                {/* Botones de monto rápido (opcional) - Mobile First */}
                {sale && sale.financial && parseFloat(sale.financial.balanceAmount) > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => sale && sale.financial && setAmount(sale.financial.balanceAmount)}
                      className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 text-sm sm:text-base border border-white/20"
                    >
                      Balance
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (sale && sale.financial) {
                          const half = (parseFloat(sale.financial.balanceAmount) / 2).toFixed(2);
                          setAmount(half);
                        }
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 text-sm sm:text-base border border-white/20"
                    >
                      Mitad
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setAmount("")}
                      className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 text-sm sm:text-base border border-white/20"
                    >
                      Limpiar
                    </Button>
                  </div>
                )}

                <div className="flex gap-3 pt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAmountModal(false)}
                    disabled={processing}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-4 text-lg border-2 border-white/20"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAmountSubmit}
                    disabled={processing || !amount || parseFloat(amount) <= 0}
                    className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-4 text-lg shadow-lg shadow-green-600/30 border-2 border-green-500/50"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Confirmar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notificación */}
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
            duration={notification.type === "success" ? 3000 : 5000}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

