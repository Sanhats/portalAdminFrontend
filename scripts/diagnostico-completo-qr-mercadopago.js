/**
 * DIAGNÓSTICO COMPLETO: Por qué Mercado Pago rechaza el QR
 * 
 * Analiza TODOS los posibles problemas del payload EMV y el QR
 */

async function diagnosticoCompletoQRMercadoPago() {
  const token = localStorage.getItem('access_token');
  const urlParts = window.location.pathname.split('/');
  const saleId = urlParts[urlParts.length - 1];
  
  const paymentsResponse = await fetch(`/api/proxy/sales/${saleId}/payments`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  
  const payments = await paymentsResponse.json();
  const qrPayments = (payments.payments || payments || []).filter(p => 
    p.status === 'pending' && p.gateway_metadata?.qr_payload
  );
  
  if (qrPayments.length === 0) {
    console.error('❌ No hay QR pendiente');
    return;
  }
  
  const payment = qrPayments[qrPayments.length - 1];
  const payloadOriginal = payment.gateway_metadata.qr_payload;
  const qrCodeOriginal = payment.gateway_metadata.qr_code;
  
  console.log('🔍 DIAGNÓSTICO COMPLETO: Por qué Mercado Pago rechaza el QR\n');
  console.log('═'.repeat(70));
  
  // 1. Verificar si el QR corregido está siendo usado
  console.log('\n1️⃣ VERIFICAR QR CORREGIDO EN FRONTEND\n');
  
  // Intentar obtener el QR corregido del componente
  const qrImages = document.querySelectorAll('img[alt*="QR"], img[src*="data:image"]');
  let qrCodeEnPantalla = null;
  
  if (qrImages.length > 0) {
    qrCodeEnPantalla = qrImages[qrImages.length - 1].src;
    console.log(`✅ QR encontrado en pantalla: ${qrCodeEnPantalla.substring(0, 100)}...`);
  } else {
    console.warn('⚠️ No se encontró QR en pantalla');
  }
  
  // 2. Analizar payload original del backend
  console.log('\n2️⃣ ANÁLISIS DEL PAYLOAD ORIGINAL (Backend)\n');
  analizarPayloadCompleto(payloadOriginal);
  
  // 3. Verificar corrección del CRC
  console.log('\n3️⃣ VERIFICAR CORRECCIÓN DEL CRC\n');
  const payloadCorregido = corregirCRC(payloadOriginal);
  
  if (payloadCorregido !== payloadOriginal) {
    console.log('✅ El frontend está corrigiendo el CRC');
    console.log(`   Payload original: ${payloadOriginal.substring(payloadOriginal.length - 10)}`);
    console.log(`   Payload corregido: ${payloadCorregido.substring(payloadCorregido.length - 10)}`);
    
    // Analizar payload corregido
    console.log('\n4️⃣ ANÁLISIS DEL PAYLOAD CORREGIDO (Frontend)\n');
    analizarPayloadCompleto(payloadCorregido);
    
    // Verificar si el QR regenerado contiene el payload corregido
    console.log('\n5️⃣ VERIFICAR QR REGENERADO\n');
    await verificarQRRegenerado(qrCodeEnPantalla, payloadCorregido);
  } else {
    console.log('⚠️ El CRC ya es correcto o no se está corrigiendo');
  }
  
  // 6. Problemas específicos de Mercado Pago
  console.log('\n6️⃣ PROBLEMAS ESPECÍFICOS DE MERCADO PAGO\n');
  verificarProblemasMercadoPago(payloadCorregido || payloadOriginal);
  
  // 7. Soluciones recomendadas
  console.log('\n7️⃣ SOLUCIONES RECOMENDADAS\n');
  mostrarSoluciones();
}

function analizarPayloadCompleto(payload) {
  if (!payload || !payload.startsWith('000201')) {
    console.error('❌ Payload inválido o no sigue formato EMV');
    return;
  }
  
  let index = 0;
  const campos = {};
  const problemas = [];
  
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
  
  // Validar campos críticos
  console.log('📋 Campos encontrados:\n');
  
  // Campo 00 - Payload Format Indicator
  if (campos['00']) {
    console.log(`✅ Campo 00 (Payload Format): "${campos['00'].value}"`);
    if (campos['00'].value !== '01') {
      problemas.push('Campo 00 debe ser "01"');
    }
  } else {
    problemas.push('Falta campo 00 (Payload Format Indicator)');
  }
  
  // Campo 01 - Point of Initiation Method
  if (campos['01']) {
    console.log(`✅ Campo 01 (Point of Initiation): "${campos['01'].value}"`);
    if (campos['01'].value !== '12') {
      problemas.push(`Campo 01 debe ser "12" (Static QR), actual: "${campos['01'].value}"`);
    }
  } else {
    problemas.push('Falta campo 01 (Point of Initiation Method)');
  }
  
  // Campo 26 - Merchant Account Information (CRÍTICO)
  if (campos['26']) {
    console.log(`✅ Campo 26 (Merchant Account Info): "${campos['26'].value.substring(0, 30)}..."`);
    const mai = campos['26'].value;
    
    // Verificar formato para Argentina
    if (!mai.startsWith('0002AR')) {
      problemas.push('Campo 26 debe empezar con "0002AR" (Argentina)');
    }
    
    // Verificar longitud máxima
    if (mai.length > 99) {
      problemas.push(`Campo 26 excede 99 caracteres (actual: ${mai.length})`);
    }
    
    // Verificar estructura interna
    if (mai.length < 20) {
      problemas.push('Campo 26 muy corto, estructura inválida');
    }
  } else {
    problemas.push('Falta campo 26 (Merchant Account Information) - CRÍTICO');
  }
  
  // Campo 52 - Merchant Category Code
  if (campos['52']) {
    console.log(`✅ Campo 52 (MCC): "${campos['52'].value}"`);
    if (campos['52'].value.length !== 4) {
      problemas.push(`Campo 52 debe tener 4 dígitos, actual: "${campos['52'].value}"`);
    }
    if (campos['52'].value === '0000') {
      problemas.push('Campo 52 no puede ser "0000" (inválido)');
    }
  } else {
    problemas.push('Falta campo 52 (Merchant Category Code)');
  }
  
  // Campo 53 - Currency
  if (campos['53']) {
    console.log(`✅ Campo 53 (Currency): "${campos['53'].value}"`);
    if (campos['53'].value !== '032') {
      problemas.push(`Campo 53 debe ser "032" (ARS), actual: "${campos['53'].value}"`);
    }
  } else {
    problemas.push('Falta campo 53 (Transaction Currency)');
  }
  
  // Campo 54 - Amount
  if (campos['54']) {
    console.log(`✅ Campo 54 (Amount): "${campos['54'].value}"`);
    const amount = campos['54'].value;
    
    // Verificar formato (sin decimales)
    if (amount.includes('.')) {
      problemas.push('Campo 54 no debe contener decimales');
    }
    
    // Verificar longitud máxima
    if (amount.length > 13) {
      problemas.push(`Campo 54 excede 13 dígitos (actual: ${amount.length})`);
    }
    
    // Verificar que sea numérico
    if (!/^\d+$/.test(amount)) {
      problemas.push(`Campo 54 debe ser numérico, actual: "${amount}"`);
    }
  } else {
    problemas.push('Falta campo 54 (Transaction Amount)');
  }
  
  // Campo 58 - Country Code
  if (campos['58']) {
    console.log(`✅ Campo 58 (Country): "${campos['58'].value}"`);
    if (campos['58'].value !== 'AR') {
      problemas.push(`Campo 58 debe ser "AR", actual: "${campos['58'].value}"`);
    }
  } else {
    problemas.push('Falta campo 58 (Country Code)');
  }
  
  // Campo 59 - Merchant Name
  if (campos['59']) {
    console.log(`✅ Campo 59 (Merchant Name): "${campos['59'].value}"`);
    if (campos['59'].value.length === 0) {
      problemas.push('Campo 59 no puede estar vacío');
    }
    if (campos['59'].value.length > 25) {
      problemas.push(`Campo 59 excede 25 caracteres (actual: ${campos['59'].value.length})`);
    }
  } else {
    problemas.push('Falta campo 59 (Merchant Name)');
  }
  
  // Campo 60 - Merchant City
  if (campos['60']) {
    console.log(`✅ Campo 60 (Merchant City): "${campos['60'].value}"`);
    if (campos['60'].value.length === 0) {
      problemas.push('Campo 60 no puede estar vacío');
    }
    if (campos['60'].value.length > 15) {
      problemas.push(`Campo 60 excede 15 caracteres (actual: ${campos['60'].value.length})`);
    }
  } else {
    problemas.push('Falta campo 60 (Merchant City)');
  }
  
  // Campo 62 - Additional Data
  if (campos['62']) {
    console.log(`✅ Campo 62 (Additional Data): "${campos['62'].value.substring(0, 30)}..."`);
    // Verificar que contenga la referencia
    if (!campos['62'].value.includes('SALE-')) {
      problemas.push('Campo 62 debería contener la referencia de pago');
    }
  }
  
  // Campo 63 - CRC
  if (campos['63']) {
    console.log(`✅ Campo 63 (CRC): "${campos['63'].value}"`);
    if (campos['63'].value.length !== 4) {
      problemas.push(`Campo 63 debe tener 4 dígitos hexadecimales, actual: "${campos['63'].value}"`);
    }
  } else {
    problemas.push('Falta campo 63 (CRC)');
  }
  
  // Mostrar problemas encontrados
  if (problemas.length > 0) {
    console.log('\n❌ PROBLEMAS ENCONTRADOS:\n');
    problemas.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p}`);
    });
  } else {
    console.log('\n✅ Todos los campos están correctos');
  }
  
  return { campos, problemas };
}

function corregirCRC(payload) {
  const crcMatch = payload.match(/63(\d{2})([A-F0-9]{4})$/);
  if (!crcMatch) return payload;
  
  const crcEnPayload = crcMatch[2];
  
  // Para calcular el CRC: remover los últimos 6 caracteres (04 + XXXX)
  const payloadSinCRC = payload.substring(0, payload.length - 6);
  
  function calcCRC(data) {
    let crc = 0xFFFF;
    const poly = 0x1021;
    for (let i = 0; i < data.length; i++) {
      crc ^= (data.charCodeAt(i) << 8);
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ poly) : (crc << 1);
        crc &= 0xFFFF;
      }
    }
    return crc;
  }
  
  const dataParaCRC = payloadSinCRC + "6304";
  const crcCalculado = calcCRC(dataParaCRC).toString(16).toUpperCase().padStart(4, '0');
  
  if (crcEnPayload === crcCalculado) {
    return payload;
  }
  
  // Para reconstruir el payload: remover el campo 63 completo (8 caracteres)
  const payloadSinCampo63Completo = payload.substring(0, payload.length - 8);
  
  // Agregar campo CRC completo con CRC correcto
  return payloadSinCampo63Completo + `6304${crcCalculado}`;
}

async function verificarQRRegenerado(qrCodeBase64, payloadEsperado) {
  if (!qrCodeBase64 || !qrCodeBase64.startsWith('data:image')) {
    console.warn('⚠️ No se puede verificar QR regenerado (no es base64)');
    return;
  }
  
  try {
    // Intentar decodificar el QR usando una librería QR
    const QRCode = await import('qrcode');
    
    // Extraer la imagen del QR
    const img = new Image();
    img.src = qrCodeBase64;
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    // Crear canvas para leer el QR
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    // Intentar leer el QR (requiere librería adicional)
    console.log('✅ QR regenerado encontrado');
    console.log(`   Dimensiones: ${img.width}x${img.height}px`);
    console.log(`   Payload esperado: ${payloadEsperado.substring(0, 50)}...`);
    console.log('   ⚠️ Para verificar el contenido del QR, se necesita una librería de lectura QR');
    
  } catch (error) {
    console.warn('⚠️ No se pudo verificar el QR regenerado:', error.message);
  }
}

function verificarProblemasMercadoPago(payload) {
  const problemasMP = [];
  
  // Mercado Pago es muy estricto con el formato
  console.log('🔍 Verificaciones específicas de Mercado Pago:\n');
  
  // Decodificar campos EMV correctamente
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
  
  // 1. Verificar que el Merchant Account Information tenga formato correcto
  if (campos['26']) {
    const mai = campos['26'].value;
    console.log(`   Merchant Account Info: ${mai.substring(0, 40)}...`);
    
    // Mercado Pago requiere formato específico para Argentina
    if (!mai.startsWith('0002AR')) {
      problemasMP.push('Merchant Account Info debe empezar con "0002AR"');
    } else {
      console.log(`   ✅ Formato correcto: empieza con "0002AR"`);
    }
    
    // Verificar estructura interna: debe tener GUID (01) y Terminal ID (02)
    // El formato es: 0002AR01[LEN_GUID][GUID]02[LEN_TERMINAL][TERMINAL_ID]
    if (mai.length >= 6 && mai.startsWith('0002AR')) {
      const rest = mai.substring(6); // Después de "0002AR"
      if (rest.includes('01') && rest.includes('02')) {
        console.log(`   ✅ Contiene GUID (01) y Terminal ID (02)`);
      } else {
        problemasMP.push('Merchant Account Info debe contener GUID (01) y Terminal ID (02)');
      }
    }
  } else {
    problemasMP.push('Falta campo 26 (Merchant Account Information)');
  }
  
  // 2. Verificar que el monto sea válido
  if (campos['54']) {
    const amount = campos['54'].value;
    console.log(`   Amount: ${amount}`);
    
    if (!/^\d+$/.test(amount)) {
      problemasMP.push(`Campo 54 (Amount) debe ser numérico, actual: "${amount}"`);
    } else {
      const amountNum = parseInt(amount);
      if (amountNum <= 0) {
        problemasMP.push('El monto debe ser mayor a 0');
      } else {
        console.log(`   ✅ Monto válido: ${amountNum / 100} ARS`);
      }
    }
  } else {
    problemasMP.push('Falta campo 54 (Transaction Amount)');
  }
  
  // 3. Verificar nombre del comercio
  if (campos['59']) {
    const name = campos['59'].value;
    console.log(`   Merchant Name: "${name}"`);
    
    if (name.length === 0) {
      problemasMP.push('El nombre del comercio no puede estar vacío');
    } else {
      console.log(`   ✅ Nombre válido`);
    }
    
    // Mercado Pago puede rechazar nombres muy genéricos
    if (name.toLowerCase().includes('test') || name.toLowerCase().includes('example')) {
      problemasMP.push('El nombre del comercio no debe contener "test" o "example"');
    }
  } else {
    problemasMP.push('Falta campo 59 (Merchant Name)');
  }
  
  if (problemasMP.length > 0) {
    console.log('\n❌ Problemas específicos de Mercado Pago:\n');
    problemasMP.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p}`);
    });
  } else {
    console.log('\n✅ No se encontraron problemas específicos de Mercado Pago');
  }
}

