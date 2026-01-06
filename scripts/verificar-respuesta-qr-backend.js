/**
 * Script para ejecutar en la consola del navegador
 * 
 * Verifica qué está devolviendo realmente el backend al crear un pago QR
 * y si incluye el qr_code y qr_payload en gateway_metadata
 * 
 * Copia y pega este código en la consola del navegador (F12)
 * cuando estés en la página de detalle de venta
 */

async function verificarRespuestaQRBackend() {
  console.log('🔍 Verificando respuesta del backend al crear pago QR...\n');

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
    // Paso 1: Obtener métodos de pago QR
    console.log('1️⃣ Obteniendo métodos de pago QR...');
    const methodsResponse = await fetch('/api/proxy/payment-methods?isActive=true', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!methodsResponse.ok) {
      throw new Error(`Error ${methodsResponse.status}: ${methodsResponse.statusText}`);
    }

    const methods = await methodsResponse.json();
    const qrMethods = Array.isArray(methods) 
      ? methods.filter(m => 
          m.type === 'qr' || 
          m.category === 'qr' || 
          m.category === 'pos' ||
          m.code?.toLowerCase().includes('qr')
        )
      : [];

    if (qrMethods.length === 0) {
      console.error('❌ No se encontraron métodos QR.');
      return;
    }

    const selectedMethod = qrMethods[0];
    console.log(`✅ Método seleccionado: ${selectedMethod.label} (${selectedMethod.code})\n`);

    // Paso 2: Crear pago QR
    console.log('2️⃣ Creando pago QR...');
    const paymentData = {
      amount: 1000.00,
      status: 'pending',
      paymentMethodId: selectedMethod.id,
      reference: `TEST-QR-${Date.now()}`,
    };

    const idempotencyKey = `${saleId}-qr-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    paymentData.idempotencyKey = idempotencyKey;

    console.log('📤 Datos enviados:', JSON.stringify(paymentData, null, 2));
    console.log('\n⏳ Enviando request al backend...\n');

    const createResponse = await fetch(`/api/proxy/sales/${saleId}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(paymentData),
    });

    console.log(`📥 Status Code: ${createResponse.status}`);
    console.log(`📥 Headers:`, Object.fromEntries(createResponse.headers.entries()));

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      console.error('\n❌ Error en la respuesta:');
      console.error(JSON.stringify(errorData, null, 2));
      throw new Error(`Error ${createResponse.status}: ${JSON.stringify(errorData)}`);
    }

    const payment = await createResponse.json();
    
    console.log('\n✅ Respuesta del backend recibida!\n');
    console.log('═'.repeat(60));
    console.log('📋 RESPUESTA COMPLETA DEL BACKEND:');
    console.log('═'.repeat(60));
    console.log(JSON.stringify(payment, null, 2));
    console.log('═'.repeat(60));

    // Paso 3: Análisis detallado
    console.log('\n🔍 ANÁLISIS DETALLADO:\n');

    // Verificar campos básicos
    console.log('📌 Campos Básicos:');
    console.log(`   ✅ ID: ${payment.id}`);
    console.log(`   ✅ Status: ${payment.status}`);
    console.log(`   ✅ Amount: ${payment.amount}`);
    console.log(`   ${payment.gateway ? '✅' : '❌'} Gateway: ${payment.gateway || 'NO ESPECIFICADO'}`);
    console.log(`   ${payment.reference ? '✅' : '⚠️ '} Reference: ${payment.reference || 'No disponible'}`);
    console.log(`   ${payment.external_reference ? '✅' : '⚠️ '} External Reference: ${payment.external_reference || 'No disponible'}`);

    // Verificar gateway_metadata
    console.log('\n🔑 Gateway Metadata:');
    if (payment.gateway_metadata) {
      console.log('   ✅ Existe');
      console.log('   Contenido completo:', JSON.stringify(payment.gateway_metadata, null, 2));
      
      // Verificar qr_code
      console.log('\n   🖼️ QR Code:');
      if (payment.gateway_metadata.qr_code) {
        const qrCode = payment.gateway_metadata.qr_code;
        const isBase64 = qrCode.startsWith('data:image');
        const isURL = qrCode.startsWith('http');
        
        console.log(`      ✅ EXISTE`);
        console.log(`      Tipo: ${isBase64 ? 'Base64 Data URL' : isURL ? 'URL Externa' : 'Desconocido'}`);
        console.log(`      Longitud: ${qrCode.length} caracteres`);
        console.log(`      Preview: ${qrCode.substring(0, 150)}...`);
        
        if (isBase64) {
          try {
            const base64Data = qrCode.split(',')[1];
            const binaryString = atob(base64Data);
            console.log(`      ✅ Base64 válido`);
            console.log(`      Tamaño de imagen: ~${Math.round(binaryString.length / 1024)} KB`);
          } catch (e) {
            console.error(`      ❌ Base64 inválido: ${e.message}`);
          }
        }
      } else {
        console.error(`      ❌ NO EXISTE`);
        console.error(`      El backend NO está devolviendo gateway_metadata.qr_code`);
        console.error(`      Esto es REQUERIDO para mostrar el QR en el frontend`);
      }

      // Verificar qr_payload
      console.log('\n   📦 QR Payload:');
      if (payment.gateway_metadata.qr_payload) {
        const payload = payment.gateway_metadata.qr_payload;
        console.log(`      ✅ EXISTE`);
        console.log(`      Longitud: ${payload.length} caracteres`);
        console.log(`      Preview: ${payload.substring(0, 100)}...`);
        
        // Verificar formato EMV
        const isEMV = payload.startsWith('000201');
        console.log(`      Formato EMV: ${isEMV ? '✅ Sí' : '❌ No'}`);
        
        if (isEMV) {
          console.log(`      ✅ El payload sigue el estándar EMV`);
          
          // Análisis básico del payload
          console.log(`      \n      🔍 Análisis básico:`);
          
          // Verificar Point of Initiation Method (debe ser 12 para static)
          if (payload.includes('010212')) {
            console.log(`         ✅ Point of Initiation: 12 (Static QR) - Correcto`);
          } else if (payload.includes('010211')) {
            console.warn(`         ⚠️ Point of Initiation: 11 (Dynamic QR) - Debería ser 12`);
          } else {
            console.warn(`         ⚠️ Point of Initiation no encontrado`);
          }
          
          // Verificar Merchant Category Code (debe ser 5492 o configurado)
          if (payload.match(/5204[0-9]{4}/)) {
            const mcc = payload.match(/5204([0-9]{4})/)[1];
            if (mcc === '5492') {
              console.log(`         ✅ Merchant Category Code: ${mcc} (Retail)`);
            } else if (mcc === '0000') {
              console.warn(`         ⚠️ Merchant Category Code: ${mcc} (Sin categoría)`);
            } else {
              console.log(`         ℹ️  Merchant Category Code: ${mcc} (Configurado)`);
            }
          } else {
            console.warn(`         ⚠️ Merchant Category Code no encontrado`);
          }
          
          // Verificar país
          if (payload.includes('5802AR')) {
            console.log(`         ✅ País: AR (Argentina)`);
          } else {
            console.warn(`         ⚠️ País no encontrado o incorrecto`);
          }
          
          // Verificar moneda
          if (payload.includes('5303032')) {
            console.log(`         ✅ Moneda: 032 (ARS)`);
          } else {
            console.warn(`         ⚠️ Moneda no encontrada o incorrecta`);
          }
          
          // Verificar formato de monto (sin decimales)
          const amountMatch = payload.match(/54([0-9]{2})([0-9]+)/);
          if (amountMatch) {
            const amountStr = amountMatch[2];
            if (amountStr.length <= 13) {
              const amount = parseInt(amountStr, 10) / 100;
              console.log(`         ✅ Monto: ${amount.toFixed(2)} (formato sin decimales, ${amountStr.length} dígitos)`);
            } else {
              console.warn(`         ⚠️ Monto excede 13 dígitos (${amountStr.length})`);
            }
          }
          
          // Verificar CRC
          if (payload.match(/6304[A-F0-9]{4}$/)) {
            console.log(`         ✅ CRC presente`);
          } else {
            console.warn(`         ⚠️ CRC puede estar mal formateado`);
          }
          
          console.log(`      \n      💡 Para análisis detallado, usar:`);
          console.log(`         scripts/analizar-payload-emv.js`);
          
        } else {
          console.warn(`      ⚠️ El payload NO sigue el estándar EMV`);
          console.warn(`      Debe empezar con "000201" para ser interoperable`);
        }
      } else {
        console.warn(`      ⚠️ NO EXISTE`);
        console.warn(`      El backend debería devolver gateway_metadata.qr_payload`);
        console.warn(`      Esto ayuda a diagnosticar problemas`);
      }

      // Verificar reference en gateway_metadata
      console.log('\n   🔑 Reference (en gateway_metadata):');
      if (payment.gateway_metadata.reference) {
        console.log(`      ✅ EXISTE: ${payment.gateway_metadata.reference}`);
      } else {
        console.warn(`      ⚠️ NO EXISTE`);
        console.warn(`      Debería estar en gateway_metadata.reference`);
      }

      // Verificar provider
      console.log('\n   🏷️ Provider:');
      const provider = payment.gateway_metadata.provider;
      console.log(`      ${provider ? '✅' : '❌'} Provider: ${provider || 'NO ESPECIFICADO'}`);
      
      if (provider === 'interoperable_qr') {
        console.log(`      ✅ Provider correcto para QR interoperable`);
      } else {
        console.warn(`      ⚠️ Provider debería ser "interoperable_qr"`);
      }

      // Verificar expires_at
      console.log('\n   ⏰ Expires At:');
      if (payment.gateway_metadata.expires_at) {
        console.log(`      ✅ EXISTE: ${payment.gateway_metadata.expires_at}`);
      } else {
        console.log(`      ⚠️ NO EXISTE (opcional)`);
      }

    } else {
      console.error('   ❌ NO EXISTE');
      console.error('   El backend NO está devolviendo gateway_metadata');
      console.error('   Esto es CRÍTICO - el frontend necesita gateway_metadata para mostrar el QR');
    }

    // Diagnóstico final
    console.log('\n📊 DIAGNÓSTICO FINAL:\n');
    
    const problemas = [];
    const advertencias = [];
    const correcto = [];

    if (!payment.gateway_metadata) {
      problemas.push('No hay gateway_metadata');
    } else {
      if (!payment.gateway_metadata.qr_code) {
        problemas.push('No hay qr_code en gateway_metadata');
      } else {
        correcto.push('qr_code existe');
      }

      if (!payment.gateway_metadata.qr_payload) {
        advertencias.push('No hay qr_payload (útil para debugging)');
      } else {
        if (!payment.gateway_metadata.qr_payload.startsWith('000201')) {
          problemas.push('qr_payload no sigue formato EMV (debe empezar con 000201)');
        } else {
          correcto.push('qr_payload es EMV válido');
        }
      }

      if (!payment.gateway_metadata.reference) {
        advertencias.push('No hay reference en gateway_metadata');
      } else {
        correcto.push('reference existe');
      }

      if (payment.gateway_metadata.provider !== 'interoperable_qr') {
        advertencias.push(`Provider es "${payment.gateway_metadata.provider}" en lugar de "interoperable_qr"`);
      } else {
        correcto.push('provider es correcto');
      }
    }

    if (payment.gateway !== 'interoperable_qr') {
      advertencias.push(`Gateway es "${payment.gateway}" en lugar de "interoperable_qr"`);
    } else {
      correcto.push('gateway es correcto');
    }

    if (correcto.length > 0) {
      console.log('✅ Correcto:');
      correcto.forEach(c => console.log(`   - ${c}`));
    }

    if (advertencias.length > 0) {
      console.log('\n⚠️ Advertencias:');
      advertencias.forEach(a => console.log(`   - ${a}`));
    }

    if (problemas.length > 0) {
      console.log('\n❌ Problemas:');
      problemas.forEach(p => console.log(`   - ${p}`));
      console.log('\n💡 El backend necesita:');
      console.log('   1. Devolver gateway_metadata con qr_code (base64)');
      console.log('   2. Devolver gateway_metadata con qr_payload (EMV válido)');
      console.log('   3. Ver: REQUERIMIENTOS_QR_INTEROPERABLE.md');
    } else {
      console.log('\n✅ Todo parece correcto!');
      console.log('   Si el QR aún no es escaneable, puede ser un problema del formato EMV');
      console.log('   o de la configuración del método de pago.');
    }

    console.log('\n✅ Verificación completada!\n');
    return payment;

  } catch (error) {
    console.error('\n❌ Error durante la verificación:');
    console.error(error.message);
    console.error(error);
  }
}

// Ejecutar automáticamente
verificarRespuestaQRBackend();

