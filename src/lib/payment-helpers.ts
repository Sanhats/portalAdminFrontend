/**
 * Helpers para validación y lógica de pagos
 */

import { SaleStatus, PaymentStatus, Sale, Payment, PaymentCategory } from '@/types/payments';

/**
 * Determina si se puede crear un pago para una venta
 */
export function canPaySale(sale: Sale | null): boolean {
  if (!sale) return false;
  return sale.status === 'confirmed' || sale.status === 'paid';
}

/**
 * Determina si se puede eliminar un pago
 */
export function canDeletePayment(payment: Payment | null): boolean {
  if (!payment) return false;
  return payment.status === 'pending';
}

/**
 * Determina si un pago puede ser confirmado manualmente
 */
export function canConfirmPayment(payment: Payment | null): boolean {
  if (!payment) return false;
  return payment.status === 'pending';
}

/**
 * Determina si un método de pago es manual (cash/transfer)
 */
export function isManualPaymentMethod(category?: PaymentCategory | null): boolean {
  return category === 'manual';
}

/**
 * Determina si un método de pago es gateway (requiere confirmación externa)
 */
export function isGatewayPaymentMethod(category?: PaymentCategory | null): boolean {
  return category === 'gateway';
}

/**
 * Determina si un método de pago es QR (requiere confirmación manual)
 */
export function isQRPaymentMethod(category?: PaymentCategory | null): boolean {
  return category === 'qr' || category === 'pos';
}

