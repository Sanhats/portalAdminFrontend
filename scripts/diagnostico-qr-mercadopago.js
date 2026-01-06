/**
 * Script de diagnóstico para verificar QR de Mercado Pago
 * 
 * Ejecutar en la consola del navegador cuando estés viendo un pago QR
 * 
 * Este script verifica:
 * 1. Si el QR es una imagen válida
 * 2. Si el QR contiene datos de Mercado Pago
 * 3. El tamaño y calidad del QR
 * 4. Si el QR está siendo renderizado correctamente
 */

async function diagnosticarQRMercadoPago() {
  console.log('🔍 Iniciando diagnóstico de QR de Mercado Pago...\n');

  // 1. Buscar todas las imágenes QR en la página
  const qrImages = document.querySelectorAll('img[alt="QR Code"]');
  console.log(`📸 Imágenes QR encontradas: ${qrImages.length}\n`);

  if (qrImages.length === 0) {
    console.error('❌ No se encontraron imágenes QR en la página.');
    console.log('💡 Asegúrate de estar viendo un pago QR creado.');
    return;
  }

  // 2. Analizar cada imagen QR
  for (let i = 0; i < qrImages.length; i++) {
    const img = qrImages[i];
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📋 Análisis QR #${i + 1}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // 2.1. Verificar src
    const src = img.src;
    console.log(`📍 URL/Data del QR:`);
    console.log(`   ${src.substring(0, 100)}${src.length > 100 ? '...' : ''}\n`);

    // 2.2. Verificar tipo
    if (src.startsWith('data:image')) {
      console.log(`✅ Tipo: Data URL (Base64)`);
      const match = src.match(/data:image\/(\w+);base64,(.+)/);
      if (match) {
        console.log(`   Formato: ${match[1]}`);
        console.log(`   Tamaño base64: ${match[2].length} caracteres`);
        console.log(`   Tamaño aproximado: ${Math.round(match[2].length * 0.75 / 1024)} KB`);
      }
    } else if (src.startsWith('http://') || src.startsWith('https://')) {
      console.log(`✅ Tipo: URL Externa`);
      console.log(`   Dominio: ${new URL(src).hostname}`);
    } else {
      console.log(`⚠️ Tipo: Desconocido`);
    }

    // 2.3. Verificar dimensiones renderizadas
    const rect = img.getBoundingClientRect();
    console.log(`\n📐 Dimensiones renderizadas:`);
    console.log(`   Ancho: ${rect.width}px`);
    console.log(`   Alto: ${rect.height}px`);
    console.log(`   Aspecto: ${(rect.width / rect.height).toFixed(2)}`);

    // 2.4. Verificar dimensiones naturales
    if (img.naturalWidth && img.naturalHeight) {
      console.log(`\n📐 Dimensiones naturales:`);
      console.log(`   Ancho: ${img.naturalWidth}px`);
      console.log(`   Alto: ${img.naturalHeight}px`);
      console.log(`   Aspecto: ${(img.naturalWidth / img.naturalHeight).toFixed(2)}`);

      // Verificar si está siendo escalado
      const scaleX = rect.width / img.naturalWidth;
      const scaleY = rect.height / img.naturalHeight;
      if (Math.abs(scaleX - scaleY) > 0.1) {
        console.log(`\n⚠️ ADVERTENCIA: El QR está siendo distorsionado!`);
        console.log(`   Escala X: ${scaleX.toFixed(2)}`);
        console.log(`   Escala Y: ${scaleY.toFixed(2)}`);
        console.log(`   Diferencia: ${Math.abs(scaleX - scaleY).toFixed(2)}`);
      }
    }

    // 2.5. Verificar tamaño mínimo recomendado
    const minSize = 200; // Mercado Pago recomienda mínimo 200x200px
    if (rect.width < minSize || rect.height < minSize) {
      console.log(`\n⚠️ ADVERTENCIA: El QR es demasiado pequeño!`);
      console.log(`   Tamaño mínimo recomendado: ${minSize}x${minSize}px`);
      console.log(`   Tamaño actual: ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
    } else {
      console.log(`\n✅ Tamaño adecuado para escanear`);
    }

    // 2.6. Verificar si la imagen cargó correctamente
    if (img.complete && img.naturalWidth > 0) {
      console.log(`\n✅ Imagen cargada correctamente`);
    } else {
      console.log(`\n❌ La imagen no se cargó correctamente`);
      console.log(`   complete: ${img.complete}`);
      console.log(`   naturalWidth: ${img.naturalWidth}`);
    }

    // 2.7. Verificar estilos CSS que puedan afectar
    const computedStyle = window.getComputedStyle(img);
    console.log(`\n🎨 Estilos CSS aplicados:`);
    console.log(`   object-fit: ${computedStyle.objectFit}`);
    console.log(`   object-position: ${computedStyle.objectPosition}`);
    console.log(`   transform: ${computedStyle.transform}`);
    console.log(`   opacity: ${computedStyle.opacity}`);

    if (computedStyle.objectFit !== 'contain' && computedStyle.objectFit !== 'none') {
      console.log(`\n⚠️ ADVERTENCIA: object-fit es "${computedStyle.objectFit}"`);
      console.log(`   Recomendado: "contain" o "none" para evitar distorsión`);
    }

    // 2.8. Intentar decodificar el QR (si es posible)
    console.log(`\n🔍 Intentando decodificar contenido del QR...`);
    try {
      // Crear un canvas para analizar la imagen
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth || rect.width;
      canvas.height = img.naturalHeight || rect.height;
      
      ctx.drawImage(img, 0, 0);
      
      // Obtener datos de píxeles
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      // Verificar si es realmente un QR (debe tener áreas blancas y negras)
      let blackPixels = 0;
      let whitePixels = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const brightness = (r + g + b) / 3;
        if (brightness < 128) {
          blackPixels++;
        } else {
          whitePixels++;
        }
      }
      
      const totalPixels = blackPixels + whitePixels;
      const blackRatio = blackPixels / totalPixels;
      
      console.log(`   Píxeles negros: ${blackPixels} (${(blackRatio * 100).toFixed(1)}%)`);
      console.log(`   Píxeles blancos: ${whitePixels} (${((1 - blackRatio) * 100).toFixed(1)}%)`);
      
      if (blackRatio > 0.1 && blackRatio < 0.9) {
        console.log(`   ✅ Parece ser un QR válido (tiene áreas blancas y negras)`);
      } else {
        console.log(`   ⚠️ El QR podría estar corrupto o ser una imagen genérica`);
      }
      
    } catch (error) {
      console.log(`   ⚠️ No se pudo analizar el contenido: ${error.message}`);
    }

    // 2.9. Verificar si hay errores de carga
    img.addEventListener('error', () => {
      console.log(`\n❌ ERROR: La imagen QR no se pudo cargar`);
    }, { once: true });

    // 2.10. Recomendaciones
    console.log(`\n💡 Recomendaciones:`);
    
    if (rect.width < minSize || rect.height < minSize) {
      console.log(`   • Aumentar el tamaño del QR a mínimo ${minSize}x${minSize}px`);
    }
    
    if (computedStyle.objectFit !== 'contain' && computedStyle.objectFit !== 'none') {
      console.log(`   • Cambiar object-fit a "contain" o "none"`);
    }
    
    if (!src.startsWith('data:image') && !src.startsWith('http')) {
      console.log(`   • Verificar que el backend esté generando un QR válido`);
    }
    
    console.log(`   • Asegurarse de que el QR sea de Mercado Pago (no genérico)`);
    console.log(`   • Verificar que el QR contenga un código de pago válido de MP`);
    console.log(`   • Probar escanear desde diferentes ángulos y distancias`);
  }

  // 3. Verificar datos del pago desde el DOM o API
  console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📋 Información del Pago`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Intentar obtener el ID de la venta de la URL
  const urlParts = window.location.pathname.split('/');
  const saleId = urlParts[urlParts.length - 1];
  
  if (saleId && saleId !== 'sales') {
    console.log(`🔗 Sale ID: ${saleId}`);
    console.log(`\n💡 Para verificar los datos del pago desde el backend:`);
    console.log(`   1. Abre la consola de red (F12 > Network)`);
    console.log(`   2. Busca la petición GET /api/proxy/sales/${saleId}/payments`);
    console.log(`   3. Verifica el campo gateway_metadata.qr_code`);
    console.log(`   4. Verifica que el método de pago sea de Mercado Pago`);
  }

  console.log(`\n✅ Diagnóstico completado!\n`);
}

// Ejecutar automáticamente
diagnosticarQRMercadoPago();


