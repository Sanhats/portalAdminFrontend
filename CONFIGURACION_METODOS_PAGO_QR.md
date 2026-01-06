# 📱 Configuración de Métodos de Pago QR

## 🎯 Requisitos para Mostrar Código QR

Para que el código QR se muestre correctamente en el modal de pago QR, se necesitan cumplir los siguientes requisitos:

---

## 1. Método de Pago Correcto

### En el Select del Modal "Pago QR"

Debes seleccionar un método de pago que cumpla con **al menos uno** de estos criterios:

#### Opción A: Por Category
- `category: 'qr'` 
- `category: 'pos'`

#### Opción B: Por Type
- `type: 'qr'`

### Ejemplo de Método de Pago en Backend

```json
{
  "id": "method-qr-123",
  "label": "QR Mercado Pago",
  "code": "qr_mp",
  "type": "qr",
  "category": "qr",
  "is_active": true
}
```

---

## 2. Respuesta del Backend al Crear Pago

Cuando creas un pago QR, el backend **debe devolver** el código QR en la respuesta:

### Estructura Requerida

```json
{
  "id": "payment-123",
  "amount": "10000.00",
  "status": "pending",
  "payment_method_id": "method-qr-123",
  "reference": "QR-789012",
  "external_reference": "MP-345678",
  "gateway_metadata": {
    "qr_code": "https://www.mercadopago.com.ar/qr/abc123xyz"  // ← URL de la imagen QR
  },
  "created_at": "2024-12-28T10:00:00Z"
}
```

### Campo Crítico: `gateway_metadata.qr_code`

El componente busca específicamente:
```javascript
createdPayment.gateway_metadata?.qr_code
```

Este campo debe contener:
- **URL de imagen del QR** (ej: `https://www.mercadopago.com.ar/qr/...`)
- O **Data URL base64** (ej: `data:image/png;base64,iVBORw0KGgo...`)

---

## 3. Flujo Completo

### Paso 1: Seleccionar Método QR
1. Abrir modal "Pago QR"
2. En el select, elegir un método que tenga:
   - `type: 'qr'` O
   - `category: 'qr'` O  
   - `category: 'pos'`

### Paso 2: Crear el Pago
1. Ingresar monto
2. (Opcional) Agregar referencia
3. Click en "Crear Pago QR"

### Paso 3: Backend Genera QR
El backend debe:
1. Crear el pago con `status: 'pending'`
2. Generar el código QR (usando la API de Mercado Pago u otro proveedor)
3. Devolver el QR en `gateway_metadata.qr_code`

### Paso 4: Frontend Muestra QR
Si todo está correcto:
- ✅ Se muestra el código QR como imagen
- ✅ Se muestra la referencia
- ✅ Se muestra external_reference si está disponible

---

## 🔍 Verificación y Debugging

### Si NO aparece el QR:

#### 1. Verificar Método de Pago Seleccionado
```javascript
// En la consola del navegador, después de crear el pago:
console.log(createdPayment);
// Verificar que payment_method_id corresponde a un método QR
```

#### 2. Verificar Respuesta del Backend
```javascript
// Verificar que gateway_metadata existe y tiene qr_code
console.log(createdPayment.gateway_metadata);
// Debe mostrar: { qr_code: "https://..." }
```

#### 3. Verificar en Network Tab
- Abrir DevTools → Network
- Buscar la request `POST /api/sales/:id/payments`
- Verificar la respuesta del backend
- Debe incluir `gateway_metadata.qr_code`

---

## 📋 Checklist de Configuración

### Backend
- [ ] Método de pago tiene `type: 'qr'` o `category: 'qr'`
- [ ] Método de pago tiene `is_active: true`
- [ ] Al crear pago QR, se genera el código QR
- [ ] La respuesta incluye `gateway_metadata.qr_code` con URL válida

### Frontend
- [ ] El método QR aparece en el select del modal
- [ ] Al crear el pago, se muestra la vista de éxito
- [ ] El código QR se renderiza correctamente

---

## 🛠️ Ejemplo de Implementación Backend

### Pseudocódigo para Generar QR

```python
# Ejemplo en Python (FastAPI)
def create_qr_payment(sale_id, amount, payment_method_id):
    # Crear pago en base de datos
    payment = create_payment(
        sale_id=sale_id,
        amount=amount,
        status='pending',
        payment_method_id=payment_method_id
    )
    
    # Generar QR usando API de Mercado Pago
    qr_response = mercado_pago_api.create_qr(
        amount=amount,
        description=f"Pago venta {sale_id}"
    )
    
    # Actualizar payment con metadata
    payment.gateway_metadata = {
        "qr_code": qr_response.qr_code_url,  # URL de la imagen QR
        "qr_data": qr_response.qr_data        # Datos del QR (opcional)
    }
    
    return payment
```

---

## 💡 Métodos de Pago Recomendados

### Para Mercado Pago QR
```json
{
  "label": "QR Mercado Pago",
  "code": "qr_mercadopago",
  "type": "qr",
  "category": "qr",
  "is_active": true
}
```

### Para QR Genérico
```json
{
  "label": "QR Code",
  "code": "qr_generic",
  "type": "qr",
  "category": "qr",
  "is_active": true
}
```

---

## ⚠️ Notas Importantes

1. **El QR se genera en el backend**, no en el frontend
2. **El backend debe tener integración** con el proveedor de QR (Mercado Pago, etc.)
3. **La URL del QR debe ser accesible** públicamente o ser una data URL
4. **Si el QR no aparece**, verificar primero la respuesta del backend en Network tab

---

**Última actualización:** Diciembre 2024

