"use client";

import { useState, useEffect } from "react";
import { QrCode, Clock, AlertCircle, Copy } from "lucide-react";
import { Payment } from "@/types/payments";
import { Button } from "@/components/ui/button";
import { fixQRCodeImage } from "@/lib/qr-crc-fix";

interface PaymentQRDisplayProps {
  payment: Payment;
  showExpiration?: boolean;
  showReference?: boolean;
}

export function PaymentQRDisplay({ 
  payment, 
  showExpiration = true,
  showReference = true 
}: PaymentQRDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [correctedQRCode, setCorrectedQRCode] = useState<string | undefined>(undefined);

  const qrCode = payment.gateway_metadata?.qr_code;
  const qrPayload = payment.gateway_metadata?.qr_payload;
  const expiresAt = payment.gateway_metadata?.expires_at;
  const paymentReference = payment.gateway_metadata?.reference || payment.reference;

  // Corregir el QR si el payload tiene CRC incorrecto
  useEffect(() => {
    if (qrCode && qrPayload) {
      fixQRCodeImage(qrCode, qrPayload)
        .then((corrected) => {
          if (corrected && corrected !== qrCode) {
            setCorrectedQRCode(corrected);
          } else {
            setCorrectedQRCode(undefined);
          }
        })
        .catch(() => {
          // Si falla, usar el QR original
          setCorrectedQRCode(undefined);
        });
    } else {
      setCorrectedQRCode(undefined);
    }
  }, [qrCode, qrPayload]);

  // Usar QR corregido si está disponible, sino el original
  const displayQRCode = correctedQRCode || qrCode;

  useEffect(() => {
    if (!expiresAt || !showExpiration) {
      setIsExpired(false);
      setTimeRemaining('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expirado');
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
  }, [expiresAt, showExpiration]);

  // Solo mostrar QR si está pending y tiene código
  if (payment.status !== 'pending' || !displayQRCode) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3">
      {/* QR Code */}
      <div className="text-center">
        <div className="text-white/60 text-xs mb-2">Código QR:</div>
        <div className={`bg-white p-8 rounded-lg inline-block shadow-lg ${isExpired ? 'opacity-50' : ''}`}>
          <img 
            src={displayQRCode} 
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
            onError={(e) => {
              console.error("Error al cargar imagen QR");
            }}
          />
        </div>
        {isExpired && (
          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
            ⚠️ QR Expirado
          </div>
        )}
        {expiresAt && showExpiration && !isExpired && timeRemaining && (
          <div className="mt-2 flex items-center justify-center gap-1 text-yellow-400 text-xs">
            <Clock className="h-3 w-3" />
            <span>Expira en: {timeRemaining}</span>
          </div>
        )}
      </div>

      {/* Referencia de Pago (CLAVE) */}
      {showReference && paymentReference && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="text-blue-400 text-xs font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="h-3 w-3" />
            Referencia de pago
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white/10 px-3 py-2 rounded text-white text-sm font-mono text-center">
              {paymentReference}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(paymentReference);
              }}
              className="text-blue-300 hover:text-blue-200 hover:bg-blue-500/20"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-blue-300/80 text-xs text-center mt-2">
            Usá esta referencia al pagar para confirmación automática
          </div>
        </div>
      )}
    </div>
  );
}

