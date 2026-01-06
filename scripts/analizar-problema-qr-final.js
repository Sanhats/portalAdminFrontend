/**
 * Análisis Final del Problema del QR
 * 
 * Este script analiza en detalle por qué las billeteras no pueden escanear el QR
 */

const payload = "00020101021226490002AR012201103432300343175379290213SALE-EC08FEBC520454925303032540715000005802AR5912Toludev shop6009Argentina62170513SALE-EC08FEBC63041098";

console.log('🔍 ANÁLISIS FINAL DEL PROBLEMA DEL QR\n');
console.log('═'.repeat(70));

// Decodificar todos los campos
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
  
  if (length === 0) {
    return { id, length: 0, value: '' };
  }
  
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

console.log('\n📋 TODOS LOS CAMPOS:\n');
Object.keys(campos).forEach(id => {
  const campo = campos[id];
  console.log(`Campo ${id}: "${campo.value}" (longitud: ${campo.length})`);
});

// Análisis profundo del campo 26
console.log('\n\n🔍 ANÁLISIS DETALLADO DEL CAMPO 26 (CRÍTICO):\n');
console.log('═'.repeat(70));

if (campos['26']) {
  const mai = campos['26'].value;
  console.log(`Valor completo: "${mai}"`);
  console.log(`Longitud: ${mai.length} caracteres\n`);
  
  // Decodificar estructura interna del campo 26
  console.log('Estructura interna:\n');
  
  let idx = 0;
  let subcampoNum = 0;
  
  while (idx < mai.length) {
    subcampoNum++;
    
    // Leer ID del subcampo (2 dígitos)
    if (idx + 2 > mai.length) break;
    const subId = mai.substring(idx, idx + 2);
    idx += 2;
    
    // Leer longitud del subcampo (2 dígitos)
    if (idx + 2 > mai.length) break;
    const subLengthStr = mai.substring(idx, idx + 2);
    const subLength = parseInt(subLengthStr, 10);
    idx += 2;
    
    // Leer valor del subcampo
    if (idx + subLength > mai.length) break;
    const subValue = mai.substring(idx, idx + subLength);
    idx += subLength;
    
    console.log(`  Subcampo ${subId}:`);
    console.log(`    Longitud: ${subLength}`);
    console.log(`    Valor: "${subValue}"`);
    
    // Analizar subcampo específico
    if (subId === '00') {
      console.log(`    ℹ️  Tipo: País/Dominio`);
      if (subValue === 'AR') {
        console.log(`    ✅ Argentina`);
      }
    } else if (subId === '01') {
      console.log(`    ℹ️  Tipo: CBU/CVU/GUID del comercio`);
      if (subValue.length === 22) {
        console.log(`    ⚠️  Longitud 22 - Parece un CBU/CVU`);
        console.log(`    ⚠️  ¿Es un CBU/CVU válido?`);
      } else {
        console.log(`    ❌ Longitud incorrecta para CBU/CVU (debe ser 22)`);
      }
    } else if (subId === '02') {
      console.log(`    ℹ️  Tipo: Terminal ID`);
      console.log(`    ⚠️  Contiene "SALE-" (referencia de pago)`);
      console.log(`    ❌ PROBLEMA: Terminal ID no debería contener la referencia`);
    }
    console.log('');
  }
}

// Identificar problemas
console.log('\n\n🚨 PROBLEMAS IDENTIFICADOS:\n');
console.log('═'.repeat(70));

const problemas = [];

if (campos['26']) {
  const mai = campos['26'].value;
  
  // Verificar estructura
  if (mai.includes('SALE-')) {
    problemas.push({
      severidad: '🔴 CRÍTICO',
      campo: '26 (Merchant Account Information)',
      problema: 'Terminal ID contiene la referencia de pago "SALE-"',
      impacto: 'Las billeteras esperan un Terminal ID fijo, no una referencia variable',
      solucion: 'El Terminal ID debe ser un identificador fijo del punto de venta'
    });
  }
  
  // Verificar CBU/CVU
  const subcampo01Match = mai.match(/01(\d{2})(.+?)(?=\d{2}|$)/);
  if (subcampo01Match) {
    const cbu = subcampo01Match[2].substring(0, parseInt(subcampo01Match[1]));
    if (cbu.length !== 22) {
      problemas.push({
        severidad: '⚠️  ADVERTENCIA',
        campo: '26 subcampo 01 (CBU/CVU)',
        problema: `Longitud incorrecta: ${cbu.length} (debe ser 22)`,
        impacto: 'Algunas billeteras pueden rechazar el QR',
        solucion: 'Usar un CBU o CVU válido de 22 dígitos'
      });
    }
  }
}

if (problemas.length > 0) {
  problemas.forEach((p, i) => {
    console.log(`\n${i + 1}. ${p.severidad} - ${p.campo}`);
    console.log(`   Problema: ${p.problema}`);
    console.log(`   Impacto: ${p.impacto}`);
    console.log(`   Solución: ${p.solucion}`);
  });
} else {
  console.log('✅ No se encontraron problemas evidentes');
}

console.log('\n\n💡 SOLUCIÓN RECOMENDADA:\n');
console.log('═'.repeat(70));

console.log(`
🔧 CORRECCIÓN DEL BACKEND (URGENTE)

El campo 26 (Merchant Account Information) debe tener esta estructura:

00 02 AR                           → País: Argentina
01 22 [CBU o CVU de 22 dígitos]  → CBU/CVU del comercio
02 [LEN] [Terminal ID fijo]      → ID fijo del terminal/POS

❌ INCORRECTO (actual):
   02 13 SALE-EC08FEBC  → Usa la referencia de pago (variable)

✅ CORRECTO (debe ser):
   02 08 TERMINAL01     → ID fijo del terminal
   o
   02 04 POS1          → Otro ID fijo

La referencia "SALE-EC08FEBC" debe ir SOLO en el campo 62 (Additional Data),
NO en el campo 26.

📝 Cambios necesarios en el backend:

1. Definir un Terminal ID fijo para el comercio (ej: "TERMINAL01", "POS1")
2. Usar ese Terminal ID en el campo 26, subcampo 02
3. Mantener la referencia variable SOLO en el campo 62

Ejemplo de payload correcto:
00020101021226430002AR012201103432300343175379290208TERMINAL01520454925303...

Campo 26: 0002AR01220110343230034317537929 02 08 TERMINAL01
                                            ↑  ↑  ↑
                                            │  │  └─ Terminal ID fijo
                                            │  └──── Longitud: 8
                                            └─────── Subcampo 02
`);

console.log('\n\n📋 RESUMEN:\n');
console.log('═'.repeat(70));
console.log(`
🔴 Problema principal: Terminal ID variable (contiene referencia de pago)
⚠️  Impacto: Las billeteras rechazan el QR
✅ Solución: Usar un Terminal ID fijo en el backend
⏱️  Tiempo estimado de fix: 10-15 minutos
🎯 Prioridad: MÁXIMA (bloquea todo el flujo de pago QR)
`);

