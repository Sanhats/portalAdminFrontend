/**
 * Script de prueba para verificar creación de pagos QR
 * 
 * Uso:
 * node scripts/test-qr-payment.js
 * 
 * Requiere:
 * - Variables de entorno: NEXT_PUBLIC_API_URL y token de autenticación
 * - O modificar las constantes al inicio del script
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || ''; // Token de autenticación

async function testQRPayment() {
  console.log('🧪 Iniciando prueba de pago QR...\n');

  // Paso 1: Obtener métodos de pago QR
  console.log('1️⃣ Obteniendo métodos de pago QR...');
  try {
    const methodsResponse = await fetch(`${API_URL}/api/payment-methods?isActive=true`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!methodsResponse.ok) {
      throw new Error(`Error ${methodsResponse.status}: ${methodsResponse.statusText}`);
    }

    const methods = await methodsResponse.json();
    console.log(`   ✅ Encontrados ${Array.isArray(methods) ? methods.length : 0} métodos de pago\n`);

    // Filtrar métodos QR
    const qrMethods = Array.isArray(methods) 
      ? methods.filter(m => 
          m.type === 'qr' || 
          m.category === 'qr' || 
          m.category === 'pos'
        )
      : [];

    console.log(`   📱 Métodos QR encontrados: ${qrMethods.length}`);
    qrMethods.forEach((method, index) => {
      console.log(`   ${index + 1}. ${method.label} (${method.code})`);
      console.log(`      - Type: ${method.type}`);
      console.log(`      - Category: ${method.category || 'N/A'}`);
      console.log(`      - Active: ${method.is_active}`);
    });

    if (qrMethods.length === 0) {
      console.log('\n   ⚠️  No se encontraron métodos QR. Verifica que existan métodos con:');
      console.log('      - type: "qr" O');
      console.log('      - category: "qr" O');
      console.log('      - category: "pos"');
      return;
    }

    const selectedMethod = qrMethods[0];
    console.log(`\n   ✅ Usando método: ${selectedMethod.label} (ID: ${selectedMethod.id})\n`);

    // Paso 2: Obtener una venta confirmada para probar
    console.log('2️⃣ Obteniendo venta confirmada...');
    const salesResponse = await fetch(`${API_URL}/api/sales?status=confirmed&limit=1`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!salesResponse.ok) {
      throw new Error(`Error ${salesResponse.status}: ${salesResponse.statusText}`);
    }

    const salesData = await salesResponse.json();
    const sales = Array.isArray(salesData) 
      ? salesData 
      : (salesData.data || salesData.sales || []);

    if (sales.length === 0) {
      console.log('   ⚠️  No se encontraron ventas confirmadas.');
      console.log('   💡 Crea una venta y confírmala primero.\n');
      return;
    }

    const sale = sales[0];
    console.log(`   ✅ Usando venta: ${sale.id}`);
    console.log(`      - Total: $${sale.total_amount || sale.financial?.totalAmount || 'N/A'}`);
    console.log(`      - Estado: ${sale.status}\n`);

    // Paso 3: Crear pago QR
    console.log('3️⃣ Creando pago QR...');
    const paymentData = {
      amount: 1000.00, // Monto de prueba
      status: 'pending',
      paymentMethodId: selectedMethod.id,
      reference: `TEST-QR-${Date.now()}`,
    };

    console.log('   📤 Enviando:', JSON.stringify(paymentData, null, 2));

    const createResponse = await fetch(`${API_URL}/api/sales/${sale.id}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      throw new Error(`Error ${createResponse.status}: ${JSON.stringify(errorData)}`);
    }

    const payment = await createResponse.json();
    console.log('   ✅ Pago creado exitosamente!\n');

    // Paso 4: Analizar respuesta
    console.log('4️⃣ Analizando respuesta del backend...\n');
    console.log('📋 Datos del pago creado:');
    console.log(JSON.stringify(payment, null, 2));
    console.log('\n');

    // Verificar campos importantes
    console.log('🔍 Verificación de campos:');
    console.log(`   ✅ ID: ${payment.id || '❌ FALTA'}`);
    console.log(`   ✅ Status: ${payment.status || '❌ FALTA'} (debe ser 'pending')`);
    console.log(`   ✅ Amount: ${payment.amount || '❌ FALTA'}`);
    console.log(`   ✅ Payment Method ID: ${payment.payment_method_id || '❌ FALTA'}`);
    console.log(`   ${payment.reference ? '✅' : '❌'} Reference: ${payment.reference || 'FALTA'}`);
    console.log(`   ${payment.external_reference ? '✅' : '⚠️ '} External Reference: ${payment.external_reference || 'No disponible'}`);
    
    // Verificar gateway_metadata
    console.log(`\n   🔑 Gateway Metadata:`);
    if (payment.gateway_metadata) {
      console.log(`      ✅ Existe`);
      console.log(`      Contenido:`, JSON.stringify(payment.gateway_metadata, null, 2));
      
      if (payment.gateway_metadata.qr_code) {
        console.log(`\n   ✅✅✅ QR CODE ENCONTRADO ✅✅✅`);
        console.log(`      URL: ${payment.gateway_metadata.qr_code}`);
        console.log(`      Tipo: ${payment.gateway_metadata.qr_code.startsWith('data:') ? 'Data URL (Base64)' : 'URL Externa'}`);
      } else {
        console.log(`\n   ❌❌❌ QR CODE NO ENCONTRADO ❌❌❌`);
        console.log(`      El backend NO está devolviendo gateway_metadata.qr_code`);
        console.log(`      El frontend necesita este campo para mostrar el QR`);
        console.log(`\n   💡 Solución:`);
        console.log(`      1. Verificar que el backend genere el QR al crear el pago`);
        console.log(`      2. Incluir el QR en gateway_metadata.qr_code`);
        console.log(`      3. El QR puede ser una URL o una data URL (base64)`);
      }
    } else {
      console.log(`      ❌ NO EXISTE`);
      console.log(`\n   ❌❌❌ PROBLEMA ENCONTRADO ❌❌❌`);
      console.log(`      El backend NO está devolviendo gateway_metadata`);
      console.log(`      El frontend necesita gateway_metadata.qr_code para mostrar el QR`);
      console.log(`\n   💡 Solución:`);
      console.log(`      El backend debe devolver:`);
      console.log(`      {`);
      console.log(`        "gateway_metadata": {`);
      console.log(`          "qr_code": "https://..." // URL de la imagen QR`);
      console.log(`        }`);
      console.log(`      }`);
    }

    console.log('\n✅ Prueba completada!\n');

  } catch (error) {
    console.error('\n❌ Error durante la prueba:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Ejecutar prueba
if (require.main === module) {
  if (!ACCESS_TOKEN) {
    console.error('❌ Error: ACCESS_TOKEN no configurado');
    console.error('   Configura la variable de entorno ACCESS_TOKEN o modifica el script');
    console.error('   Ejemplo: ACCESS_TOKEN=tu_token node scripts/test-qr-payment.js');
    process.exit(1);
  }
  testQRPayment();
}

module.exports = { testQRPayment };

