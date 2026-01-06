/**
 * Script para ejecutar en la consola del navegador
 * 
 * Copia y pega este código en la consola del navegador (F12)
 * cuando estés en la página de detalle de venta
 */

async function testQRPaymentFromBrowser() {
  console.log('🧪 Iniciando prueba de pago QR desde el navegador...\n');

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
          m.category === 'pos'
        )
      : [];

    console.log(`   ✅ Métodos QR encontrados: ${qrMethods.length}`);
    qrMethods.forEach((method, index) => {
      console.log(`   ${index + 1}. ${method.label} (${method.code}) - ID: ${method.id}`);
    });

    if (qrMethods.length === 0) {
      console.log('\n   ⚠️  No se encontraron métodos QR.');
      return;
    }

    const selectedMethod = qrMethods[0];
    console.log(`\n   ✅ Usando método: ${selectedMethod.label}\n`);

    // Paso 2: Crear pago QR
    console.log('2️⃣ Creando pago QR...');
    const paymentData = {
      amount: 1000.00,
      status: 'pending',
      paymentMethodId: selectedMethod.id,
      reference: `TEST-QR-${Date.now()}`,
    };

    console.log('   📤 Datos enviados:', JSON.stringify(paymentData, null, 2));

    const createResponse = await fetch(`/api/proxy/sales/${saleId}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      throw new Error(`Error ${createResponse.status}: ${JSON.stringify(errorData)}`);
    }

    const payment = await createResponse.json();
    console.log('\n   ✅ Pago creado exitosamente!\n');

    // Paso 3: Analizar respuesta
    console.log('3️⃣ Analizando respuesta del backend...\n');
    console.log('📋 Respuesta completa:');
    console.log(JSON.stringify(payment, null, 2));
    console.log('\n');

    // Verificar campos importantes
    console.log('🔍 Verificación:');
    console.log(`   ✅ ID: ${payment.id}`);
    console.log(`   ✅ Status: ${payment.status}`);
    console.log(`   ✅ Amount: ${payment.amount}`);
    console.log(`   ${payment.reference ? '✅' : '⚠️ '} Reference: ${payment.reference || 'No disponible'}`);
    console.log(`   ${payment.external_reference ? '✅' : '⚠️ '} External Reference: ${payment.external_reference || 'No disponible'}`);
    
    // Verificar gateway_metadata
    console.log(`\n   🔑 Gateway Metadata:`);
    if (payment.gateway_metadata) {
      console.log(`      ✅ Existe`);
      console.log(`      Contenido:`, payment.gateway_metadata);
      
      if (payment.gateway_metadata.qr_code) {
        console.log(`\n   ✅✅✅ QR CODE ENCONTRADO ✅✅✅`);
        console.log(`      URL: ${payment.gateway_metadata.qr_code}`);
        console.log(`      Tipo: ${payment.gateway_metadata.qr_code.startsWith('data:') ? 'Data URL (Base64)' : 'URL Externa'}`);
        console.log(`\n   💡 El QR debería aparecer en el modal ahora.`);
      } else {
        console.log(`\n   ❌❌❌ QR CODE NO ENCONTRADO ❌❌❌`);
        console.log(`      El backend NO está devolviendo gateway_metadata.qr_code`);
        console.log(`\n   💡 El backend debe devolver:`);
        console.log(`      gateway_metadata: {`);
        console.log(`        qr_code: "https://..." // URL de la imagen QR`);
        console.log(`      }`);
      }
    } else {
      console.log(`      ❌ NO EXISTE`);
      console.log(`\n   ❌❌❌ PROBLEMA ENCONTRADO ❌❌❌`);
      console.log(`      El backend NO está devolviendo gateway_metadata`);
    }

    console.log('\n✅ Prueba completada!');
    console.log('💡 Revisa la respuesta arriba para ver qué está devolviendo el backend.\n');

    return payment;

  } catch (error) {
    console.error('\n❌ Error durante la prueba:');
    console.error(error.message);
    console.error(error);
  }
}

// Ejecutar automáticamente
testQRPaymentFromBrowser();

