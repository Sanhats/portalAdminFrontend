/**
 * Script para leer el contenido real del QR que se muestra en pantalla
 * 
 * Este script intenta leer el QR desde la imagen que se muestra en el navegador
 * y verificar qué payload contiene realmente.
 * 
 * Copia y pega este código en la consola del navegador (F12)
 */

async function leerQRPantalla() {
  console.log('🔍 Leyendo QR desde pantalla...\n');
  
  // Buscar todas las imágenes QR en pantalla
  const qrImages = document.querySelectorAll('img[alt*="QR"], img[src*="data:image"]');
  
  if (qrImages.length === 0) {
    console.error('❌ No se encontró ningún QR en pantalla');
    return;
  }
  
  console.log(`✅ Encontrados ${qrImages.length} QR(s) en pantalla\n`);
  
  // Intentar leer cada QR
  for (let i = 0; i < qrImages.length; i++) {
    const img = qrImages[i];
    const src = img.src;
    
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`QR ${i + 1}/${qrImages.length}`);
    console.log(`${'═'.repeat(60)}`);
    console.log(`Tipo: ${src.startsWith('data:image') ? 'Base64 Data URL' : 'URL Externa'}`);
    console.log(`Dimensiones: ${img.width}x${img.height}px`);
    
    if (!src.startsWith('data:image')) {
      console.warn('⚠️ Este QR no es base64, no se puede leer directamente');
      continue;
    }
    
    try {
      // Intentar usar jsQR para leer el QR
      // Nota: jsQR necesita estar disponible en la página
      if (typeof window.jsQR === 'undefined') {
        console.warn('⚠️ jsQR no está disponible. Cargando...');
        
        // Intentar cargar jsQR dinámicamente
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
        script.onload = async () => {
          await leerQRConJSQR(img, src);
        };
        script.onerror = () => {
          console.error('❌ No se pudo cargar jsQR');
          console.log('\n💡 Alternativa: Usa una app de escaneo QR en tu teléfono');
          console.log('   para verificar qué contiene realmente el QR');
        };
        document.head.appendChild(script);
      } else {
        await leerQRConJSQR(img, src);
      }
    } catch (error) {
      console.error('❌ Error al leer QR:', error);
      console.log('\n💡 Alternativa: Usa una app de escaneo QR en tu teléfono');
      console.log('   para verificar qué contiene realmente el QR');
    }
  }
}

async function leerQRConJSQR(img, src) {
  // Crear canvas para leer el QR
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  
  // Esperar a que la imagen cargue
  await new Promise((resolve) => {
    if (img.complete) {
      resolve();
    } else {
      img.onload = resolve;
    }
  });
  
  ctx.drawImage(img, 0, 0);
  
  // Obtener datos de imagen
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Leer QR con jsQR
  const code = window.jsQR(imageData.data, imageData.width, imageData.height);
  
  if (!code) {
    console.error('❌ No se pudo leer el QR desde la imagen');
    console.log('   Posibles causas:');
    console.log('   - QR muy pequeño o borroso');
    console.log('   - QR corrupto');
    console.log('   - Problema con la calidad de la imagen');
    return;
  }
  
  const payload = code.data;
  
  console.log('\n✅ QR leído exitosamente!');
  console.log(`\n📋 Contenido del QR:`);
  console.log(`   ${payload.substring(0, 80)}...`);
  console.log(`   Longitud total: ${payload.length} caracteres`);
  
  // Verificar si es EMV
  if (payload.startsWith('000201')) {
    console.log(`\n✅ Formato EMV válido`);
    
    // Extraer CRC
    const crcMatch = payload.match(/63(\d{2})([A-F0-9]{4})$/);
    if (crcMatch) {
      const crc = crcMatch[2];
      console.log(`   CRC en QR: ${crc}`);
      
      // Calcular CRC esperado
      const payloadSinCRC = payload.substring(0, payload.length - 6);
      const dataParaCRC = payloadSinCRC + "6304";
      
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
      
      const crcCalculado = calcCRC(dataParaCRC).toString(16).toUpperCase().padStart(4, '0');
      
      if (crc === crcCalculado) {
        console.log(`   ✅ CRC CORRECTO (${crc})`);
      } else {
        console.error(`   ❌ CRC INCORRECTO`);
        console.error(`      En QR: ${crc}`);
        console.error(`      Esperado: ${crcCalculado}`);
      }
    }
    
    // Verificar campos básicos
    console.log(`\n🔍 Verificación rápida:`);
    if (payload.includes('5802AR')) {
      console.log(`   ✅ País: AR`);
    }
    if (payload.includes('5303032')) {
      console.log(`   ✅ Moneda: ARS`);
    }
    // Leer campo 54 (Amount) correctamente
    let index = 0;
    while (index < payload.length) {
      const id = payload.substring(index, index + 2);
      index += 2;
      if (index + 2 > payload.length) break;
      const lengthStr = payload.substring(index, index + 2);
      const length = parseInt(lengthStr, 10);
      index += 2;
      if (id === '54' && length > 0 && index + length <= payload.length) {
        const amountStr = payload.substring(index, index + length);
        const amount = parseInt(amountStr, 10);
        console.log(`   ✅ Monto: ${amount / 100} ARS (campo 54: ${amountStr})`);
        break;
      }
      index += length;
    }
    
    console.log(`\n📋 Payload completo:`);
    console.log(`   ${payload}`);
    
  } else {
    console.warn(`\n⚠️ No es formato EMV (no empieza con "000201")`);
    console.log(`   Contenido: ${payload}`);
  }
}

// Ejecutar automáticamente
leerQRPantalla();

// Función global para usar desde consola
window.leerQRPantalla = leerQRPantalla;

