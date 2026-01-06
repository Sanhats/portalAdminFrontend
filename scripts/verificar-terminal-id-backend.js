/**
 * Script para verificar que el backend está usando Terminal ID FIJO
 * 
 * Este script crea un pago QR y verifica que:
 * 1. El campo 26 contenga "TERMINAL01" (fijo)
 * 2. El campo 26 NO contenga "SALE-" (variable)
 * 3. El campo 62 contenga "SALE-" (referencia)
 * 
 * Copia y pega este código en la consola del navegador (F12)
 * cuando estés en la página de detalle de venta
 */

async function verificarTerminalIdBackend() {
  console.log('🔍 VERIFICANDO CORRECCIÓN DEL BACKEND: Terminal ID FIJO\n');
  console.log('═'.repeat(70));

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

  console.log(`\n✅ Sale ID: ${saleId}`);

  try {
    // Obtener métodos de pago QR
    console.log('\n1️⃣ Obteniendo métodos de pago QR...');
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
      ? methods.filter(m => m.type === 'qr' || m.category === 'qr' || m.code?.toLowerCase().includes('qr'))
      : [];

    if (qrMethods.length === 0) {
      console.error('❌ No se encontraron métodos QR.');
      return;
    }

    const selectedMethod = qrMethods[0];
    console.log(`✅ Método seleccionado: ${selectedMethod.label} (${selectedMethod.code})`);

    // Crear pago QR
    console.log('\n2️⃣ Creando pago QR de prueba...');
    const paymentData = {
      amount: 1000.00,
      status: 'pending',
      paymentMethodId: selectedMethod.id,
      reference: `TEST-${Date.now()}`,
    };

    const idempotencyKey = `verify-terminal-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    paymentData.idempotencyKey = idempotencyKey;

    const createResponse = await fetch(`/api/proxy/sales/${saleId}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(paymentData),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      console.error('❌ Error al crear pago:', JSON.stringify(errorData, null, 2));
      throw new Error(`Error ${createResponse.status}`);
    }

    const payment = await createResponse.json();
    console.log('✅ Pago creado exitosamente');

    // Verificar que tenga payload
    if (!payment.gateway_metadata?.qr_payload) {
      console.error('\n❌ El pago NO tiene qr_payload en gateway_metadata');
      console.error('   El backend debe devolver el payload EMV');
      return;
    }

    const payload = payment.gateway_metadata.qr_payload;
    console.log(`\n✅ Payload recibido (${payload.length} caracteres)`);

    // Analizar el campo 26
    console.log('\n3️⃣ ANALIZANDO CAMPO 26 (Merchant Account Information)\n');
    console.log('═'.repeat(70));

    // Decodificar payload EMV
    let index = 0;
    const campos = {};

    function leerCampo() {
      if (index >= payload.length) return null;
      const id = payload.substring(index, index + 2);
      index += 2;
      if (index + 2 > payload.length) return null;
      const lengthStr = payload.substring(index, index + 2);
      const length = parseInt(lengthStr, 10);
      if (isNaN(length) || length < 0) return null;
      index += 2;
      if (length === 0) return { id, length: 0, value: '' };
      if (index + length > payload.length) return null;
      const value = payload.substring(index, index + length);
      index += length;
      return { id, length, value };
    }

    while (index < payload.length) {
      const campo = leerCampo();
      if (!campo) break;
      campos[campo.id] = campo;
    }

    if (!campos['26']) {
      console.error('❌ No se encontró el campo 26 en el payload');
      return;
    }

    const campo26 = campos['26'].value;
    console.log(`Campo 26 completo: "${campo26}"`);
    console.log(`Longitud: ${campo26.length} caracteres\n`);

    // Decodificar subcampos del campo 26
    let idx = 0;
    const subcampos = {};

    while (idx < campo26.length) {
      const subId = campo26.substring(idx, idx + 2);
      idx += 2;
      if (idx + 2 > campo26.length) break;
      const subLengthStr = campo26.substring(idx, idx + 2);
      const subLength = parseInt(subLengthStr, 10);
      idx += 2;
      if (idx + subLength > campo26.length) break;
      const subValue = campo26.substring(idx, idx + subLength);
      idx += subLength;
      subcampos[subId] = subValue;
    }

    console.log('Subcampos decodificados:');
    console.log(`  00 (País): "${subcampos['00']}"`);
    console.log(`  01 (CBU/CVU): "${subcampos['01']}"`);
    console.log(`  02 (Terminal ID): "${subcampos['02']}"\n`);

    // Verificaciones
    console.log('═'.repeat(70));
    console.log('4️⃣ VERIFICACIONES\n');

    const tests = [];

    // Test 1: Terminal ID es "TERMINAL01"
    const terminalId = subcampos['02'];
    if (terminalId === 'TERMINAL01') {
      console.log('✅ Test 1: Terminal ID es "TERMINAL01" (FIJO)');
      tests.push({ name: 'Terminal ID fijo', passed: true });
    } else {
      console.error(`❌ Test 1: Terminal ID es "${terminalId}" (esperado: "TERMINAL01")`);
      tests.push({ name: 'Terminal ID fijo', passed: false });
    }

    // Test 2: Terminal ID NO contiene "SALE-"
    if (!terminalId.includes('SALE-')) {
      console.log('✅ Test 2: Terminal ID NO contiene "SALE-" (correcto)');
      tests.push({ name: 'Terminal ID no variable', passed: true });
    } else {
      console.error('❌ Test 2: Terminal ID contiene "SALE-" (es variable)');
      tests.push({ name: 'Terminal ID no variable', passed: false });
    }

    // Test 3: Campo 62 existe
    if (campos['62']) {
      console.log('✅ Test 3: Campo 62 (Additional Data) existe');
      tests.push({ name: 'Campo 62 existe', passed: true });

      // Test 4: Campo 62 contiene "SALE-"
      const campo62 = campos['62'].value;
      if (campo62.includes('SALE-')) {
        console.log(`✅ Test 4: Campo 62 contiene referencia "SALE-" (correcto)`);
        tests.push({ name: 'Referencia en campo 62', passed: true });
      } else {
        console.error('❌ Test 4: Campo 62 NO contiene referencia "SALE-"');
        tests.push({ name: 'Referencia en campo 62', passed: false });
      }
    } else {
      console.error('❌ Test 3: Campo 62 NO existe');
      tests.push({ name: 'Campo 62 existe', passed: false });
      tests.push({ name: 'Referencia en campo 62', passed: false });
    }

    // Resultado final
    console.log('\n═'.repeat(70));
    console.log('📊 RESULTADO FINAL\n');

    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;

    console.log(`Tests pasados:  ${passed}`);
    console.log(`Tests fallados: ${failed}\n`);

    if (failed === 0) {
      console.log('🎉 ✅ CORRECCIÓN VERIFICADA: El backend está usando Terminal ID FIJO');
      console.log('   El QR debería funcionar correctamente en todas las billeteras\n');
      console.log('🧪 Próximo paso: Probar escaneo con billeteras:');
      console.log('   - Mercado Pago');
      console.log('   - Naranja X');
      console.log('   - MODO');
      console.log('   - App bancaria');
    } else {
      console.error('❌ PROBLEMAS DETECTADOS:');
      tests.filter(t => !t.passed).forEach(t => {
        console.error(`   - ${t.name}`);
      });
      console.error('\n💡 El backend necesita verificar la corrección aplicada.');
    }

    // Mostrar payload completo para debugging
    console.log('\n═'.repeat(70));
    console.log('🔍 PAYLOAD COMPLETO (para debugging):\n');
    console.log(payload);
    console.log('\n═'.repeat(70));

  } catch (error) {
    console.error('\n❌ Error durante la verificación:');
    console.error(error.message);
    console.error(error);
  }
}

// Ejecutar automáticamente
verificarTerminalIdBackend();

// Función global para usar desde consola
window.verificarTerminalIdBackend = verificarTerminalIdBackend;

console.log('\n💡 Para ejecutar nuevamente, usa:');
console.log('   verificarTerminalIdBackend()');

