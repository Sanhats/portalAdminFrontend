/**
 * Script para ejecutar en la consola del navegador
 * 
 * Diagnostica si el QR generado es válido para billeteras interoperables
 * (Mercado Pago, Naranja X, etc.)
 * 
 * Copia y pega este código en la consola del navegador (F12)
 * cuando estés en la página de detalle de venta con un pago QR creado
 */

async function diagnosticarQRInteroperable() {
  console.log('🔍 Iniciando diagnóstico de QR interoperable...\n');

  // Obtener token de localStorage
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.error('❌ No hay token de autenticación. Debes estar logueado.');
    return;
  }

  // Obtener saleId de la URL
  const urlParts = window.location.pathname.split('/');
  const saleId = urlParts[urlParts.length - 1];
  if (!saleId || saleId === 'sales') {
    console.error('❌ No se pudo obtener el ID de la venta de la URL.');
    console.error('   Asegúrate de estar en la página de detalle de venta: /admin/sales/[id]');
    return;
  }

  console.log(`✅ Sale ID: ${saleId}\n`);

  try {
    // Obtener pagos de la venta
    console.log('1️⃣ Obteniendo pagos de la venta...');
    const paymentsResponse = await fetch(`/api/proxy/sales/${saleId}/payments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!paymentsResponse.ok) {
      throw new Error(`Error ${paymentsResponse.status}: ${paymentsResponse.statusText}`);
    }

    const paymentsData = await paymentsResponse.json();
    const payments = paymentsData.payments || paymentsData || [];
    
    // Buscar pagos QR pendientes
    const qrPayments = payments.filter(p => 
      p.status === 'pending' && 
      (p.gateway_metadata?.qr_code || p.method === 'qr' || p.payment_methods?.type === 'qr')
    );

    if (qrPayments.length === 0) {
      console.log('⚠️ No se encontraron pagos QR pendientes.');
      console.log('   Crea un pago QR primero desde el modal "Pago QR".');
      return;
    }

    console.log(`✅ Pagos QR encontrados: ${qrPayments.length}\n`);

    // Analizar cada pago QR
    for (const payment of qrPayments) {
      console.log(`\n📋 Analizando pago: ${payment.id}`);
      console.log('─'.repeat(60));

      const qrCode = payment.gateway_metadata?.qr_code;
      const qrPayload = payment.gateway_metadata?.qr_payload;
      const reference = payment.gateway_metadata?.reference || payment.reference;
      const provider = payment.gateway_metadata?.provider;
      const gateway = payment.gateway;

      // Verificar estructura básica
      console.log('\n🔍 Estructura del pago:');
      console.log(`   ID: ${payment.id}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Amount: ${payment.amount}`);
      console.log(`   Gateway: ${gateway || 'No especificado'}`);
      console.log(`   Provider: ${provider || 'No especificado'}`);
      console.log(`   Reference: ${reference || 'No especificada'}`);

      // Verificar QR Code
      console.log('\n🖼️ QR Code:');
      if (qrCode) {
        const isBase64 = qrCode.startsWith('data:image');
        const isURL = qrCode.startsWith('http');
        
        console.log(`   ✅ Existe`);
        console.log(`   Tipo: ${isBase64 ? 'Base64 Data URL' : isURL ? 'URL Externa' : 'Desconocido'}`);
        console.log(`   Longitud: ${qrCode.length} caracteres`);
        console.log(`   Preview: ${qrCode.substring(0, 100)}...`);

        if (isBase64) {
          // Intentar decodificar para verificar que es una imagen válida
          try {
            const base64Data = qrCode.split(',')[1];
            const binaryString = atob(base64Data);
            console.log(`   ✅ Base64 válido`);
            console.log(`   Tamaño de imagen: ~${Math.round(binaryString.length / 1024)} KB`);
          } catch (e) {
            console.error(`   ❌ Base64 inválido: ${e.message}`);
          }
        }
      } else {
        console.error(`   ❌ NO EXISTE`);
        console.error(`   El backend NO está devolviendo gateway_metadata.qr_code`);
      }

      // Verificar QR Payload (si existe)
      console.log('\n📦 QR Payload:');
      if (qrPayload) {
        console.log(`   ✅ Existe`);
        console.log(`   Longitud: ${qrPayload.length} caracteres`);
        console.log(`   Preview: ${qrPayload.substring(0, 100)}...`);
        
        // Verificar formato EMV (estándar para QR interoperables)
        const isEMV = qrPayload.startsWith('000201') || qrPayload.startsWith('00');
        console.log(`   Formato EMV: ${isEMV ? '✅ Sí' : '❌ No'}`);
        
        if (isEMV) {
          console.log(`   ✅ El payload parece seguir el estándar EMV`);
        } else {
          console.warn(`   ⚠️ El payload NO parece seguir el estándar EMV`);
          console.warn(`   Las billeteras pueden no reconocer este formato`);
        }
      } else {
        console.warn(`   ⚠️ NO EXISTE`);
        console.warn(`   El backend debería devolver gateway_metadata.qr_payload`);
        console.warn(`   Esto ayuda a diagnosticar problemas`);
      }

      // Verificar Reference
      console.log('\n🔑 Reference:');
      if (reference) {
        console.log(`   ✅ Existe: ${reference}`);
      } else {
        console.error(`   ❌ NO EXISTE`);
        console.error(`   La referencia es CLAVE para el matching automático`);
      }

      // Diagnóstico de interoperabilidad
      console.log('\n🌐 Diagnóstico de Interoperabilidad:');
      
      const problemas = [];
      const advertencias = [];

      if (!qrCode) {
        problemas.push('No hay QR code');
      }

      if (!reference) {
        problemas.push('No hay referencia de pago');
      }

      if (qrPayload && !qrPayload.startsWith('000201')) {
        advertencias.push('El payload no parece seguir el estándar EMV');
      }

      if (provider === 'generic' || !provider) {
        advertencias.push('Provider es genérico o no especificado');
      }

      if (gateway !== 'interoperable_qr') {
        advertencias.push(`Gateway es "${gateway}" en lugar de "interoperable_qr"`);
      }

      if (problemas.length > 0) {
        console.error(`   ❌ PROBLEMAS ENCONTRADOS:`);
        problemas.forEach(p => console.error(`      - ${p}`));
      }

      if (advertencias.length > 0) {
        console.warn(`   ⚠️ ADVERTENCIAS:`);
        advertencias.forEach(a => console.warn(`      - ${a}`));
      }

      if (problemas.length === 0 && advertencias.length === 0) {
        console.log(`   ✅ Todo parece correcto`);
      }

      // Recomendaciones
      console.log('\n💡 Recomendaciones:');
      
      if (problemas.length > 0 || advertencias.length > 0) {
        console.log(`   1. El backend debe generar un QR interoperable válido`);
        console.log(`   2. El QR debe seguir el estándar EMV (EMVCo QR Code)`);
        console.log(`   3. El QR debe contener datos de pago válidos`);
        console.log(`   4. Ver documentación: REQUERIMIENTOS_QR_INTEROPERABLE.md`);
      } else {
        console.log(`   ✅ El QR parece estar bien formado`);
        console.log(`   Si aún no funciona, puede ser un problema del backend`);
        console.log(`   o de la configuración del método de pago`);
      }
    }

    console.log('\n✅ Diagnóstico completado!');
    console.log('💡 Revisa los resultados arriba para identificar problemas.\n');

  } catch (error) {
    console.error('\n❌ Error durante el diagnóstico:');
    console.error(error.message);
    console.error(error);
  }
}

// Ejecutar automáticamente
diagnosticarQRInteroperable();

