/**
 * Script para analizar el payload EMV del QR
 * 
 * Decodifica y analiza el payload EMV para verificar que cumple
 * con el estándar requerido por las billeteras argentinas
 */

function analizarPayloadEMV(payload) {
  console.log('🔍 Analizando payload EMV...\n');
  console.log(`Payload completo: ${payload}\n`);
  console.log('═'.repeat(60));

  if (!payload.startsWith('000201')) {
    console.error('❌ El payload NO empieza con "000201"');
    console.error('   Debe seguir el formato EMV estándar');
    return;
  }

  let index = 0;
  const campos = {};

  // Función para leer un campo EMV
  function leerCampo() {
    if (index >= payload.length) return null;
    
    const id = payload.substring(index, index + 2);
    index += 2;
    
    if (index + 2 > payload.length) return null;
    
    const lengthStr = payload.substring(index, index + 2);
    const length = parseInt(lengthStr, 10);
    
    // Validar que length sea un número válido
    if (isNaN(length) || length < 0) {
      console.warn(`      ⚠️ Longitud inválida en campo ${id}: "${lengthStr}"`);
      return null;
    }
    
    index += 2;
    
    // Si length es 0, el campo existe pero está vacío
    if (length === 0) {
      return { id, length: 0, value: '' };
    }
    
    if (index + length > payload.length) {
      console.warn(`      ⚠️ Campo ${id} excede el tamaño del payload`);
      return null;
    }
    
    const value = payload.substring(index, index + length);
    index += length;
    
    return { id, length, value };
  }

  // Decodificar payload
  console.log('📋 Campos EMV decodificados:\n');

  while (index < payload.length) {
    const campo = leerCampo();
    if (!campo) break;

    const id = campo.id;
    const value = campo.value;

    // Mapear IDs conocidos
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

    const nombre = nombres[id] || `Campo ${id}`;
    
    // Evitar sobrescribir campos ya procesados (excepto si es el mismo campo)
    if (campos[id] && campos[id].valor !== value) {
      console.warn(`      ⚠️ Campo ${id} ya existe con valor diferente. Posible error de decodificación.`);
    }
    
    campos[id] = { nombre, valor: value, longitud: campo.length };

    console.log(`   ${id} - ${nombre}:`);
    if (campo.length === 0) {
      console.log(`      Valor: (vacío)`);
      console.log(`      Longitud: 0`);
      console.log(`      ⚠️ Campo vacío`);
    } else {
      console.log(`      Valor: ${value}`);
      console.log(`      Longitud: ${campo.length}`);
    }
    
    // Análisis específico por campo
    if (id === '00') {
      if (value === '01') {
        console.log(`      ✅ Formato correcto (01 = QR Code)`);
      } else {
        console.error(`      ❌ Formato incorrecto (debe ser "01")`);
      }
    }
    
    if (id === '01') {
      if (value === '11') {
        console.log(`      ⚠️ Dynamic QR (11)`);
        console.log(`      💡 Para QR estático, debería ser "12"`);
      } else if (value === '12') {
        console.log(`      ✅ Static QR (12) - Correcto`);
      } else {
        console.warn(`      ⚠️ Valor inesperado: "${value}"`);
      }
    }
    
    if (id === '53') {
      if (value === '032') {
        console.log(`      ✅ Moneda correcta (032 = ARS)`);
      } else {
        console.error(`      ❌ Moneda incorrecta (debe ser "032" para ARS)`);
      }
    }
    
    if (id === '58') {
      if (value === 'AR') {
        console.log(`      ✅ País correcto (AR = Argentina)`);
      } else {
        console.error(`      ❌ País incorrecto (debe ser "AR")`);
      }
    }
    
    if (id === '54') {
      // El monto viene sin decimales en formato EMV
      const amountCents = parseInt(value, 10);
      const amount = amountCents / 100;
      console.log(`      💰 Monto: ${amount.toFixed(2)} (${amountCents} centavos)`);
      
      // Validar longitud
      if (value.length > 13) {
        console.error(`      ❌ Monto excede 13 dígitos (${value.length})`);
      } else {
        console.log(`      ✅ Formato correcto (sin decimales, ${value.length} dígitos)`);
      }
    }
    
    if (id === '26') {
      console.log(`      ℹ️  Información de cuenta del comercio`);
      
      // Validar longitud del campo 26
      if (value.length > 99) {
        console.error(`      ❌ Campo 26 excede 99 caracteres (${value.length})`);
      } else {
        console.log(`      ✅ Longitud válida (${value.length} caracteres)`);
      }
      
      // Decodificar subcampos del Merchant Account Information
      let subIndex = 0;
      const subcampos = {};
      while (subIndex < value.length) {
        if (subIndex + 4 > value.length) break;
        const subId = value.substring(subIndex, subIndex + 2);
        subIndex += 2;
        const subLength = parseInt(value.substring(subIndex, subIndex + 2), 10);
        subIndex += 2;
        if (subIndex + subLength > value.length) break;
        const subValue = value.substring(subIndex, subIndex + subLength);
        subIndex += subLength;
        
        if (subId === '00') {
          console.log(`         GUID: ${subValue}`);
        } else if (subId === '01') {
          console.log(`         Merchant ID: ${subValue}`);
          // Validar CBU/CVU (22 dígitos)
          const digitsOnly = subValue.replace(/\D/g, '');
          if (digitsOnly.length === 22) {
            console.log(`            ✅ CBU/CVU válido (22 dígitos)`);
          } else {
            console.warn(`            ⚠️ CBU/CVU debe tener 22 dígitos (encontrados: ${digitsOnly.length})`);
          }
        } else if (subId === '02') {
          console.log(`         Terminal ID: ${subValue}`);
        }
      }
    }
    
    if (id === '62') {
      console.log(`      ℹ️  Datos adicionales (puede contener referencia)`);
      // Intentar decodificar subcampos
      let subIndex = 0;
      let encontrado = false;
      while (subIndex < value.length) {
        if (subIndex + 4 > value.length) break;
        const subId = value.substring(subIndex, subIndex + 2);
        subIndex += 2;
        const subLength = parseInt(value.substring(subIndex, subIndex + 2), 10);
        subIndex += 2;
        if (subIndex + subLength > value.length) break;
        const subValue = value.substring(subIndex, subIndex + subLength);
        subIndex += subLength;
        
        if (subId === '05') {
          console.log(`         ✅ Referencia encontrada: ${subValue}`);
          // Validar longitud de referencia
          if (subValue.length > 25) {
            console.warn(`            ⚠️ Referencia excede 25 caracteres (${subValue.length})`);
            console.warn(`            Debería estar truncada automáticamente`);
          } else {
            console.log(`            ✅ Longitud válida (${subValue.length} caracteres)`);
          }
          encontrado = true;
        }
      }
      if (!encontrado) {
        console.log(`         ⚠️ No se encontró referencia (campo 05) en datos adicionales`);
      }
    }
    
    if (id === '63') {
      console.log(`      🔐 CRC: ${value}`);
    }
    
    console.log('');
  }

  // Verificación de campos requeridos
  console.log('═'.repeat(60));
  console.log('✅ Verificación de campos requeridos:\n');

  const requeridos = {
    '00': 'Payload Format Indicator',
    '52': 'Merchant Category Code',
    '53': 'Transaction Currency',
    '54': 'Transaction Amount',
    '58': 'Country Code',
    '59': 'Merchant Name',
    '60': 'Merchant City',
    '63': 'CRC'
  };

  const problemas = [];
  const correctos = [];

  for (const [id, nombre] of Object.entries(requeridos)) {
    if (campos[id]) {
      correctos.push(`${id} - ${nombre}: ✅`);
    } else {
      problemas.push(`${id} - ${nombre}: ❌ FALTA`);
    }
  }

  if (correctos.length > 0) {
    console.log('✅ Campos presentes:');
    correctos.forEach(c => console.log(`   ${c}`));
  }

  if (problemas.length > 0) {
    console.log('\n❌ Campos faltantes:');
    problemas.forEach(p => console.log(`   ${p}`));
  }

  // Verificación específica para Argentina
  console.log('\n🇦🇷 Verificación específica para Argentina:\n');

  if (campos['58'] && campos['58'].valor === 'AR') {
    console.log('   ✅ País: Argentina');
  } else {
    console.error('   ❌ País debe ser "AR"');
  }

  if (campos['53'] && campos['53'].valor === '032') {
    console.log('   ✅ Moneda: ARS (032)');
  } else {
    console.error('   ❌ Moneda debe ser "032" (ARS)');
  }

  if (campos['26']) {
    console.log('   ✅ Merchant Account Information presente');
  } else {
    console.warn('   ⚠️  Merchant Account Information puede ser requerido');
  }

  // Verificar CRC
  if (campos['63']) {
    console.log(`   ✅ CRC presente: ${campos['63'].valor}`);
    console.log('   ⚠️  Nota: La validación del CRC requiere cálculo específico');
  } else {
    console.error('   ❌ CRC faltante');
  }

  // Resumen final
  console.log('\n═'.repeat(60));
  console.log('📊 RESUMEN:\n');

  if (problemas.length === 0) {
    console.log('✅ Todos los campos requeridos están presentes');
  } else {
    console.log(`❌ Faltan ${problemas.length} campo(s) requerido(s)`);
  }

  console.log('\n💡 Si el QR aún no es escaneable:');
  console.log('   1. Verificar que el CRC sea correcto');
  console.log('   2. Verificar que Merchant Account Information sea válido');
  console.log('   3. Verificar que el formato cumpla con estándares de Argentina');
  console.log('   4. Probar con diferentes billeteras (Mercado Pago, Naranja X, Ualá)');

  return campos;
}

// Ejemplo de uso con el payload del log
const payloadEjemplo = "00020101021126920002AR0100000000000000000000220110343230034317537929020000000000000000000000013SALE-EE06E5F052000400005300303254061000005802AR5912Toludev shop6009Argentina6240050000000000000000000000013SALE-EE06E5F0630004B509";

console.log('🧪 Analizando payload del ejemplo:\n');
analizarPayloadEMV(payloadEjemplo);

// Función para usar desde consola con cualquier payload
window.analizarPayloadEMV = function(payload) {
  return analizarPayloadEMV(payload);
};

console.log('\n💡 Para analizar otro payload, usa:');
console.log('   analizarPayloadEMV("tu-payload-aqui")');

