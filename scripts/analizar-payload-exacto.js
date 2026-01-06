/**
 * Script para analizar exactamente qué está pasando con el payload
 */

function analizarPayloadExacto(payload) {
  console.log('🔍 ANÁLISIS EXACTO DEL PAYLOAD\n');
  console.log('═'.repeat(60));
  console.log(`Payload: ${payload}`);
  console.log(`Longitud: ${payload.length} caracteres\n`);
  
  // Buscar el campo 52 manualmente
  const pos52 = payload.indexOf('52');
  console.log(`📍 Posición del campo 52: ${pos52}`);
  
  if (pos52 === -1) {
    console.error('❌ No se encontró el campo 52');
    return;
  }
  
  // Leer campo 52 manualmente
  const campo52Id = payload.substring(pos52, pos52 + 2);
  const campo52LengthStr = payload.substring(pos52 + 2, pos52 + 4);
  const campo52Length = parseInt(campo52LengthStr, 10);
  const campo52Value = payload.substring(pos52 + 4, pos52 + 4 + campo52Length);
  
  console.log(`\n📋 Campo 52 (posición ${pos52}):`);
  console.log(`   ID: "${campo52Id}"`);
  console.log(`   Longitud (string): "${campo52LengthStr}"`);
  console.log(`   Longitud (número): ${campo52Length}`);
  console.log(`   Valor: "${campo52Value}"`);
  console.log(`   Siguientes 20 caracteres: "${payload.substring(pos52 + 4, pos52 + 24)}"`);
  
  // Ver qué viene después
  const siguiente = payload.substring(pos52 + 4 + campo52Length, pos52 + 4 + campo52Length + 20);
  console.log(`\n📋 Después del campo 52 (próximos 20 chars):`);
  console.log(`   "${siguiente}"`);
  
  // Analizar byte por byte alrededor del campo 52
  console.log(`\n📋 Análisis byte por byte (posición ${pos52 - 5} a ${pos52 + 15}):`);
  const contexto = payload.substring(Math.max(0, pos52 - 5), pos52 + 15);
  for (let i = 0; i < contexto.length; i += 2) {
    const pos = pos52 - 5 + i;
    const bytes = contexto.substring(i, i + 2);
    console.log(`   Posición ${pos}: "${bytes}"`);
  }
  
  // Intentar decodificar manualmente desde el campo 52
  console.log(`\n📋 Decodificación manual desde campo 52:`);
  let index = pos52;
  let campoNum = 0;
  
  while (index < payload.length && campoNum < 10) {
    const id = payload.substring(index, index + 2);
    const lengthStr = payload.substring(index + 2, index + 4);
    const length = parseInt(lengthStr, 10);
    
    console.log(`\n   Campo ${campoNum + 1} (posición ${index}):`);
    console.log(`      ID: ${id}`);
    console.log(`      Longitud: ${lengthStr} (${length})`);
    
    if (isNaN(length) || length < 0) {
      console.log(`      ⚠️ Longitud inválida`);
      break;
    }
    
    if (length === 0) {
      console.log(`      ⚠️ Campo con longitud 0`);
      index += 4;
    } else {
      const value = payload.substring(index + 4, index + 4 + length);
      console.log(`      Valor: "${value}"`);
      index += 4 + length;
    }
    
    campoNum++;
  }
  
  // Verificar si el problema está en cómo se genera
  console.log(`\n💡 DIAGNÓSTICO:`);
  if (campo52LengthStr === '00') {
    console.log(`   ❌ El campo 52 tiene longitud "00" (cero)`);
    console.log(`   Esto significa que el backend está generando:`);
    console.log(`   "52" + "00" + ...`);
    console.log(`   Cuando debería generar:`);
    console.log(`   "52" + "04" + "5492"`);
    console.log(`\n   El problema está en el backend - padLength no está funcionando correctamente.`);
  } else if (campo52LengthStr === '04' && campo52Value === '5492') {
    console.log(`   ✅ El campo 52 está correcto`);
    console.log(`   El problema puede estar en otro lugar.`);
  } else {
    console.log(`   ⚠️ Formato inesperado:`);
    console.log(`      Longitud: "${campo52LengthStr}"`);
    console.log(`      Valor: "${campo52Value}"`);
  }
}

// Función para obtener el payload del último pago QR
async function analizarUltimoQR() {
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

    console.log('📋 Analizando último pago QR creado:\n');
    analizarPayloadExacto(payload);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar automáticamente con el payload del ejemplo
const payloadEjemplo = "00020101021226490002AR012201103432300343175379290213SALE-35B92211520004549253003032540718000005802AR5912Toludev shop6009Argentina6240050000000000000000000000013SALE-35B922116300044371";

console.log('🧪 Analizando payload del ejemplo:\n');
analizarPayloadExacto(payloadEjemplo);

// Funciones globales
window.analizarPayloadExacto = analizarPayloadExacto;
window.analizarUltimoQR = analizarUltimoQR;

console.log('\n💡 Para analizar el último QR creado, ejecuta:');
console.log('   analizarUltimoQR()');

