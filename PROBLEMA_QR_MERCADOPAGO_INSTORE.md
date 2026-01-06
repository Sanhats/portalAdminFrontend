# ⚠️ Problema: QR Genérico en lugar de Mercado Pago In-Store

## 🔴 Error del Backend

```
[generateQRPayment] Error al generar QR con Mercado Pago, usando genérico: 
Error: Mercado Pago In-Store requiere configuración adicional (user_id, external_pos_id). 
Usando QR genérico.
```

---

## 📋 Problema Identificado

El backend está intentando generar un QR de **Mercado Pago In-Store**, pero **no tiene la configuración necesaria**, por lo que está cayendo a un **QR genérico** como fallback.

### ⚠️ Consecuencia

El QR genérico **NO es escaneable** por la app de Mercado Pago porque:
- No contiene un código de pago válido de Mercado Pago
- Es solo una imagen genérica sin datos de transacción
- La app de Mercado Pago no puede procesarlo

---

## ✅ Solución: Configurar Mercado Pago In-Store

Para que el QR sea escaneable por la app de Mercado Pago, el backend necesita configurar:

### 1. Configuración Requerida

```javascript
// Configuración necesaria en el backend
const mercadoPagoConfig = {
  user_id: "TU_USER_ID_DE_MERCADOPAGO",        // ← REQUERIDO
  external_pos_id: "TU_EXTERNAL_POS_ID",        // ← REQUERIDO
  access_token: "TU_ACCESS_TOKEN"                // Ya debe estar configurado
};
```

### 2. Dónde Obtener estos Valores

#### `user_id` (User ID de Mercado Pago)
- Se obtiene de la cuenta de Mercado Pago
- Es el ID del usuario/comercio en Mercado Pago
- Formato: número (ej: `123456789`)

#### `external_pos_id` (ID del Punto de Venta)
- Se obtiene al crear un punto de venta en Mercado Pago
- Es el identificador del POS (Point of Sale) en Mercado Pago
- Formato: string (ej: `"STORE001"`)

### 3. Cómo Configurarlos

#### Opción A: Variables de Entorno (Recomendado)

```env
MERCADOPAGO_USER_ID=123456789
MERCADOPAGO_EXTERNAL_POS_ID=STORE001
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
```

#### Opción B: Configuración en Base de Datos

Almacenar en la tabla de configuración del tenant:

```sql
INSERT INTO tenant_settings (tenant_id, key, value) VALUES
  ('tenant-id', 'mercadopago_user_id', '123456789'),
  ('tenant-id', 'mercadopago_external_pos_id', 'STORE001');
```

#### Opción C: Configuración por Método de Pago

Almacenar en el método de pago específico:

```json
{
  "id": "method-qr-mp",
  "code": "qr_mercadopago",
  "label": "QR Mercado Pago",
  "type": "qr",
  "category": "qr",
  "config": {
    "mercadopago_user_id": "123456789",
    "mercadopago_external_pos_id": "STORE001"
  }
}
```

---

## 🔧 Implementación en el Backend

### Pseudocódigo de la Solución

```javascript
async function generateQRPayment(payment, paymentMethod) {
  try {
    // Verificar si es método de Mercado Pago
    const isMercadoPago = paymentMethod.code?.includes('mercadopago') || 
                          paymentMethod.code?.includes('mp');
    
    if (isMercadoPago) {
      // Obtener configuración de Mercado Pago In-Store
      const user_id = process.env.MERCADOPAGO_USER_ID || 
                      paymentMethod.config?.mercadopago_user_id;
      const external_pos_id = process.env.MERCADOPAGO_EXTERNAL_POS_ID || 
                              paymentMethod.config?.mercadopago_external_pos_id;
      
      // Validar que exista la configuración
      if (!user_id || !external_pos_id) {
        throw new Error(
          'Mercado Pago In-Store requiere configuración adicional (user_id, external_pos_id). ' +
          'Usando QR genérico.'
        );
      }
      
      // Generar QR con Mercado Pago In-Store API
      const qrResponse = await mercadoPagoAPI.createInStoreQR({
        user_id,
        external_pos_id,
        amount: payment.amount,
        description: `Pago venta ${payment.sale_id}`,
        external_reference: payment.reference || payment.id
      });
      
      return {
        qr_code: qrResponse.qr_code,  // URL o base64 del QR
        expires_at: qrResponse.expires_at,
        provider: 'mercadopago_instore'
      };
    } else {
      // Método genérico - generar QR genérico
      return generateGenericQR(payment);
    }
  } catch (error) {
    console.error('[generateQRPayment] Error:', error);
    // Fallback a QR genérico
    return generateGenericQR(payment);
  }
}
```

