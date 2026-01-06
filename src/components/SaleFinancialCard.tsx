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
  const isPaid = financial.isPaid || balanceAmount <= 0;

  return (
    <div className={`neu-elevated border-0 rounded-2xl p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-blue-400" />
        Resumen Financiero
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between text-lg">
          <span className="text-white/80">Total:</span>
          <span className="text-2xl font-bold text-white">
            {formatCurrency(financial.totalAmount)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-white/60">Pagado:</span>
          <span className="text-white font-semibold">
            {formatCurrency(financial.paidAmount)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-white/60">Saldo:</span>
          <span className={`font-semibold ${
            isPaid 
              ? 'text-green-400' 
              : 'text-yellow-400'
          }`}>
            {formatCurrency(financial.balanceAmount)}
          </span>
        </div>
        
        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-white/60">Estado de pago:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              isPaid 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              {isPaid ? 'Pagada' : 'Pendiente'}
            </span>
          </div>
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

