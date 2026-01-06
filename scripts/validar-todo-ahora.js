/**
 * Validar TODO: CRC y mostrar solución final
 */

async function validarTodo() {
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
  
  const payment = qrPayments[qrPayments.length - 1];
  const payload = payment.gateway_metadata.qr_payload;
  const qrCode = payment.gateway_metadata.qr_code;
  
  console.log('🔍 VALIDACIÓN COMPLETA\n');
  
  // 1. Validar CRC
  const crcMatch = payload.match(/63(\d{2})([A-F0-9]{4})$/);
  const crcEnPayload = crcMatch[2];
  const payloadSinCRC = payload.substring(0, payload.length - 6);
  
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
  
  console.log('1️⃣ CRC:');
  console.log(`   En payload: ${crcEnPayload}`);
  console.log(`   Calculado:  ${crcCalculado}`);
  console.log(`   Payload sin CRC: ${payloadSinCRC.substring(0, 80)}...`);
  console.log(`   Data para CRC: ${dataParaCRC.substring(0, 80)}...`);
  if (crcEnPayload === crcCalculado) {
    console.log('   ✅ CRC CORRECTO\n');
  } else {
    console.error('   ❌ CRC INCORRECTO');
    console.error(`   El backend está calculando: ${crcEnPayload}`);
    console.error(`   El CRC correcto debería ser: ${crcCalculado}`);
    console.error('   → Ver: CORRECCION_CRC_BACKEND_URGENTE.md\n');
  }
  
  // 2. Validar tamaño QR
  if (qrCode && qrCode.startsWith('data:image')) {
    const img = new Image();
    img.onload = () => {
      console.log('2️⃣ TAMAÑO QR:');
      console.log(`   Dimensiones: ${img.width}x${img.height}px`);
      if (img.width >= 400 && img.height >= 400) {
        console.log('   ✅ Tamaño correcto\n');
      } else {
        console.error('   ❌ QR muy pequeño (300x300px)');
        console.error('   Backend debe generar a 400x400px mínimo\n');
      }
      
      // Resumen final
      console.log('═'.repeat(50));
      console.log('📊 RESUMEN FINAL:\n');
      
      if (crcEnPayload === crcCalculado && img.width >= 400 && img.height >= 400) {
        console.log('✅ TODO CORRECTO');
        console.log('El QR debería ser escaneable.');
      } else {
        console.log('⚠️ PROBLEMAS ENCONTRADOS:');
        if (crcEnPayload !== crcCalculado) {
          console.log('   ❌ CRC incorrecto');
        }
        if (img.width < 400 || img.height < 400) {
          console.log('   ❌ QR muy pequeño (300x300px)');
          console.log('   → Backend debe agregar: img.resize((400, 400), Image.Resampling.LANCZOS)');
        }
      }
    };
    img.src = qrCode;
  }
  
  return { crcCorrecto: crcEnPayload === crcCalculado };
}

validarTodo();
window.validarTodo = validarTodo;

