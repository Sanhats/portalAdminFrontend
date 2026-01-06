/**
 * CORRECCIÓN TEMPORAL DE CRC EN FRONTEND
 * 
 * ⚠️ SOLUCIÓN TEMPORAL: Esta función corrige el CRC del payload EMV
 * que viene del backend cuando está mal calculado.
 * 
 * La solución correcta es corregir el cálculo del CRC en el backend.
 * Esta es solo una medida temporal mientras se corrige el backend.
 */

/**
 * Calcula CRC16-CCITT según estándar EMV
 * IMPORTANTE: Debe ser idéntico al algoritmo usado en validar-todo-ahora.js
 */
function calculateCRC16CCITT(data: string): number {
  let crc = 0xFFFF;
  const poly = 0x1021;
  
  for (let i = 0; i < data.length; i++) {
    crc ^= (data.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ poly) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  
  return crc;
}

/**
 * Corrige el CRC del payload EMV si está incorrecto
 * 
 * @param payload - Payload EMV completo con CRC
 * @returns Payload con CRC corregido
 */
export function fixQRPayloadCRC(payload: string): string {
  if (!payload || typeof payload !== 'string') {
    return payload;
  }

  // Extraer el CRC del payload
  // El campo CRC siempre está al final y tiene formato: 6304XXXX donde:
  // - 63 = ID del campo
  // - 04 = Longitud del valor (2 dígitos) - siempre es 04 para CRC
  // - XXXX = CRC hexadecimal (4 dígitos)
  const crcMatch = payload.match(/63(\d{2})([A-F0-9]{4})$/);
  if (!crcMatch) {
    // Si no hay CRC, retornar el payload tal cual
    return payload;
  }

  const crcLength = parseInt(crcMatch[1], 10);
  const crcInPayload = crcMatch[2];
  
  // Validar que el campo CRC tenga longitud 4
  if (crcLength !== 4) {
    console.warn(`[QR CRC Fix] Campo CRC tiene longitud inesperada: ${crcLength}`);
  }
  
  // IMPORTANTE: El campo CRC completo es "63" + "04" + "XXXX" = 8 caracteres
  // El script de validación usa payload.length - 6 para remover solo "04XXXX" (6 caracteres)
  // Esto funciona para CALCULAR el CRC, pero para RECONSTRUIR el payload necesitamos remover el campo completo
  
  // Para calcular el CRC (igual que el script de validación):
  // Remover los últimos 6 caracteres (04 + XXXX) para obtener payload sin CRC
  const payloadWithoutCRC = payload.substring(0, payload.length - 6);
  
  // Calcular CRC correcto sobre: payload_sin_04XXXX + "6304"
  // Esto coincide exactamente con el script de validación
  const dataForCRC = payloadWithoutCRC + "6304";
  
  // Verificar que el algoritmo de CRC sea idéntico al del script
  const calculatedCRC = calculateCRC16CCITT(dataForCRC);
  const calculatedCRCHex = calculatedCRC.toString(16).toUpperCase().padStart(4, '0');
  
  // Si el CRC ya es correcto, retornar el payload original
  if (crcInPayload === calculatedCRCHex) {
    return payload;
  }
  
  // Para reconstruir el payload corregido:
  // El campo CRC completo es "63" + "04" + "XXXX" = 8 caracteres
  // payloadWithoutCRC termina justo antes de "04XXXX" (removió 6 caracteres)
  // Pero el campo 63 completo son 8 caracteres, así que payloadWithoutCRC todavía tiene "63" al final
  // Necesitamos remover el campo 63 completo (8 caracteres) antes de agregar el nuevo
  
  // Remover el campo 63 completo del payload original (8 caracteres desde el final)
  const payloadSinCampo63Completo = payload.substring(0, payload.length - 8);
  
  // Agregar campo CRC completo con CRC correcto: "6304" + CRC_correcto
  const correctedPayload = payloadSinCampo63Completo + `6304${calculatedCRCHex}`;
  
  // Verificar que el payload corregido termine correctamente con el campo 63
  const correctedEnd = correctedPayload.substring(correctedPayload.length - 10);
  const expectedEnd = `6304${calculatedCRCHex}`;
  const endsCorrectly = correctedPayload.endsWith(expectedEnd);
  
  console.warn('[QR CRC Fix] CRC corregido:', {
    original: crcInPayload,
    corrected: calculatedCRCHex,
    payloadLength: payload.length,
    correctedLength: correctedPayload.length,
    payloadEnd: payload.substring(payload.length - 10),
    correctedEnd: correctedEnd,
    expectedEnd: expectedEnd,
    endsCorrectly: endsCorrectly,
    payloadWithoutCRCLength: payloadWithoutCRC.length,
    payloadWithoutCRCEnd: payloadWithoutCRC.substring(payloadWithoutCRC.length - 10),
    payloadSinCampo63CompletoLength: payloadSinCampo63Completo.length,
    payloadSinCampo63CompletoEnd: payloadSinCampo63Completo.substring(Math.max(0, payloadSinCampo63Completo.length - 10)),
    campoCRCCompletoRemovido: payload.substring(payload.length - 8),
    campoCRCCompletoAgregado: `6304${calculatedCRCHex}`
  });
  
  if (!endsCorrectly) {
    console.error('[QR CRC Fix] ERROR: El payload corregido NO termina correctamente con el campo 63');
    console.error(`   Esperado: ...${expectedEnd}`);
    console.error(`   Obtenido: ...${correctedEnd}`);
    console.error(`   Payload completo original (últimos 20): ${payload.substring(payload.length - 20)}`);
    console.error(`   Payload completo corregido (últimos 20): ${correctedPayload.substring(correctedPayload.length - 20)}`);
  } else {
    console.log('[QR CRC Fix] ✅ Payload corregido correctamente');
  }
  
  return correctedPayload;
}

/**
 * Regenera el QR code usando el payload corregido
 * Requiere que se instale: npm install qrcode
 * 
 * @param payload - Payload EMV completo
 * @returns Base64 data URL del QR regenerado
 */
export async function generateQRCodeFromPayload(payload: string): Promise<string> {
  try {
    // Intentar importar qrcode dinámicamente
    const QRCode = await import('qrcode');
    
    // Generar QR con el payload corregido
    // Configuración optimizada para máximo escaneo según estándar EMV
    const qrDataURL = await QRCode.default.toDataURL(payload, {
      width: 400,
      margin: 4, // Margen mínimo requerido por EMV (4 módulos)
      color: {
        dark: '#000000', // Negro puro (RGB: 0,0,0)
        light: '#FFFFFF'  // Blanco puro (RGB: 255,255,255)
      },
      errorCorrectionLevel: 'H', // Nivel H (30% corrección) para máxima robustez
      type: 'image/png'
    });
    
    return qrDataURL;
  } catch (error) {
    console.error('[QR CRC Fix] Error al generar QR. ¿Está instalado qrcode?', error);
    throw error;
  }
}

/**
 * Corrige el QR code base64 regenerándolo con el payload corregido
 * 
 * @param qrCode - Base64 data URL del QR original
 * @param payload - Payload EMV completo
 * @returns Nuevo QR code base64 con payload corregido (si es necesario)
 */
export async function fixQRCodeImage(
  qrCode: string | undefined | null,
  payload: string | undefined | null
): Promise<string | undefined> {
  if (!qrCode || !payload) {
    return qrCode || undefined;
  }

  // Corregir el payload
  const correctedPayload = fixQRPayloadCRC(payload);
  
  // Si el payload no cambió, retornar el QR original
  if (correctedPayload === payload) {
    return qrCode;
  }

  // Regenerar el QR con el payload corregido
  try {
    const correctedQR = await generateQRCodeFromPayload(correctedPayload);
    console.log('[QR CRC Fix] QR regenerado con payload corregido');
    return correctedQR;
  } catch (error) {
    // Si no se puede regenerar (por ejemplo, qrcode no está instalado),
    // retornar el QR original con una advertencia
    console.warn('[QR CRC Fix] No se pudo regenerar el QR. El CRC sigue incorrecto.');
    return qrCode;
  }
}

