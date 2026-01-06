/**
 * Manejo global de errores del backend con códigos específicos
 */

export interface BackendError extends Error {
  code?: string;
  details?: any;
  hint?: string;
  status?: number;
}

/**
 * Obtiene un mensaje de error amigable basado en el código del backend
 */
export function getErrorMessage(error: BackendError | Error | unknown): string {
  if (!error) return 'Error desconocido';
  
  const backendError = error as BackendError;
  
  // Si hay un código específico del backend, usar mensajes personalizados
  if (backendError.code) {
    switch (backendError.code) {
      case 'SALE_NOT_CONFIRMED':
        return 'La venta debe estar confirmada para realizar esta acción';
      case 'SALE_ALREADY_PAID':
        return 'Esta venta ya está completamente pagada';
      case 'PAYMENT_NOT_PENDING':
        return 'Solo se pueden eliminar pagos pendientes';
      case 'PAYMENT_NOT_CONFIRMABLE':
        return 'Este pago no puede ser confirmado';
      case 'INSUFFICIENT_STOCK':
        return 'Stock insuficiente para completar la operación';
      case 'PAYMENT_ALREADY_EXISTS':
        return 'Este pago ya existe (idempotencia)';
      case 'GATEWAY_ERROR':
        return 'Error al comunicarse con la pasarela de pago';
      case 'INVALID_PAYMENT_METHOD':
        return 'Método de pago inválido o inactivo';
      default:
        // Si hay un mensaje personalizado, usarlo
        if (backendError.message) {
          return backendError.message;
        }
    }
  }
  
  // Si hay detalles de validación, incluirlos
  if (backendError.details && Array.isArray(backendError.details)) {
    const validationErrors = backendError.details
      .map((detail: any) => {
        if (typeof detail === 'string') return detail;
        if (detail.path && detail.message) {
          return `${detail.path.join('.')}: ${detail.message}`;
        }
        return detail.message || JSON.stringify(detail);
      })
      .join('; ');
    
    if (validationErrors) {
      return `${backendError.message || 'Error de validación'}. ${validationErrors}`;
    }
  }
  
  // Mensaje por defecto
  return backendError.message || 'Error desconocido';
}

/**
 * Determina si un error es de un tipo específico basado en el código
 */
export function isErrorCode(error: unknown, code: string): boolean {
  const backendError = error as BackendError;
  return backendError.code === code;
}

/**
 * Determina si un error es de idempotencia (pago duplicado)
 */
export function isIdempotencyError(error: unknown): boolean {
  return isErrorCode(error, 'PAYMENT_ALREADY_EXISTS') || 
         isErrorCode(error, 'DUPLICATE_PAYMENT');
}

