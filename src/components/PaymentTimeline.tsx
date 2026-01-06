"use client";

import { Payment } from "@/types/payments";
import { 
  getPaymentStatusColor, 
  getPaymentStatusLabel, 
  getPaymentStatusIcon 
} from "@/lib/payment-mappings";
import { PaymentQRDisplay } from "@/components/PaymentQRDisplay";
import { Clock, ExternalLink } from "lucide-react";

interface PaymentTimelineProps {
  payments: Payment[];
}

export function PaymentTimeline({ payments }: PaymentTimelineProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return new Date(dateString).toLocaleString('es-AR');
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(num);
  };

  // Ordenar pagos por fecha (más recientes primero)
  const sortedPayments = [...payments].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (sortedPayments.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        No hay pagos registrados
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedPayments.map((payment, index) => {
        const isLast = index === sortedPayments.length - 1;
        const statusColor = getPaymentStatusColor(payment.status);
        const statusLabel = getPaymentStatusLabel(payment.status);
        const statusIcon = getPaymentStatusIcon(payment.status);

        return (
          <div key={payment.id} className="relative">
            {/* Línea conectora */}
            {!isLast && (
              <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-white/10" />
            )}

            <div className="flex gap-4">
              {/* Icono de estado */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                payment.status === 'confirmed' ? 'bg-green-500/20 border-green-500/50' :
                payment.status === 'failed' ? 'bg-red-500/20 border-red-500/50' :
                payment.status === 'refunded' ? 'bg-gray-500/20 border-gray-500/50' :
                'bg-yellow-500/20 border-yellow-500/50'
              }`}>
                {statusIcon}
              </div>

              {/* Contenido del pago */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${statusColor}`}>
                        {statusLabel}
                      </span>
                      <span className="text-white font-semibold text-lg">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                    
                    <div className="text-white/80 text-sm mb-1">
                      {payment.payment_methods?.label || payment.method || 'Sin método'}
                    </div>

                    {/* Referencias */}
                    {payment.reference && (
                      <div className="text-white/60 text-xs mb-1">
                        Referencia: <code className="bg-white/10 px-1.5 py-0.5 rounded">{payment.reference}</code>
                      </div>
                    )}

                    {payment.external_reference && (
                      <div className="text-white/60 text-xs mb-1 flex items-center gap-1">
                        <span>Ref. Externa:</span>
                        <code className="bg-white/10 px-1.5 py-0.5 rounded">{payment.external_reference}</code>
                        {payment.gateway_metadata?.init_point && (
                          <a
                            href={payment.gateway_metadata.init_point}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Webhook info */}
                    {payment.last_webhook && (
                      <div className="text-white/50 text-xs mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Último webhook: {formatDate(payment.last_webhook)}</span>
                      </div>
                    )}

                    {/* Mostrar QR si es pago QR pendiente */}
                    <PaymentQRDisplay payment={payment} />

                    {/* Metadata adicional */}
                    {payment.gateway_metadata && Object.keys(payment.gateway_metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-white/50 text-xs cursor-pointer hover:text-white/70">
                          Ver detalles técnicos
                        </summary>
                        <div className="mt-2 p-2 bg-white/5 rounded text-xs font-mono text-white/60 overflow-x-auto">
                          <pre>{JSON.stringify(payment.gateway_metadata, null, 2)}</pre>
                        </div>
                      </details>
                    )}
                  </div>

                  {/* Fecha */}
                  <div className="text-right text-white/50 text-xs whitespace-nowrap ml-4">
                    {formatDate(payment.created_at)}
                  </div>
                </div>

                {/* Mensajes de estado específicos */}
                {payment.status === 'failed' && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
                    Este pago falló o fue rechazado
                  </div>
                )}

                {payment.status === 'refunded' && (
                  <div className="mt-2 p-2 bg-gray-500/10 border border-gray-500/30 rounded text-xs text-gray-300">
                    Este pago fue reembolsado
                  </div>
                )}

                {payment.status === 'pending' && payment.gateway_metadata?.init_point && (
                  <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-300">
                    Pendiente de confirmación desde la pasarela
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