function mostrarSoluciones() {
  console.log(`
🔧 SOLUCIONES RECOMENDADAS:

1. CORREGIR BACKEND (SOLUCIÓN DEFINITIVA)
   → Ver: CORRECCION_CRC_BACKEND_URGENTE.md
   → El backend debe calcular el CRC correctamente
   → El backend debe generar el QR con todos los campos correctos

2. VERIFICAR MERCHANT ACCOUNT INFORMATION
   → El campo 26 debe tener formato exacto: 0002AR01[GUID]02[TERMINAL_ID]
   → Verificar que el GUID y Terminal ID sean válidos
   → Contactar con Mercado Pago para verificar configuración

3. VERIFICAR REGISTRO EN MERCADO PAGO
   → El comercio debe estar registrado en Mercado Pago
   → El CBU/CVU debe estar verificado
   → El Terminal ID debe estar activo

4. PROBAR CON OTRA BILLETERA
   → Si Naranja X o MODO funcionan, el problema es específico de Mercado Pago
   → Si ninguna funciona, el problema es del payload EMV

5. CONTACTAR SOPORTE MERCADO PAGO
   → Proporcionar el payload EMV completo
   → Proporcionar el QR generado
   → Solicitar validación del formato

6. USAR API DE MERCADO PAGO DIRECTAMENTE
   → En lugar de QR interoperable, usar QR específico de Mercado Pago
   → Requiere integración con API de Mercado Pago
   → Más complejo pero más confiable
`);
}

// Ejecutar diagnóstico
diagnosticoCompletoQRMercadoPago();
window.diagnosticoCompletoQRMercadoPago = diagnosticoCompletoQRMercadoPago;

