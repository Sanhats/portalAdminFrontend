# 🔍 Guía de Diagnóstico - QR de Mercado Pago No Escaneable

## Problema Reportado
La app de Mercado Pago no puede escanear el código QR que aparece en el frontend.

---

## 🔧 Pasos de Diagnóstico

### 1. Ejecutar Script de Diagnóstico

**En la consola del navegador (F12):**

1. Abre la página donde se muestra el QR
2. Abre la consola (F12 > Console)
3. Copia y pega el contenido de `scripts/diagnostico-qr-mercadopago.js`
4. Presiona Enter

El script verificará:
- ✅ Si el QR es una imagen válida
- ✅ Tamaño y calidad del QR
- ✅ Si el QR está siendo distorsionado por CSS
- ✅ Si el QR contiene datos válidos

---

### 2. Verificar Método de Pago

**El QR debe ser de un método específico de Mercado Pago, no genérico.**

#### Verificar en la consola:
```javascript
// Obtener el pago actual
const saleId = window.location.pathname.split('/').pop();
const token = localStorage.getItem('access_token');

fetch(`/api/proxy/sales/${saleId}/payments`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(data => {
    const qrPayment = data.payments?.find(p => p.gateway_metadata?.qr_code);
    if (qrPayment) {
      console.log('Método de pago:', qrPayment.payment_methods);
      console.log('Código:', qrPayment.payment_methods?.code);
      console.log('Label:', qrPayment.payment_methods?.label);
      
      // Verificar si es Mercado Pago
      const code = qrPayment.payment_methods?.code?.toLowerCase() || '';
      const label = qrPayment.payment_methods?.label?.toLowerCase() || '';
      
      if (code.includes('mercadopago') || code.includes('mp') || label.includes('mercado pago')) {
        console.log('✅ Es un método de Mercado Pago');
      } else {
        console.warn('⚠️ NO es un método específico de Mercado Pago');
        console.warn('   El QR podría ser genérico y no funcionar con la app de MP');
      }
    }
  });
```

---

### 3. Verificar Contenido del QR

**El QR debe contener un código de pago válido de Mercado Pago, no solo una imagen genérica.**

#### Verificar en la consola de red:
1. Abre DevTools (F12)
2. Ve a la pestaña **Network**
3. Busca la petición `GET /api/proxy/sales/[id]/payments`
4. Abre la respuesta y verifica:

```json
{
  "gateway_metadata": {
    "qr_code": "data:image/png;base64,..." // o URL
  }
}
```

**⚠️ Problemas comunes:**
- `gateway_metadata` es `null` → El backend no está generando el QR
- `qr_code` es una imagen genérica → No contiene código de pago de MP
- `qr_code` es una URL que no carga → Problema de CORS o URL inválida

---

### 4. Verificar Tamaño del QR

**Mercado Pago recomienda mínimo 200x200px para escanear correctamente.**

#### Verificar en la consola:
```javascript
const img = document.querySelector('img[alt="QR Code"]');
if (img) {
  const rect = img.getBoundingClientRect();
  console.log('Tamaño renderizado:', rect.width, 'x', rect.height);
  console.log('Tamaño natural:', img.naturalWidth, 'x', img.naturalHeight);
  
  if (rect.width < 200 || rect.height < 200) {
    console.warn('⚠️ El QR es demasiado pequeño para escanear');
  }
}
```

**✅ Solución implementada:**
- El QR ahora se renderiza a **256x256px** (w-64 h-64)
- Se usa `object-contain` para evitar distorsión

---

### 5. Verificar Distorsión del QR

**El QR no debe estar distorsionado (debe ser cuadrado).**

#### Verificar en la consola:
```javascript
const img = document.querySelector('img[alt="QR Code"]');
if (img) {
  const rect = img.getBoundingClientRect();
  const aspectRatio = rect.width / rect.height;
  
  console.log('Aspecto:', aspectRatio);
  
  if (Math.abs(aspectRatio - 1) > 0.1) {
    console.warn('⚠️ El QR está distorsionado (no es cuadrado)');
  }
}
```

**✅ Solución implementada:**
- Se usa `object-contain` para mantener el aspecto
- Se asegura que el contenedor sea cuadrado

---

## 🐛 Problemas Comunes y Soluciones

### Problema 1: QR Genérico (No de Mercado Pago)

**Síntoma:** El QR se muestra pero Mercado Pago no lo reconoce.

**Causa:** El método de pago es genérico (`qr`) y no específico de Mercado Pago.

**Solución:**
1. Verificar que el método de pago tenga `code` que incluya `mercadopago` o `mp`
2. Configurar un método de pago específico de Mercado Pago en el backend
3. Ver `CONFIGURACION_METODOS_PAGO_QR.md` para más detalles

---

### Problema 2: QR Demasiado Pequeño

**Síntoma:** Mercado Pago no puede escanear el QR.

**Causa:** El QR es menor a 200x200px.

**Solución:**
- ✅ **Ya implementado:** El QR ahora se renderiza a 256x256px
- Si aún es pequeño, aumentar el tamaño en el componente

---

### Problema 3: QR Distorsionado

**Síntoma:** El QR se ve estirado o comprimido.

**Causa:** CSS está distorsionando la imagen.

**Solución:**
- ✅ **Ya implementado:** Se usa `object-contain` para evitar distorsión
- Verificar que no haya otros estilos CSS que afecten

---

### Problema 4: QR No Contiene Código de Pago Válido

**Síntoma:** El QR se muestra pero no tiene datos de Mercado Pago.

**Causa:** El backend está generando un QR genérico sin código de pago.

**Solución:**
1. Verificar que el backend esté usando la API de Mercado Pago correctamente
2. Verificar que el QR contenga un código de pago válido (no solo una imagen)
3. Ver `REQUERIMIENTOS_BACKEND_QR.md` para más detalles

---

### Problema 5: QR Expirado

**Síntoma:** Mercado Pago dice que el QR expiró.

**Causa:** El QR tiene una fecha de expiración y ya pasó.

**Solución:**
- El frontend muestra un countdown si existe `expires_at`
- Si expira, se muestra "QR Expirado"
- Crear un nuevo pago QR para obtener uno nuevo

---

## ✅ Checklist de Verificación

Antes de reportar el problema, verifica:

- [ ] El QR se muestra correctamente en el navegador
- [ ] El QR tiene al menos 200x200px de tamaño
- [ ] El QR es cuadrado (no distorsionado)
- [ ] El método de pago es específico de Mercado Pago (no genérico)
- [ ] El QR no está expirado (verificar countdown)
- [ ] El backend está devolviendo `gateway_metadata.qr_code`
- [ ] El QR contiene un código de pago válido (no solo imagen genérica)
- [ ] La app de Mercado Pago está actualizada
- [ ] Se está escaneando desde la distancia correcta (20-30cm)

---

## 📞 Información para el Backend

Si el problema persiste después de verificar todo lo anterior, proporciona al backend:

1. **ID del pago QR creado**
2. **Método de pago usado** (`payment_methods.code` y `payment_methods.label`)
3. **Contenido de `gateway_metadata`** completo
4. **Tamaño del QR generado** (si es base64, tamaño en KB)
5. **Si el QR es de Mercado Pago o genérico**

---

## 🔗 Referencias

- `CONFIGURACION_METODOS_PAGO_QR.md` - Configuración de métodos de pago
- `REQUERIMIENTOS_BACKEND_QR.md` - Requerimientos del backend
- `scripts/diagnostico-qr-mercadopago.js` - Script de diagnóstico

---

**Última actualización:** Diciembre 2024


