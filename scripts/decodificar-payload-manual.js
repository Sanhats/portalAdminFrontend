/**
 * Script para decodificar manualmente el payload EMV
 * y verificar exactamente qué está pasando
 */

function decodificarPayloadManual(payload) {
  console.log('🔍 DECODIFICACIÓN MANUAL DEL PAYLOAD EMV\n');
  console.log('═'.repeat(60));
  console.log(`Payload: ${payload}`);
  console.log(`Longitud: ${payload.length} caracteres\n`);
  console.log('═'.repeat(60));
  
  let index = 0;
  let campoNum = 1;
  
  while (index < payload.length) {
    console.log(`\n📍 Campo ${campoNum} - Posición ${index}:`);
    
    // Leer ID
    if (index + 2 > payload.length) {
      console.log(`   ⚠️ No hay suficientes caracteres para ID`);
      break;
    }
    const id = payload.substring(index, index + 2);
    console.log(`   ID: ${id}`);
    index += 2;
    
    // Leer longitud
    if (index + 2 > payload.length) {
      console.log(`   ⚠️ No hay suficientes caracteres para longitud`);
      break;
    }
    const lengthStr = payload.substring(index, index + 2);
    const length = parseInt(lengthStr, 10);
    console.log(`   Longitud (string): "${lengthStr}"`);
    console.log(`   Longitud (número): ${length}`);
    index += 2;
    
    // Leer valor
    if (length === 0) {
      console.log(`   Valor: "" (vacío)`);
      console.log(`   ⚠️ Campo con longitud 0 - esto puede causar problemas`);
    } else {
      if (index + length > payload.length) {
        console.log(`   ⚠️ Valor excede el payload disponible`);
        break;
      }
      const value = payload.substring(index, index + length);
      console.log(`   Valor: "${value}"`);
      index += length;
    }
    
    // Mapear nombres conocidos
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
    
    const nombre = nombres[id] || `Campo desconocido ${id}`;
    console.log(`   Nombre: ${nombre}`);
    
    // Validaciones específicas
    if (id === '52' && length === 0) {
      console.log(`   ❌ PROBLEMA CRÍTICO: Merchant Category Code tiene longitud 0`);
      console.log(`   El backend debe generar este campo con valor "5492"`);
    }
    
    campoNum++;
    
    if (campoNum > 20) {
      console.log(`\n⚠️ Demasiados campos, deteniendo para evitar loop infinito`);
      break;
    }
  }
  
  console.log(`\n═'.repeat(60)`);
  console.log(`✅ Decodificación completa. Índice final: ${index}/${payload.length}`);
  
  if (index < payload.length) {
    const restante = payload.substring(index);
    console.log(`⚠️ Payload restante (${restante.length} caracteres): "${restante}"`);
  }
}

// Ejecutar con el payload del ejemplo
const payloadEjemplo = "00020101021226490002AR012201103432300343175379290213SALE-EFE5A4EC520004549253003032540725000005802AR5912Toludev shop6009Argentina6240050000000000000000000000013SALE-EFE5A4EC630004F542";

console.log('🧪 Ejecutando con payload del ejemplo:\n');
decodificarPayloadManual(payloadEjemplo);

// Función global
window.decodificarPayloadManual = decodificarPayloadManual;

