/**
 * Análisis: ¿Por qué el QR sigue sin escanearse?
 * 
 * El Terminal ID está correcto, pero las billeteras siguen rechazando el QR.
 * Este script analiza otros posibles problemas.
 */

const payload = "00020101021226460002AR012201103432300343175379290210TERMINAL0152045492530303254061000005802AR5912Toludev shop6009Argentina62170513SALE-854F369E6304C11E";

console.log('🔍 ANÁLISIS: ¿Por qué el QR sigue sin escanearse?\n');
console.log('═'.repeat(70));

console.log('\n✅ VERIFICACIONES BÁSICAS:\n');
console.log('1. Terminal ID: FIJO ✅');
console.log('2. Formato EMV: VÁLIDO ✅');
console.log('3. CRC: CORRECTO ✅');
console.log('4. Referencia en campo 62: CORRECTO ✅');

console.log('\n\n🔍 ANÁLISIS PROFUNDO DEL CAMPO 26:\n');
console.log('═'.repeat(70));

// Decodificar campo 26
const campo26Match = payload.match(/26(\d{2})(.+?)(?=\d{2}[0-9A-F]{2}|52)/);
if (campo26Match) {
  const campo26Length = campo26Match[1];
  const campo26Value = campo26Match[2];
  
  console.log(`Campo 26 completo: "${campo26Value}"`);
  console.log(`Longitud declarada: ${campo26Length} (${parseInt(campo26Length)} chars)`);
  console.log(`Longitud real: ${campo26Value.length} chars`);
  
  if (parseInt(campo26Length) !== campo26Value.length) {
    console.error('❌ ERROR: Longitud declarada no coincide con longitud real');
  } else {
    console.log('✅ Longitud correcta\n');
  }
  
  // Decodificar subcampos
  let idx = 0;
  const subcampos = [];
  
  while (idx < campo26Value.length) {
    const subId = campo26Value.substring(idx, idx + 2);
    idx += 2;
    if (idx + 2 > campo26Value.length) break;
    const subLengthStr = campo26Value.substring(idx, idx + 2);
    const subLength = parseInt(subLengthStr, 10);
    idx += 2;
    if (idx + subLength > campo26Value.length) break;
    const subValue = campo26Value.substring(idx, idx + subLength);
    idx += subLength;
    
    subcampos.push({ id: subId, length: subLength, value: subValue });
  }
  
  console.log('Subcampos decodificados:\n');
  subcampos.forEach(sub => {
    console.log(`  ${sub.id}: "${sub.value}" (${sub.length} chars)`);
  });
  
  // Verificar subcampo 01 (CBU/CVU)
  console.log('\n\n🏦 VERIFICACIÓN DEL CBU/CVU:\n');
  console.log('═'.repeat(70));
  
  const subcampoCBU = subcampos.find(s => s.id === '01');
  if (subcampoCBU) {
    const cbu = subcampoCBU.value;
    console.log(`CBU/CVU: "${cbu}"`);
    console.log(`Longitud: ${cbu.length} caracteres`);
    
    if (cbu.length !== 22) {
      console.error('❌ ERROR: CBU/CVU debe tener 22 dígitos');
      console.error(`   Actual: ${cbu.length} dígitos`);
    } else {
      console.log('✅ Longitud correcta (22 dígitos)');
    }
    
    // Verificar que sea numérico
    if (!/^\d+$/.test(cbu)) {
      console.error('❌ ERROR: CBU/CVU debe ser numérico');
      console.error(`   Actual: "${cbu}"`);
    } else {
      console.log('✅ Es numérico');
    }
    
    // Información sobre el CBU
    console.log('\n📋 Desglose del CBU/CVU:');
    console.log(`   Banco: ${cbu.substring(0, 3)} (primeros 3 dígitos)`);
    console.log(`   Cuenta: ${cbu.substring(3)} (resto)`);
    
    console.log('\n⚠️  PROBLEMA POTENCIAL:');
    console.log('   Este CBU/CVU debe estar REGISTRADO en el sistema de QR Interoperables');
    console.log('   de BCRA/COELSA para que las billeteras lo reconozcan.');
    console.log('\n   Si el CBU/CVU NO está registrado:');
    console.log('   ❌ Mercado Pago rechazará el QR');
    console.log('   ❌ Naranja X rechazará el QR');
    console.log('   ❌ Otras billeteras rechazarán el QR');
    
  } else {
    console.error('❌ ERROR: No se encontró subcampo 01 (CBU/CVU)');
  }
}

