/**
 * Script completo para diagnosticar por qué el QR no es escaneable
 * 
 * Ejecutar directamente en la consola del navegador después de crear un pago QR
 */

async function diagnosticoQREscanear() {
  console.log('🔍 DIAGNÓSTICO COMPLETO: ¿Por qué el QR no es escaneable?\n');
  console.log('═'.repeat(70));

  // Obtener token
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.error('❌ No hay token. Debes estar logueado.');
    return;
  }

  // Obtener saleId
  const urlParts = window.location.pathname.split('/');
  const saleId = urlParts[urlParts.length - 1];
  if (!saleId || saleId === 'sales') {
    console.error('❌ No se pudo obtener el ID de la venta.');
    return;
  }

  try {
    // Obtener pagos QR pendientes
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
      p.gateway_metadata?.qr_code
    );

    if (qrPayments.length === 0) {
      console.log('⚠️ No hay pagos QR pendientes.');
      console.log('   Crea un pago QR primero.');
      return;
    }

    const payment = qrPayments[qrPayments.length - 1];
    const payload = payment.gateway_metadata?.qr_payload;
    const qrCode = payment.gateway_metadata?.qr_code;

    if (!payload) {
      console.error('❌ No hay payload EMV disponible.');
      return;
    }

    console.log(`📋 Analizando pago: ${payment.id}\n`);
    console.log(`Payload completo (${payload.length} caracteres):`);
    console.log(payload);
    console.log('\n');

    // ============================================
    // 1. VERIFICAR CAMPO 52 ESPECÍFICAMENTE
    // ============================================
    console.log('═'.repeat(70));
    console.log('1️⃣ VERIFICACIÓN DEL CAMPO 52 (Merchant Category Code)\n');
    
    const pos52 = payload.indexOf('52');
    if (pos52 === -1) {
      console.error('❌ No se encontró el campo 52 en el payload');
    } else {
      const campo52Id = payload.substring(pos52, pos52 + 2);
      const campo52LengthStr = payload.substring(pos52 + 2, pos52 + 4);
      const campo52Length = parseInt(campo52LengthStr, 10);
      const campo52Value = payload.substring(pos52 + 4, pos52 + 4 + campo52Length);
      
      console.log(`   Posición: ${pos52}`);
      console.log(`   ID: "${campo52Id}"`);
      console.log(`   Longitud (string): "${campo52LengthStr}"`);
      console.log(`   Longitud (número): ${campo52Length}`);
      console.log(`   Valor: "${campo52Value}"`);
      
      if (campo52LengthStr === '00') {
        console.error(`\n   ❌ PROBLEMA CRÍTICO: Campo 52 tiene longitud "00"`);
        console.error(`   El backend está generando "5200..." cuando debería generar "52045492"`);
        console.error(`   Esto hace que el QR NO sea escaneable.`);
      } else if (campo52LengthStr === '04' && campo52Value === '5492') {
        console.log(`\n   ✅ Campo 52 CORRECTO`);
      } else {
        console.warn(`\n   ⚠️ Campo 52 tiene formato inesperado`);
        console.warn(`   Longitud: "${campo52LengthStr}", Valor: "${campo52Value}"`);
      }
    }

    // ============================================
    // 2. DECODIFICAR PAYLOAD COMPLETO
    // ============================================
    console.log('\n═'.repeat(70));
    console.log('2️⃣ DECODIFICACIÓN COMPLETA DEL PAYLOAD EMV\n');

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

      const nombres = {
        '00': 'Payload Format Indicator',
        '01': 'Point of Initiation Method',
        '26': 'Merchant Account Information',
        '52': 'Merchant Category Code',
        '53': 'Transaction Currency',
        '54': 'Transaction Amount',
        '58': 'Country Code',
        '59': 'Merchant Name',
        '60': 'Merchant City',
        '62': 'Additional Data Field Template',
        '63': 'CRC'
      };

      const nombre = nombres[campo.id] || `Campo ${campo.id}`;
      campos[campo.id] = { nombre, valor: campo.value, longitud: campo.length };

      if (campo.length > 0) {
        console.log(`   ${campo.id} - ${nombre}: "${campo.value}" (longitud: ${campo.length})`);
      } else {
        console.warn(`   ${campo.id} - ${nombre}: VACÍO (longitud: 0) ⚠️`);
      }
    }

    // ============================================
    // 3. VERIFICAR CAMPOS REQUERIDOS
    // ============================================
    console.log('\n═'.repeat(70));
    console.log('3️⃣ VERIFICACIÓN DE CAMPOS REQUERIDOS\n');

    const requeridos = {
      '00': { nombre: 'Payload Format Indicator', valorEsperado: '01' },
      '01': { nombre: 'Point of Initiation Method', valorEsperado: '12' },
      '52': { nombre: 'Merchant Category Code', valorEsperado: '5492' },
      '53': { nombre: 'Transaction Currency', valorEsperado: '032' },
      '54': { nombre: 'Transaction Amount', valorEsperado: null },
      '58': { nombre: 'Country Code', valorEsperado: 'AR' },
      '59': { nombre: 'Merchant Name', valorEsperado: null },
      '60': { nombre: 'Merchant City', valorEsperado: null },
      '63': { nombre: 'CRC', valorEsperado: null }
    };

    const problemas = [];
    const correctos = [];

    for (const [id, req] of Object.entries(requeridos)) {
      if (campos[id]) {
        if (req.valorEsperado && campos[id].valor !== req.valorEsperado) {
          problemas.push(`${id} - ${req.nombre}: "${campos[id].valor}" (esperado: "${req.valorEsperado}")`);
        } else {
          correctos.push(`${id} - ${req.nombre}: ✅`);
        }
      } else {
        problemas.push(`${id} - ${req.nombre}: ❌ FALTA`);
      }
    }

    if (correctos.length > 0) {
      console.log('✅ Campos correctos:');
      correctos.forEach(c => console.log(`   ${c}`));
    }

    if (problemas.length > 0) {
      console.log('\n❌ Problemas encontrados:');
      problemas.forEach(p => console.log(`   ${p}`));
    }

    // ============================================
    // 4. VERIFICAR IMAGEN QR
    // ============================================
    console.log('\n═'.repeat(70));
    console.log('4️⃣ VERIFICACIÓN DE IMAGEN QR\n');

    if (qrCode) {
      const isBase64 = qrCode.startsWith('data:image');
      console.log(`   Tipo: ${isBase64 ? 'Base64 Data URL' : 'URL Externa'}`);

      if (isBase64) {
        try {
          const base64Data = qrCode.split(',')[1];
          const binaryString = atob(base64Data);
          const sizeKB = Math.round(binaryString.length / 1024);
          console.log(`   Tamaño: ~${sizeKB} KB`);

          const img = new Image();
          img.onload = () => {
            console.log(`   Dimensiones: ${img.width}x${img.height}px`);
            
            if (img.width < 200 || img.height < 200) {
              console.error(`   ❌ QR muy pequeño (mínimo recomendado: 200x200px)`);
              console.error(`   Esto puede causar que las billeteras no puedan escanearlo`);
            } else if (img.width < 400 || img.height < 400) {
              console.warn(`   ⚠️ QR pequeño (recomendado: 400x400px mínimo)`);
              console.warn(`   Puede causar problemas de escaneo`);
            } else {
              console.log(`   ✅ Tamaño óptimo para escaneo`);
            }
          };
          img.src = qrCode;
        } catch (e) {
          console.error(`   ❌ Error al procesar base64: ${e.message}`);
        }
      }
    }

    // ============================================
    // 5. VERIFICAR CRC
    // ============================================
    console.log('\n═'.repeat(70));
    console.log('5️⃣ VERIFICACIÓN DEL CRC\n');

    if (campos['63']) {
      const crc = campos['63'].valor;
      console.log(`   CRC: "${crc}"`);
      console.log(`   Longitud: ${crc.length} caracteres`);
      
      if (crc.length === 4 && /^[A-F0-9]{4}$/.test(crc)) {
        console.log(`   ✅ Formato CRC válido`);
        console.log(`   ⚠️ Nota: La validación del valor requiere cálculo específico`);
        console.log(`   Si el CRC está mal calculado, las billeteras rechazarán el QR`);
      } else {
        console.error(`   ❌ Formato CRC inválido`);
        console.error(`   Debe ser exactamente 4 caracteres hexadecimales`);
      }
    } else {
      console.error(`   ❌ CRC faltante`);
    }

    // ============================================
    // 6. VERIFICAR MERCHANT ACCOUNT INFORMATION
    // ============================================
    console.log('\n═'.repeat(70));
    console.log('6️⃣ VERIFICACIÓN DEL MERCHANT ACCOUNT INFORMATION\n');

    if (campos['26']) {
      const mai = campos['26'].valor;
      console.log(`   Longitud: ${mai.length} caracteres`);
      
      if (mai.length > 99) {
        console.error(`   ❌ EXCEDE 99 CARACTERES (${mai.length})`);
        console.error(`   Esto puede causar que las billeteras rechacen el QR`);
      } else {
        console.log(`   ✅ Longitud válida`);
      }
      
      // Verificar estructura interna
      console.log(`   Primeros 20 caracteres: "${mai.substring(0, 20)}"`);
      console.log(`   Últimos 20 caracteres: "${mai.substring(mai.length - 20)}"`);
    } else {
      console.error(`   ❌ Merchant Account Information faltante`);
    }

    // ============================================
    // 7. DIAGNÓSTICO FINAL
    // ============================================
    console.log('\n═'.repeat(70));
    console.log('📊 DIAGNÓSTICO FINAL\n');

    if (problemas.length === 0) {
      console.log('✅ El payload EMV parece estar correcto.');
      console.log('\n💡 Si el QR aún no es escaneable, las causas más probables son:');
      console.log('\n   1. 🔴 CRC INCORRECTO (más probable)');
      console.log('      - Las billeteras validan el CRC antes de aceptar el QR');
      console.log('      - Si el CRC está mal calculado, rechazan el QR inmediatamente');
      console.log('      - Solución: Verificar el cálculo del CRC en el backend');
      console.log('\n   2. 🟡 Calidad de imagen QR insuficiente');
      console.log('      - QR muy pequeño (< 400x400px)');
      console.log('      - Compresión excesiva');
      console.log('      - Contraste insuficiente');
      console.log('      - Solución: Generar QR a 400x400px mínimo con alta calidad');
      console.log('\n   3. 🟡 Formato del Merchant Account Information');
      console.log('      - Estructura interna no compatible con todas las billeteras');
      console.log('      - Solución: Verificar formato según estándar EMV');
      console.log('\n   4. 🟢 Configuración de la billetera');
      console.log('      - Algunas billeteras requieren registro del comercio');
      console.log('      - Solución: Contactar soporte de la billetera');
    } else {
      console.log(`❌ Se encontraron ${problemas.length} problema(s) en el payload.`);
      console.log('   Estos deben corregirse en el backend antes de probar el escaneo.');
    }

    // Mostrar payload para debugging
    console.log('\n═'.repeat(70));
    console.log('📋 PAYLOAD COMPLETO PARA DEBUGGING:\n');
    console.log(payload);
    console.log('\n');

    return { payment, payload, campos, problemas };

  } catch (error) {
    console.error('\n❌ Error durante el diagnóstico:');
    console.error(error);
  }
}

// Ejecutar automáticamente
diagnosticoQREscanear();

// Función global
window.diagnosticoQREscanear = diagnosticoQREscanear;
window.analizarUltimoQR = diagnosticoQREscanear; // Alias para compatibilidad

console.log('\n💡 Para ejecutar nuevamente, usa:');
console.log('   diagnosticoQREscanear()');
console.log('   o');
console.log('   analizarUltimoQR()');