---

## 📚 Documentación de Mercado Pago In-Store

### API de Mercado Pago In-Store

- **Documentación:** https://www.mercadopago.com.ar/developers/es/docs/instore-integration/qr-code/qr-code-generation
- **Endpoint:** `POST /instore/orders/qr/seller/collectors/{user_id}/pos/{external_pos_id}/qrs`

### Ejemplo de Request

```javascript
POST https://api.mercadopago.com/instore/orders/qr/seller/collectors/{user_id}/pos/{external_pos_id}/qrs
Headers:
  Authorization: Bearer ACCESS_TOKEN
  Content-Type: application/json

Body:
{
  "external_reference": "REF-12345",
  "title": "Pago venta",
  "description": "Pago de venta #12345",
  "notification_url": "https://tu-backend.com/webhooks/mercadopago",
  "total_amount": 1000.00,
  "items": [
    {
      "title": "Item 1",
      "description": "Descripción",
      "quantity": 1,
      "unit_price": 1000.00
    }
  ]
}
```

### Ejemplo de Response

```json
{
  "qr_data": "00020126580014br.gov.bcb.pix...",
  "in_store_order_id": "123456789",
  "qr_code_base64": "data:image/png;base64,iVBORw0KGgo..."
}
```

---

## 🎯 Solución Temporal (Mientras se Configura)

### Opción 1: Usar Método de Pago NO de Mercado Pago

Si necesitas crear pagos QR inmediatamente sin configurar Mercado Pago In-Store:

1. Crear un método de pago genérico (no de Mercado Pago)
2. El backend generará un QR genérico
3. **Nota:** Este QR NO será escaneable por la app de Mercado Pago
4. El cliente deberá pagar manualmente o usar otro método

### Opción 2: Configurar Mercado Pago In-Store (Recomendado)

1. Obtener `user_id` y `external_pos_id` de Mercado Pago
2. Configurarlos en el backend (variables de entorno o BD)
3. El backend generará QR válido de Mercado Pago
4. El QR será escaneable por la app de Mercado Pago

---

## ✅ Checklist de Configuración

### Backend
- [ ] Obtener `user_id` de Mercado Pago
- [ ] Obtener `external_pos_id` de Mercado Pago
- [ ] Configurar `MERCADOPAGO_USER_ID` en variables de entorno
- [ ] Configurar `MERCADOPAGO_EXTERNAL_POS_ID` en variables de entorno
- [ ] Actualizar código para usar estos valores al generar QR
- [ ] Probar generación de QR con Mercado Pago In-Store
- [ ] Verificar que el QR generado sea escaneable

### Frontend
- [x] Mostrar advertencia cuando el QR es genérico (implementado)
- [x] Detectar método de pago de Mercado Pago (implementado)
- [x] Logs en consola para diagnóstico (implementado)

---

## 🔍 Cómo Verificar que Está Configurado Correctamente

### 1. Verificar en los Logs del Backend

Después de crear un pago QR, los logs deben mostrar:
```
✅ QR generado con Mercado Pago In-Store
   user_id: 123456789
   external_pos_id: STORE001
```

**NO debe aparecer:**
```
❌ Error: Mercado Pago In-Store requiere configuración adicional
```

### 2. Verificar en la Respuesta del Backend

La respuesta debe incluir:
```json
{
  "gateway_metadata": {
    "qr_code": "data:image/png;base64,..." // o URL de MP
  }
}
```

### 3. Verificar que el QR sea Escaneable

1. Crear un pago QR
2. Abrir la app de Mercado Pago
3. Escanear el QR
4. **Debe reconocer el código y mostrar el monto a pagar**

---

## 📞 Información para el Equipo de Backend

**Problema:** El backend está generando QR genérico en lugar de QR de Mercado Pago In-Store.

**Causa:** Faltan las siguientes configuraciones:
- `user_id` de Mercado Pago
- `external_pos_id` de Mercado Pago

**Solución:** Configurar estos valores y actualizar el código para usarlos al generar QR con Mercado Pago In-Store.

**Documentación:** Ver sección "Implementación en el Backend" arriba.

---

**Última actualización:** Diciembre 2024


