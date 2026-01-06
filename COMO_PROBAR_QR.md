# 🔍 Cómo Probar si el Backend Está Generando el QR

## Método 1: Script en el Navegador (Recomendado)

### Paso 1: Abrir la Consola
1. Ve a la página de detalle de venta: `/admin/sales/[id]`
2. Abre DevTools (F12)
3. Ve a la pestaña **Console**

### Paso 2: Ejecutar el Script
1. Abre el archivo `scripts/test-qr-payment-browser.js`
2. Copia TODO el contenido
3. Pégalo en la consola del navegador
4. Presiona Enter

### Paso 3: Ver Resultados
El script te mostrará:
- ✅ Qué métodos QR están disponibles
- ✅ Si el pago se creó correctamente
- ✅ **Si el backend devolvió `gateway_metadata.qr_code`**
- ✅ La respuesta completa del backend

---

## Método 2: Verificar Manualmente en Network Tab

### Paso 1: Abrir Network Tab
1. Abre DevTools (F12)
2. Ve a la pestaña **Network**
3. Filtra por "payments" o "sales"

### Paso 2: Crear un Pago QR
1. En la interfaz, crea un pago QR normalmente
2. Observa la request en Network tab

### Paso 3: Verificar la Respuesta
1. Busca la request `POST /api/proxy/sales/[id]/payments`
2. Click en ella
3. Ve a la pestaña **Response** o **Preview**
4. Busca el campo `gateway_metadata`

**✅ Si existe `gateway_metadata.qr_code`:**
- El backend está generando el QR correctamente
- El problema puede ser en el frontend (verificar que el componente lo muestre)

**❌ Si NO existe `gateway_metadata` o `gateway_metadata.qr_code`:**
- El backend NO está generando el QR
- Necesitas configurar el backend para que genere el QR

---

## Método 3: Verificar en la Consola del Componente

### Mejoras Agregadas al Componente

Ahora el componente muestra:
1. **Logs en consola** cuando creas un pago QR:
   ```
   🔍 Pago QR creado - Respuesta del backend: {...}
   🔍 Gateway Metadata: {...}
   🔍 QR Code disponible: true/false
   ```

2. **Mensaje visual** si no hay QR:
   - Aparece un mensaje amarillo indicando que el QR no está disponible
   - Muestra detalles técnicos expandibles

### Cómo Usar
1. Crea un pago QR normalmente
2. Abre la consola (F12)
3. Busca los logs que empiezan con 🔍
4. Verifica qué está devolviendo el backend

---

## Qué Buscar en la Respuesta del Backend

### ✅ Respuesta Correcta (con QR)
```json
{
  "id": "payment-123",
  "status": "pending",
  "amount": "1000.00",
  "gateway_metadata": {
    "qr_code": "https://www.mercadopago.com.ar/qr/abc123"
  }
}
```

### ❌ Respuesta Incorrecta (sin QR)
```json
{
  "id": "payment-123",
  "status": "pending",
  "amount": "1000.00"
  // ❌ Falta gateway_metadata
}
```

O:

```json
{
  "id": "payment-123",
  "status": "pending",
  "amount": "1000.00",
  "gateway_metadata": {
    // ❌ Falta qr_code
  }
}
```

---

## Soluciones Según el Problema

### Problema 1: El backend NO devuelve `gateway_metadata`
**Solución:** Configurar el backend para que incluya `gateway_metadata` en la respuesta al crear pagos QR.

### Problema 2: El backend devuelve `gateway_metadata` pero sin `qr_code`
**Solución:** El backend debe generar el QR usando la API de Mercado Pago (u otro proveedor) y devolverlo en `gateway_metadata.qr_code`.

### Problema 3: El backend devuelve el QR pero no se muestra
**Solución:** Verificar que la URL del QR sea accesible o usar una data URL (base64).

---

## Ejemplo de Implementación Backend

El backend debe hacer algo como esto al crear un pago QR:

```python
# Ejemplo Python
def create_qr_payment(sale_id, amount, payment_method_id):
    # Crear pago
    payment = create_payment(...)
    
    # Generar QR (ejemplo con Mercado Pago)
    qr_response = mercado_pago_api.create_qr_payment(
        amount=amount,
        description=f"Pago venta {sale_id}"
    )
    
    # Actualizar payment con QR
    payment.gateway_metadata = {
        "qr_code": qr_response.qr_code_url  # ← Esto es lo que necesita el frontend
    }
    
    return payment
```

---

## Próximos Pasos

1. **Ejecuta el script** en el navegador para ver qué está devolviendo el backend
2. **Comparte los resultados** para poder ayudarte mejor
3. **Si el backend no genera QR**, necesitarás configurarlo para que lo haga

---

**Última actualización:** Diciembre 2024

