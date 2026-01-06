/**
 * Mapeo centralizado de estados a labels y colores
 */

import { SaleStatus, PaymentStatus, PaymentMethodType, PaymentMethodEnum, PaymentProvider } from '@/types/payments';
import { Clock, CheckCircle2, XCircle, DollarSign, AlertTriangle } from 'lucide-react';

// Mapeo de estados de venta
export function getSaleStatusColor(status: SaleStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    case 'confirmed':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'paid':
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'cancelled':
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
}

export function getSaleStatusLabel(status: SaleStatus): string {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'confirmed':
      return 'Confirmada';
    case 'paid':
      return 'Pagada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
}

export function getSaleStatusIcon(status: SaleStatus) {
  switch (status) {
    case 'draft':
      return <Clock className="h-4 w-4" />;
    case 'confirmed':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'paid':
      return <DollarSign className="h-4 w-4" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4" />;
    default:
      return null;
  }
}

// Mapeo de estados de pago
export function getPaymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'confirmed':
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'failed':
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'refunded':
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    default:
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'confirmed':
      return 'Confirmado';
    case 'pending':
      return 'Pendiente';
    case 'failed':
      return 'Fallido';
    case 'refunded':
      return 'Reembolsado';
    default:
      return status;
  }
}

export function getPaymentStatusIcon(status: PaymentStatus) {
  switch (status) {
    case 'confirmed':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'failed':
      return <XCircle className="h-4 w-4" />;
    case 'refunded':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return null;
  }
}

// Mapeo de tipos de método de pago (backward compatibility)
export function getPaymentMethodTypeLabel(type: PaymentMethodType): string {
  switch (type) {
    case 'cash':
      return 'Efectivo';
    case 'transfer':
      return 'Transferencia';
    case 'qr':
      return 'QR';
    case 'card':
      return 'Tarjeta';
    case 'gateway':
      return 'Pasarela';
    case 'other':
      return 'Otro';
    default:
      return type;
  }
}

// Mapeo del nuevo enum de métodos de pago según el modelo del backend
export function getPaymentMethodEnumLabel(method: PaymentMethodEnum): string {
  switch (method) {
    case 'cash':
      return 'Efectivo';
    case 'transfer':
      return 'Transferencia';
    case 'mp_point':
      return 'Mercado Pago Puntos';
    case 'qr':
      return 'QR';
    case 'card':
      return 'Tarjeta';
    case 'other':
      return 'Otro';
    default:
      return method;
  }
}

// Mapeo de providers según el nuevo modelo
export function getPaymentProviderLabel(provider: PaymentProvider): string {
  switch (provider) {
    case 'manual':
      return 'Manual';
    case 'mercadopago':
      return 'Mercado Pago';
    case 'banco':
      return 'Banco';
    case 'pos':
      return 'POS';
    default:
      return provider;
  }
}

// Mapeo de categorías de pago
export function getPaymentCategoryLabel(category?: string | null): string {
  if (!category) return 'Sin categoría';
  switch (category) {
    case 'manual':
      return 'Manual';
    case 'gateway':
      return 'Pasarela';
    case 'qr':
      return 'QR';
    case 'pos':
      return 'POS';
    default:
      return category;
  }
}

