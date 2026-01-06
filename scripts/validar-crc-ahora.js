/**
 * VALIDAR CRC AHORA - Ejecutar directamente
 */

async function validarCRC() {
  const token = localStorage.getItem('access_token');
  const urlParts = window.location.pathname.split('/');
  const saleId = urlParts[urlParts.length - 1];
  
  const paymentsResponse = await fetch(`/api/proxy/sales/${saleId}/payments`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  
  const payments = await paymentsResponse.json();
  const qrPayments = (payments.payments || payments || []).filter(p => 
    p.status === 'pending' && p.gateway_metadata?.qr_payload
  );
  
  if (qrPayments.length === 0) {
    console.error('❌ No hay QR pendiente');
    return;
  }
  
  const payload = qrPayments[qrPayments.length - 1].gateway_metadata.qr_payload;
  console.log('Payload:', payload);
  
  // Extraer CRC
  const crcMatch = payload.match(/63(\d{2})([A-F0-9]{4})$/);
  if (!crcMatch) {
    console.error('❌ CRC no encontrado');
    return;
  }
  
  const crcEnPayload = crcMatch[2];
  const payloadSinCRC = payload.substring(0, payload.length - 6);
  
  // Calcular CRC
  function calcCRC(data) {
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
  
  const dataParaCRC = payloadSinCRC + "6304";
  const crcCalculado = calcCRC(dataParaCRC).toString(16).toUpperCase().padStart(4, '0');
  
  console.log('\n🔍 VALIDACIÓN CRC:');
  console.log(`CRC en payload: ${crcEnPayload}`);
  console.log(`CRC calculado:  ${crcCalculado}`);
  console.log(`Datos para CRC: ${dataParaCRC}`);
  
  if (crcEnPayload === crcCalculado) {
    console.log('\n✅ CRC CORRECTO');
    console.log('El problema NO es el CRC.');
    console.log('Problema probable: Tamaño QR (300x300px) o formato Merchant Account Information');
  } else {
    console.error('\n❌ CRC INCORRECTO');
    console.error('ESTE ES EL PROBLEMA PRINCIPAL');
    console.error(`Backend debe calcular: ${crcCalculado}`);
    console.error(`Pero está calculando: ${crcEnPayload}`);
  }
  
  return { crcEnPayload, crcCalculado, esCorrecto: crcEnPayload === crcCalculado };
}

// Ejecutar automáticamente
validarCRC();

// Función global
window.validarCRC = validarCRC;

