/**
 * Script para validar el CRC del payload EMV
 * 
 * El CRC es crítico: si está mal calculado, las billeteras rechazan el QR
 */

function validarCRCEMV(payload) {
  console.log('🔍 VALIDACIÓN DEL CRC EMV\n');
  console.log('═'.repeat(70));
  console.log(`Payload completo: ${payload}`);
  console.log(`Longitud: ${payload.length} caracteres\n`);

  // Extraer el CRC del payload
  const crcMatch = payload.match(/63(\d{2})([A-F0-9]{4})$/);
  if (!crcMatch) {
    console.error('❌ No se encontró el campo CRC (63) al final del payload');
    return;
  }

  const crcLength = parseInt(crcMatch[1], 10);
  const crcValue = crcMatch[2];
  const payloadSinCRC = payload.substring(0, payload.length - 6); // Sin "63" + longitud + CRC

  console.log(`📋 Información del CRC:`);
  console.log(`   Campo completo: 63${crcMatch[1]}${crcValue}`);
  console.log(`   Longitud: ${crcLength}`);
  console.log(`   Valor: ${crcValue}`);
  console.log(`   Payload sin CRC: ${payloadSinCRC}`);
  console.log(`   Longitud payload sin CRC: ${payloadSinCRC.length} caracteres\n`);

  // Calcular CRC16-CCITT según estándar EMV
  function calculateCRC16CCITT(data) {
    let crc = 0xFFFF;
    const polynomial = 0x1021;

    for (let i = 0; i < data.length; i++) {
      const byte = data.charCodeAt(i);
      crc ^= (byte << 8);
      
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ polynomial;
        } else {
          crc <<= 1;
        }
        crc &= 0xFFFF;
      }
    }

    return crc;
  }

  // Calcular CRC sobre el payload sin CRC + "6304"
  const dataParaCRC = payloadSinCRC + "6304";
  const crcCalculado = calculateCRC16CCITT(dataParaCRC);
  const crcCalculadoHex = crcCalculado.toString(16).toUpperCase().padStart(4, '0');

  console.log('═'.repeat(70));
  console.log('📊 RESULTADO DE LA VALIDACIÓN:\n');
  console.log(`   CRC en el payload: ${crcValue}`);
  console.log(`   CRC calculado:     ${crcCalculadoHex}`);
  console.log(`   Datos para CRC:    "${dataParaCRC}"\n`);

  if (crcValue === crcCalculadoHex) {
    console.log('   ✅ CRC CORRECTO');
    console.log('   El CRC está bien calculado según el estándar EMV.');
  } else {
    console.error('   ❌ CRC INCORRECTO');
    console.error(`   El CRC en el payload (${crcValue}) no coincide con el calculado (${crcCalculadoHex}).`);
    console.error('   Esto hace que las billeteras rechacen el QR.');
    console.error('\n   💡 El backend debe corregir el cálculo del CRC.');
  }

  // Información adicional
  console.log('\n═'.repeat(70));
  console.log('ℹ️  INFORMACIÓN ADICIONAL:\n');
  console.log('   El CRC se calcula sobre:');
  console.log(`   1. Payload completo SIN el campo 63 (CRC)`);
  console.log(`   2. Más los caracteres "6304" (campo 63 + longitud)`);
  console.log(`   3. Usando algoritmo CRC16-CCITT (polynomial 0x1021)`);
  console.log('\n   Algoritmo:');
  console.log('   - Valor inicial: 0xFFFF');
  console.log('   - Polynomial: 0x1021');
  console.log('   - Resultado: 4 dígitos hexadecimales');

  return {
    crcEnPayload: crcValue,
    crcCalculado: crcCalculadoHex,
    esCorrecto: crcValue === crcCalculadoHex
  };
}

// Función para usar desde consola con el último QR
async function validarCRCUltimoQR() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.error('❌ No hay token. Debes estar logueado.');
    return;
  }

  const urlParts = window.location.pathname.split('/');
  const saleId = urlParts[urlParts.length - 1];
  if (!saleId || saleId === 'sales') {
    console.error('❌ No se pudo obtener el ID de la venta.');
    return;
  }

  try {
    const paymentsResponse = await fetch(`/api/proxy/sales/${saleId}/payments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const paymentsData = await paymentsResponse.json();
    const payments = paymentsData.payments || paymentsData || [];
    const qrPayments = payments.filter(p => 
      p.status === 'pending' && 
      p.gateway_metadata?.qr_payload
    );

    if (qrPayments.length === 0) {
      console.log('⚠️ No hay pagos QR pendientes.');
      return;
    }

    const payment = qrPayments[qrPayments.length - 1];
    const payload = payment.gateway_metadata?.qr_payload;

    if (!payload) {
      console.error('❌ No hay payload disponible.');
      return;
    }

    console.log(`📋 Validando CRC del pago: ${payment.id}\n`);
    return validarCRCEMV(payload);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Funciones globales
window.validarCRCEMV = validarCRCEMV;
window.validarCRCUltimoQR = validarCRCUltimoQR;

console.log('\n💡 Para validar el CRC del último QR creado:');
console.log('   validarCRCUltimoQR()');
console.log('\n💡 Para validar un payload específico:');
console.log('   validarCRCEMV("tu-payload-aqui")');