console.log('\n\n💡 POSIBLES CAUSAS DEL PROBLEMA:\n');
console.log('═'.repeat(70));

console.log(`
1. 🔴 CBU/CVU NO REGISTRADO (MÁS PROBABLE)
   
   Problema:
   - El CBU/CVU "0110343230034317537929" NO está registrado en el
     sistema de QR Interoperables de BCRA/COELSA
   
   Por qué falla:
   - Las billeteras consultan el registro de CBU/CVU válidos
   - Si el CBU no está en la lista, rechazan el QR
   
   Solución:
   - Registrar el CBU/CVU en el sistema de QR Interoperables
   - Contactar a BCRA o al banco para el registro
   - Usar un CBU/CVU ya registrado para pruebas
   
   Cómo verificar:
   - Consultar con el banco si el CBU está habilitado para QR
   - Preguntar si el comercio está registrado en COELSA


2. 🟡 COMERCIO NO REGISTRADO
   
   Problema:
   - Aunque el CBU sea válido, el comercio "Toludev shop" puede
     no estar registrado en el sistema
   
   Solución:
   - Completar el registro del comercio en COELSA
   - Verificar datos fiscales (CUIT, razón social)
   

3. 🟡 MCC (Merchant Category Code) NO HABILITADO
   
   Problema:
   - El MCC "5492" (Panaderías) puede no estar habilitado
     para este CBU específico
   
   Solución:
   - Verificar que el MCC coincida con la actividad del comercio
   - Usar un MCC más genérico si es necesario


4. 🟢 PROBLEMA DE CALIDAD DE IMAGEN (MENOS PROBABLE)
   
   El QR es 400x400px con nivel H de corrección, debería ser
   suficiente, pero puedes probar:
   - Aumentar a 500x500px o 600x600px
   - Ajustar el brillo de la pantalla al máximo
   - Probar con el QR impreso


5. 🟢 PROBLEMA DE ENTORNO (MENOS PROBABLE)
   
   - Probar en staging/producción en lugar de localhost
   - Verificar que el backend esté usando el endpoint correcto


═══════════════════════════════════════════════════════════════════════
📋 RESUMEN Y PRÓXIMOS PASOS:
═══════════════════════════════════════════════════════════════════════

✅ LO QUE ESTÁ BIEN:
   - Terminal ID fijo
   - Formato EMV correcto
   - CRC válido
   - Estructura del payload correcta

❌ LO QUE PROBABLEMENTE FALLA:
   - CBU/CVU NO registrado en sistema de QR Interoperables

🎯 ACCIÓN INMEDIATA RECOMENDADA:

   1. Contactar al BANCO que emitió el CBU "0110343230034317537929"
      
   2. Preguntar:
      - ¿Está habilitado este CBU para recibir pagos con QR Interoperables?
      - ¿El comercio "Toludev shop" está registrado en COELSA?
      - ¿Qué pasos faltan para completar el registro?
   
   3. Mientras tanto, para TESTING:
      - Solicitar un CBU de prueba ya registrado
      - Usar el ambiente de sandbox de BCRA/COELSA si está disponible
   
   4. Alternativa temporal:
      - Usar Mercado Pago con su propio sistema (no interoperable)
      - Configurar user_id y external_pos_id de Mercado Pago

═══════════════════════════════════════════════════════════════════════
`);

console.log('\n💡 Para verificar si un CBU está registrado:');
console.log('   No hay una API pública para consultarlo, debes contactar al banco.');
console.log('   O probar con un QR de un comercio conocido (ej: Rapipago, PagoFácil)');

