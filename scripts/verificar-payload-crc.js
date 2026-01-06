/**
 * Verificar exactamente qué payload genera el CRC 8680
 */

async function verificarPayloadCRC() {
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
  
  console.log('📋 PAYLOAD COMPLETO:');
  console.log(payload);
  console.log('\n');
  
  // Extraer CRC
  const crcMatch = payload.match(/63(\d{2})([A-F0-9]{4})$/);
  if (!crcMatch) {
    console.error('❌ CRC no encontrado');
    return;
  }
  
  const crcEnPayload = crcMatch[2];
  const payloadSinCRC = payload.substring(0, payload.length - 6);
  
  console.log('📋 PAYLOAD SIN CRC:');
  console.log(payloadSinCRC);
  console.log(`Longitud: ${payloadSinCRC.length} caracteres\n`);
  
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
  
  console.log('📋 DATOS PARA CALCULAR CRC:');
  console.log(`"${dataParaCRC}"`);
  console.log(`Longitud: ${dataParaCRC.length} caracteres\n`);
  
  console.log('📊 RESULTADO:');
  console.log(`CRC en payload: ${crcEnPayload}`);
  console.log(`CRC calculado:  ${crcCalculado}`);
  console.log(`Datos para CRC: "${dataParaCRC}"\n`);
  
  console.log('📋 PAYLOAD CORRECTO (con CRC 8680):');
  const payloadCorrecto = payloadSinCRC + "6304" + crcCalculado;
  console.log(payloadCorrecto);
  
  return {
    payloadOriginal: payload,
    payloadSinCRC: payloadSinCRC,
    dataParaCRC: dataParaCRC,
    crcEnPayload: crcEnPayload,
    crcCalculado: crcCalculado,
    payloadCorrecto: payloadCorrecto
  };
}

verificarPayloadCRC();
window.verificarPayloadCRC = verificarPayloadCRC;

