/**
 * Tipos compartidos para el sistema de pagos
 */

// Enums de estados
export type SaleStatus = 'draft' | 'confirmed' | 'cancelled' | 'paid';

export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';

// Enum de métodos de pago según el nuevo modelo del backend
export type PaymentMethodEnum = 'cash' | 'transfer' | 'mp_point' | 'qr' | 'card' | 'other';

// Enum de providers según el nuevo modelo del backend
export type PaymentProvider = 'manual' | 'mercadopago' | 'banco' | 'pos';

// Backward compatibility - mantener tipos antiguos
export type PaymentMethodType = 'cash' | 'transfer' | 'qr' | 'card' | 'gateway' | 'other';

export type PaymentCategory = 'manual' | 'gateway' | 'qr' | 'pos';

// Interfaces
export interface SaleFinancial {
  totalAmount: string;
  paidAmount: string;
  balanceAmount: string;
  isPaid: boolean;
  paymentCompletedAt: string | null;
}

/**
 * PaymentDTO - Contrato de datos estable según el nuevo modelo del backend
 */
export interface Payment {
  id: string;
  sale_id: string;
  amount: string;
  status: PaymentStatus;
  method: PaymentMethodEnum; // Método de pago: cash | transfer | mp_point | qr | card | other
  provider: PaymentProvider; // Proveedor: manual | mercadopago | banco | pos
  reference: string | null;
  metadata: Record<string, any> | null; // Metadata JSON unificado
  confirmed_by: string | null; // ID del usuario que confirmó (null = system)
  confirmed_at: string | null; // Fecha y hora de confirmación
  created_at: string;
  // Campos adicionales (backward compatibility)
  payment_method_id?: string | null;
  external_reference?: string | null;
  gateway?: string; // Ej: "interoperable_qr"
  gateway_metadata?: {
    qr_code?: string; // Base64 data URL o URL de imagen
    qr_payload?: string; // Payload del QR (opcional, para debugging)
    reference?: string; // Referencia de pago (CLAVE para matching automático)
    provider?: string; // Ej: "interoperable_qr", "mercadopago", "generic"
    expires_at?: string; // ISO date string
    confidence?: number; // 0-1, para confirmación asistida
    suggested_transfer?: any; // Datos de transferencia sugerida
    init_point?: string; // URL de pago para Mercado Pago
  };
  last_webhook?: string | null;
  updated_at?: string;
  payment_methods?: {
    id: string;
    label: string;
    code: string;
    type: PaymentMethodType;
    category?: PaymentCategory;
    is_active: boolean;
  };
}

export interface PaymentMethod {
  id: string;
  label: string;
  code: string;
  type: PaymentMethodType;
  category?: PaymentCategory;
  is_active: boolean;
  metadata?: any;
}

export interface Sale {
  id: string;
  tenant_id: string;
  status: SaleStatus;
  total_amount: string;
  payment_method: string | null;
  notes: string | null;
  created_by: string;
  payment_status: string | null;
  external_reference: string | null;
  created_at: string;
  updated_at: string;
  financial?: SaleFinancial;
}

