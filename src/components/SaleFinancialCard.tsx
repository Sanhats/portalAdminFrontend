"use client";

import { useState, useEffect } from 'react';
import { SaleFinancial } from '@/types/payments';
import { DollarSign } from 'lucide-react';

interface SaleFinancialCardProps {
  financial: SaleFinancial;
  className?: string;
}

export function SaleFinancialCard({ financial, className = '' }: SaleFinancialCardProps) {
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    if (financial.paymentCompletedAt) {
      try {
        const date = new Date(financial.paymentCompletedAt);
        setFormattedDate(date.toLocaleString('es-AR'));
      } catch {
        setFormattedDate('');
      }
    }
  }, [financial.paymentCompletedAt]);

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(num);
  };

  const balanceAmount = parseFloat(financial.balanceAmount);
  const paidAmount = parseFloat(financial.paidAmount);
  const totalAmount = parseFloat(financial.totalAmount);
  const isPaid = financial.isPaid || balanceAmount <= 0;
  const hasPartialPayment = paidAmount > 0 && balanceAmount > 0;

  // Determinar estado visual
  let statusLabel = 'Pagada';
  let statusColor = 'bg-green-500/20 text-green-400 border-green-500/30';
  let statusIcon = '🟢';
  
  if (isPaid) {
    statusLabel = 'Pagada';
    statusColor = 'bg-green-500/20 text-green-400 border-green-500/30';
    statusIcon = '🟢';
  } else if (hasPartialPayment) {
    statusLabel = 'Pendiente';
    statusColor = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    statusIcon = '🟡';
  } else {
    statusLabel = 'Incompleta';
    statusColor = 'bg-red-500/20 text-red-400 border-red-500/30';
    statusIcon = '🔴';
  }

  return (
    <div className={`neu-elevated border-0 rounded-2xl p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-blue-400" />
        Resumen Financiero
      </h3>
      <div className="space-y-4">
        {/* Estado destacado */}
        <div className={`p-4 rounded-lg border-2 ${statusColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{statusIcon}</span>
              <span className="text-lg font-bold">{statusLabel}</span>
            </div>
          </div>
        </div>

        {/* Montos */}
        <div className="space-y-3">
          <div className="flex justify-between text-lg">
            <span className="text-white/80">Total:</span>
            <span className="text-2xl font-bold text-white">
              {formatCurrency(financial.totalAmount)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-white/60">Pagado:</span>
            <span className="text-white font-semibold text-lg">
              {formatCurrency(financial.paidAmount)}
            </span>
          </div>
          
          {balanceAmount > 0 && (
            <div className="flex justify-between pt-2 border-t border-white/10">
              <span className="text-white/60">Saldo restante:</span>
              <span className={`font-bold text-lg ${
                isPaid 
                  ? 'text-green-400' 
                  : 'text-yellow-400'
              }`}>
                {formatCurrency(financial.balanceAmount)}
              </span>
            </div>
          )}
        </div>
        
        {financial.paymentCompletedAt && formattedDate && (
          <div className="pt-2 border-t border-white/10">
            <div className="text-white/50 text-xs">
              Completado: {formattedDate}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

