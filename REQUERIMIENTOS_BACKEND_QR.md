# 🔧 Requerimientos Backend - Generación de Código QR

## ❌ Problema Identificado

El backend está creando pagos QR correctamente, pero **NO está generando ni devolviendo el código QR** en la respuesta.

### Respuesta Actual (Incorrecta)
```json
{
  "id": "1bd1e354-87c0-4e24-acec-2c2d12a8c48e",
  "status": "pending",
  "amount": 1000,
  "gateway_metadata": null  // ← PROBLEMA: Es null
}
```

### Respuesta Esperada (Correcta)
```json
{
  "id": "1bd1e354-87c0-4e24-acec-2c2d12a8c48e",
  "status": "pending",
  "amount": 1000,
  "gateway_metadata": {
    "qr_code": "https://www.mercadopago.com.ar/qr/abc123xyz"  // ← URL de la imagen QR
  }
}
```

---

## ✅ Solución Requerida en el Backend

### Cuando se crea un pago QR, el backend debe:

1. **Detectar que es un pago QR** (por `payment_method_id` o `method: 'qr'`)
2. **Generar el código QR** usando la API del proveedor (Mercado Pago, etc.)
3. **Devolver el QR** en `gateway_metadata.qr_code`

---

## 📋 Implementación Sugerida

### Pseudocódigo

```python
# Ejemplo en Python (FastAPI)
async def create_payment(sale_id: str, payment_data: PaymentCreate):
    # 1. Crear el pago en la base de datos
    payment = await db.create_payment(
        sale_id=sale_id,
        amount=payment_data.amount,
        status=payment_data.status,
        payment_method_id=payment_data.paymentMethodId,
        reference=payment_data.reference
    )
    
    # 2. Obtener el método de pago
    payment_method = await db.get_payment_method(payment_data.paymentMethodId)
    
    # 3. Si es un método QR, generar el código QR
    if payment_method.type == 'qr' or payment_method.category == 'qr':
        # Generar QR usando la API del proveedor
        qr_response = await generate_qr_code(
            amount=payment_data.amount,
            reference=payment.reference or payment.id,
            payment_method=payment_method
        )
        
        # 4. Guardar el QR en gateway_metadata
        payment.gateway_metadata = {
            "qr_code": qr_response.qr_code_url,  # URL de la imagen QR
            "qr_data": qr_response.qr_data,      # Datos del QR (opcional)
            "provider": qr_response.provider     # Proveedor usado (opcional)
        }
        
        await db.update_payment(payment.id, {
            "gateway_metadata": payment.gateway_metadata
        })
    
    return payment
```

---

## 🔌 Integración con Mercado Pago

### Ejemplo con Mercado Pago API

```python
async def generate_qr_code(amount: float, reference: str, payment_method: PaymentMethod):
    """
    Genera un código QR usando la API de Mercado Pago
    """
    import mercadopago
    
    # Configurar SDK de Mercado Pago
    mp = mercadopago.MP("ACCESS_TOKEN")
    
    # Crear preferencia de pago QR
    preference_data = {
        "items": [
            {
                "title": f"Pago QR - {reference}",
                "quantity": 1,
                "unit_price": float(amount)
            }
        ],
        "payment_methods": {
            "excluded_payment_types": [],
            "excluded_payment_methods": []
        }
    }
    
    # Crear preferencia
    preference = mp.create_preference(preference_data)
    
    if preference["status"] == 201:
        # Obtener QR code de la respuesta
        qr_code_url = preference["response"]["qr_code"]
        # O construir la URL del QR desde init_point
        # qr_code_url = f"https://www.mercadopago.com.ar/qr/{preference['response']['id']}"
        
        return {
            "qr_code": qr_code_url,
            "qr_data": preference["response"],
            "provider": "mercadopago"
        }
    else:
        raise Exception(f"Error al generar QR: {preference}")
```

---

## 📝 Estructura de `gateway_metadata` Requerida

### Para Pagos QR
```json
{
  "gateway_metadata": {
    "qr_code": "https://www.mercadopago.com.ar/qr/abc123",  // REQUERIDO: URL de la imagen QR
    "qr_data": "...",                                        // Opcional: Datos del QR
    "provider": "mercadopago"                                // Opcional: Proveedor usado
  }
}
```

### Para Pagos Mercado Pago (Checkout)
```json
{
  "gateway_metadata": {
    "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",  // REQUERIDO
    "preference_id": "123456789",                                                       // Opcional
    "qr_code": "https://..."                                                            // Opcional si hay QR
  }
}
```

---

## 🧪 Cómo Probar la Solución

### 1. Crear un pago QR desde el frontend
### 2. Verificar la respuesta del backend en Network tab
### 3. Debe incluir:
```json
{
  "gateway_metadata": {
    "qr_code": "https://..."
  }
}
```

### 4. El frontend automáticamente mostrará el QR si existe

---

## 🔍 Verificación

### Endpoint a Verificar
`POST /api/sales/:id/payments`

### Request Body
```json
{
  "amount": 1000,
  "status": "pending",
  "paymentMethodId": "76465e81-f405-4b6e-a9af-aef6ca54f805"  // ID de método QR
}
```

### Response Esperada
```json
{
  "id": "...",
  "status": "pending",
  "amount": 1000,
  "gateway_metadata": {
    "qr_code": "https://..."  // ← DEBE EXISTIR
  }
}
```

---

## ⚠️ Notas Importantes

1. **El QR se genera en el backend**, no en el frontend
2. **El QR puede ser una URL externa** (ej: `https://www.mercadopago.com.ar/qr/...`)
3. **O una data URL base64** (ej: `data:image/png;base64,iVBORw0KGgo...`)
4. **El frontend solo muestra** lo que el backend devuelve
5. **Si `gateway_metadata` es `null`**, el frontend mostrará un mensaje indicando que el QR no está disponible

---

## 📚 Referencias

- [Mercado Pago QR Code API](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/integration-test/test-cards)
- Documentación del frontend: `CONFIGURACION_METODOS_PAGO_QR.md`

---

**Última actualización:** Diciembre 2024

