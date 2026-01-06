/**
 * Script de diagnóstico completo para QR
 * 
 * Analiza el payload EMV completo y verifica todos los aspectos
 * que pueden causar que las billeteras no puedan escanear el QR
 */

async function diagnosticoCompletoQR() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DE QR\n');
  console.log('═'.repeat(60));

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

    const payment = qrPayments[qrPayments.length - 1]; // El más reciente
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
    
    // Análisis rápido del campo 52
    const pos52 = payload.indexOf('52');
    if (pos52 !== -1) {
      const campo52LengthStr = payload.substring(pos52 + 2, pos52 + 4);
      console.log(`🔍 Análisis rápido del campo 52 (posición ${pos52}):`);
      console.log(`   Longitud leída: "${campo52LengthStr}"`);
      if (campo52LengthStr === '00') {
        console.error(`   ❌ PROBLEMA: El campo 52 tiene longitud "00"`);
        console.error(`   El backend está generando "5200..." cuando debería generar "52045492"`);
        console.error(`   Verificar que padLength(mcc, 2) esté funcionando correctamente.`);
      }
      console.log('');
    }

    // Decodificar payload EMV completo
    let index = 0;
    const campos = {};

    function leerCampo() {
      if (index >= payload.length) return null;
      
      // Leer ID (2 dígitos)
      if (index + 2 > payload.length) return null;
      const id = payload.substring(index, index + 2);
      index += 2;
      
      // Leer longitud (2 dígitos)
      if (index + 2 > payload.length) return null;
      const lengthStr = payload.substring(index, index + 2);
      const length = parseInt(lengthStr, 10);
      
      // Validar longitud
      if (isNaN(length) || length < 0) {
        console.warn(`⚠️ Longitud inválida en campo ${id}: "${lengthStr}"`);
        return null;
      }
      
      index += 2;
      
      // Si la longitud es 0, retornar campo vacío PERO seguir avanzando
      if (length === 0) {
        return { id, length: 0, value: '' };
      }
      
      // Leer valor
      if (index + length > payload.length) {
        console.warn(`⚠️ Campo ${id} excede el payload disponible`);
        return null;
      }
      
      const value = payload.substring(index, index + length);
      index += length;
      
      return { id, length, value };
    }

    console.log('📋 DECODIFICACIÓN COMPLETA DEL PAYLOAD EMV:\n');
    console.log(`Índice inicial: ${index}, Longitud payload: ${payload.length}\n`);

    while (index < payload.length) {
      const campoAntes = index;
      const campo = leerCampo();
      if (!campo) {
        const restante = payload.substring(index);
        if (restante.length > 0) {
          console.warn(`⚠️ No se pudo leer más campos. Índice: ${index}, Restante (primeros 50 chars): "${restante.substring(0, 50)}"`);
        }
        break;
      }
      
      // Debug: mostrar posición
      if (campo.length === 0) {
        console.warn(`⚠️ Campo ${campo.id} tiene longitud 0 en posición ${campoAntes}`);
      }

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

      console.log(`${campo.id} - ${nombre}:`);
      console.log(`   Valor: "${campo.value}"`);
      console.log(`   Longitud: ${campo.length}`);

      // Validaciones específicas
      if (campo.id === '00') {
        if (campo.value === '01') {
          console.log(`   ✅ Correcto (01 = QR Code)`);
        } else {
          console.error(`   ❌ INCORRECTO (debe ser "01")`);
        }
      }

      if (campo.id === '01') {
        if (campo.value === '12') {
          console.log(`   ✅ Correcto (12 = Static QR)`);
        } else if (campo.value === '11') {
          console.error(`   ❌ INCORRECTO (11 = Dynamic QR, debe ser 12)`);
        } else {
          console.warn(`   ⚠️ Valor inesperado: "${campo.value}"`);
        }
      }

      if (campo.id === '52') {
        if (campo.length === 0) {
          console.error(`   ❌ Campo vacío (longitud 0) - esto causa que el QR no sea escaneable`);
          console.error(`   ⚠️ El backend debe usar padLength(mcc, 2) no padLength(mcc, 4)`);
        } else if (campo.value === '5492') {
          console.log(`   ✅ Correcto (5492 = Retail)`);
        } else if (campo.value === '0000') {
          console.warn(`   ⚠️ Sin categoría (0000) - debería ser 5492 para Retail`);
        } else if (campo.value.length === 4) {
          console.log(`   ℹ️  Código: ${campo.value} (verificar si es válido)`);
        } else {
          console.warn(`   ⚠️ Longitud inesperada: ${campo.value.length} caracteres (esperado: 4)`);
        }
      }

      if (campo.id === '53') {
        if (campo.value === '032') {
          console.log(`   ✅ Correcto (032 = ARS)`);
        } else {
          console.error(`   ❌ INCORRECTO (debe ser "032" para ARS)`);
        }
      }

      if (campo.id === '54') {
        const amountCents = parseInt(campo.value, 10);
        const amount = amountCents / 100;
        console.log(`   💰 Monto: ${amount.toFixed(2)} (${amountCents} centavos)`);
        if (campo.value.length > 13) {
          console.error(`   ❌ EXCEDE 13 DÍGITOS (${campo.value.length})`);
        } else {
          console.log(`   ✅ Longitud válida (${campo.value.length} dígitos)`);
        }
      }

      if (campo.id === '58') {
        if (campo.value === 'AR') {
          console.log(`   ✅ Correcto (AR = Argentina)`);
        } else {
          console.error(`   ❌ INCORRECTO (debe ser "AR")`);
        }
      }

      if (campo.id === '26') {
        console.log(`   ℹ️  Merchant Account Information (${campo.value.length} caracteres)`);
        if (campo.value.length > 99) {
          console.error(`   ❌ EXCEDE 99 CARACTERES (${campo.value.length})`);
        } else {
          console.log(`   ✅ Longitud válida`);
        }
        
        // Decodificar subcampos
        let subIndex = 0;
        while (subIndex < campo.value.length) {
          if (subIndex + 4 > campo.value.length) break;
          const subId = campo.value.substring(subIndex, subIndex + 2);
          subIndex += 2;
          const subLength = parseInt(campo.value.substring(subIndex, subIndex + 2), 10);
          subIndex += 2;
          if (subIndex + subLength > campo.value.length) break;
          const subValue = campo.value.substring(subIndex, subIndex + subLength);
          subIndex += subLength;
          
          if (subId === '00') {
            console.log(`      GUID: ${subValue}`);
          } else if (subId === '01') {
            console.log(`      Merchant ID: ${subValue}`);
            const digitsOnly = subValue.replace(/\D/g, '');
            if (digitsOnly.length === 22) {
              console.log(`         ✅ CBU/CVU válido (22 dígitos)`);
            } else {
              console.warn(`         ⚠️ CBU/CVU debe tener 22 dígitos (encontrados: ${digitsOnly.length})`);
            }
          } else if (subId === '02') {
            console.log(`      Terminal ID: ${subValue}`);
          }
        }
      }

      if (campo.id === '62') {
        console.log(`   ℹ️  Additional Data Field Template`);
        let subIndex = 0;
        while (subIndex < campo.value.length) {
          if (subIndex + 4 > campo.value.length) break;
          const subId = campo.value.substring(subIndex, subIndex + 2);
          subIndex += 2;
          const subLength = parseInt(campo.value.substring(subIndex, subIndex + 2), 10);
          subIndex += 2;
          if (subIndex + subLength > campo.value.length) break;
          const subValue = campo.value.substring(subIndex, subIndex + subLength);
          subIndex += subLength;
          
          if (subId === '05') {
            console.log(`      ✅ Referencia: ${subValue}`);
            if (subValue.length > 25) {
              console.warn(`         ⚠️ Referencia excede 25 caracteres (${subValue.length})`);
            }
          }
        }
      }

      if (campo.id === '63') {
        console.log(`   🔐 CRC: ${campo.value}`);
        if (campo.value.length === 4 && /^[A-F0-9]{4}$/.test(campo.value)) {
          console.log(`   ✅ Formato CRC válido`);
        } else {
          console.error(`   ❌ Formato CRC inválido`);
        }
      }

      console.log('');
    }

    // Verificar campos requeridos
    console.log('═'.repeat(60));
    console.log('✅ VERIFICACIÓN DE CAMPOS REQUERIDOS:\n');

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

    // Verificar imagen QR
    console.log('\n═'.repeat(60));
    console.log('🖼️ VERIFICACIÓN DE IMAGEN QR:\n');

    if (qrCode) {
      const isBase64 = qrCode.startsWith('data:image');
      console.log(`Tipo: ${isBase64 ? 'Base64 Data URL' : 'URL Externa'}`);

      if (isBase64) {
        try {
          const base64Data = qrCode.split(',')[1];
          const binaryString = atob(base64Data);
          const sizeKB = Math.round(binaryString.length / 1024);
          console.log(`Tamaño: ~${sizeKB} KB`);
          
          // Crear imagen para verificar dimensiones
          const img = new Image();
          img.onload = () => {
            console.log(`Dimensiones: ${img.width}x${img.height}px`);
            if (img.width < 200 || img.height < 200) {
              console.error(`❌ QR muy pequeño (mínimo recomendado: 200x200px)`);
            } else if (img.width >= 320 && img.height >= 320) {
              console.log(`✅ Tamaño óptimo para escaneo`);
            } else {
              console.log(`ℹ️  Tamaño aceptable`);
            }
          };
          img.src = qrCode;
        } catch (e) {
          console.error(`❌ Error al procesar base64: ${e.message}`);
        }
      }
    }

    // Diagnóstico final
    console.log('\n═'.repeat(60));
    console.log('📊 DIAGNÓSTICO FINAL:\n');

    if (problemas.length === 0) {
      console.log('✅ El payload EMV parece estar correcto.');
      console.log('\n💡 Si el QR aún no es escaneable, puede ser:');
      console.log('   1. Problema con la calidad/resolución de la imagen QR');
      console.log('   2. El CRC puede estar incorrecto (requiere validación específica)');
      console.log('   3. Formato del Merchant Account Information no compatible');
      console.log('   4. La billetera requiere configuración adicional');
      console.log('\n🔍 Próximos pasos:');
      console.log('   - Verificar que la imagen QR tenga buena calidad');
      console.log('   - Probar escaneando desde diferentes ángulos');
      console.log('   - Verificar que el QR no esté distorsionado');
      console.log('   - Contactar soporte de la billetera con el payload EMV');
    } else {
      console.log(`❌ Se encontraron ${problemas.length} problema(s) en el payload.`);
      console.log('   Estos deben corregirse en el backend.');
    }

    // Mostrar payload completo para debugging
    console.log('\n═'.repeat(60));
    console.log('📋 PAYLOAD COMPLETO PARA DEBUGGING:\n');
    console.log(payload);
    console.log('\n');

    return { payment, payload, campos };

  } catch (error) {
    console.error('\n❌ Error durante el diagnóstico:');
    console.error(error);
  }
}

// Ejecutar automáticamente
diagnosticoCompletoQR();

// Función global para usar desde consola
window.diagnosticoCompletoQR = diagnosticoCompletoQR;

