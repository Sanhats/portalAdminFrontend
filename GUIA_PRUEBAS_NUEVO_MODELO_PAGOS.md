# 🧪 Guía de Pruebas - Nuevo Modelo de Pagos (Sprint 1)

**Fecha:** Diciembre 2024  
**Objetivo:** Verificar la implementación del nuevo modelo de pagos en el frontend

---

## 📋 Checklist de Pruebas

### ✅ 1. Verificar Contrato de Datos PaymentDTO

#### **Prueba 1.1: Crear Pago Manual (Efectivo)**
1. Ir a **Admin → Ventas**
2. Seleccionar una venta con estado `confirmed` o `paid`
3. Click en **"Registrar Pago"** (botón azul)
4. En el modal:
   - Seleccionar método de pago: **"Efectivo"** (o método con `type: 'cash'`)
   - Ingresar monto: `1000`
   - (Opcional) Agregar referencia: `"Pago en efectivo"`
5. Click en **"Registrar Pago"**

**Resultado Esperado:**
- ✅ El pago se crea exitosamente
- ✅ El pago aparece en el listado con:
  - **Estado:** `Confirmado` (badge verde)
  - **Método:** `Efectivo`
  - **Monto:** `$1,000.00`
- ✅ El pago tiene `status: 'confirmed'` automáticamente (porque es manual)
- ✅ El pago tiene `provider: 'manual'` (determinado automáticamente)
- ✅ El pago tiene `confirmed_at` con fecha actual
- ✅ El pago tiene `confirmed_by: null` (confirmado por sistema)

**Verificar en la consola del navegador (F12):**
```javascript
// El pago creado debe tener esta estructura:
{
  id: "...",
  sale_id: "...",
  amount: "1000",
  status: "confirmed",
  method: "cash",
  provider: "manual",
  reference: "Pago en efectivo",
  confirmed_by: null,
  confirmed_at: "2024-12-01T10:00:00Z",
  created_at: "2024-12-01T10:00:00Z"
}
```

---

#### **Prueba 1.2: Crear Pago Manual (Transferencia)**
1. En la misma venta, click en **"Registrar Pago"**
2. Seleccionar método: **"Transferencia"** (o método con `type: 'transfer'`)
3. Ingresar monto: `2000`
4. Agregar referencia: `"TRX-12345"`
5. Click en **"Registrar Pago"**

**Resultado Esperado:**
- ✅ El pago se crea con `method: 'transfer'`
- ✅ El pago tiene `provider: 'banco'` (determinado automáticamente)
- ✅ El pago tiene `status: 'pending'` (porque provider = banco, no manual)
- ✅ La referencia se guarda correctamente

**Nota:** Según el backend, `transfer` → `provider: 'banco'` → `status: 'pending'`. Esto es correcto porque las transferencias requieren confirmación manual.

---

#### **Prueba 1.3: Crear Pago QR**
1. En la misma venta, click en **"Pago QR"** (botón verde)
2. Seleccionar método QR (si hay varios, elegir el principal)
3. Ingresar monto: `3000`
4. (Opcional) Agregar referencia
5. Click en **"Crear Pago QR"**

**Resultado Esperado:**
- ✅ El pago se crea con `method: 'qr'`
- ✅ El pago tiene `provider: 'mercadopago'` (determinado automáticamente)
- ✅ El pago tiene `status: 'pending'` (requiere confirmación)
- ✅ Se muestra el código QR en el modal
- ✅ El pago aparece en el listado como **"Pendiente"**

---

#### **Prueba 1.4: Crear Pago Mercado Pago (Checkout Online)**
1. En la misma venta, click en **"Mercado Pago"** (botón morado)
2. Seleccionar método Mercado Pago
3. Ingresar monto: `4000`
4. Click en **"Crear Pago"**

**Resultado Esperado:**
- ✅ El pago se crea con `method: 'mp_point'` o `method: 'qr'` (según el método seleccionado)
- ✅ El pago tiene `provider: 'mercadopago'`
- ✅ El pago tiene `status: 'pending'`
- ✅ Se redirige a la URL de pago de Mercado Pago

---

### ✅ 2. Verificar Enum de Métodos de Pago

#### **Prueba 2.1: Verificar Labels en Español**
En el listado de pagos, verificar que los métodos se muestran correctamente:

| Método (Backend) | Label Esperado (Frontend) |
|------------------|---------------------------|
| `cash` | **Efectivo** |
| `transfer` | **Transferencia** |
| `mp_point` | **Mercado Pago Puntos** |
| `qr` | **QR** |
| `card` | **Tarjeta** |
| `other` | **Otro** |

**Resultado Esperado:**
- ✅ Todos los métodos se muestran con labels en español
- ✅ Los labels son consistentes en todo el sistema

---

#### **Prueba 2.2: Verificar Providers**
En el listado de pagos, verificar que los providers se muestran correctamente:

| Provider | Label Esperado |
|----------|----------------|
| `manual` | **(Manual)** |
| `mercadopago` | **(Mercado Pago)** |
| `banco` | **(Banco)** |
| `pos` | **(POS)** |

**Resultado Esperado:**
- ✅ Los providers aparecen entre paréntesis junto al método
- ✅ Los labels son claros y descriptivos

---

### ✅ 3. Verificar Listado Básico de Pagos

#### **Prueba 3.1: Verificar Estructura del Listado**
1. Ir a una venta con múltiples pagos
2. Verificar que cada pago muestra:

**Información Principal:**
- ✅ **Estado:** Badge con color e icono
  - `Confirmado` → Badge verde con ✓
  - `Pendiente` → Badge amarillo con reloj
  - `Fallido` → Badge rojo con ✗
  - `Reembolsado` → Badge gris con ⚠
- ✅ **Método:** Nombre del método en español
- ✅ **Monto:** Formateado como moneda (ej: `$1,000.00`)

**Información Adicional:**
- ✅ **Referencia:** Si existe, se muestra debajo del método
- ✅ **Fecha de Confirmación:** Si el pago está confirmado, muestra `Confirmado: [fecha]`
- ✅ **Fecha de Creación:** Si no está confirmado, muestra `Creado: [fecha]`
- ✅ **Provider:** Se muestra entre paréntesis junto al método

**Resultado Esperado:**
- ✅ El listado es claro y fácil de leer
- ✅ La información está bien organizada
- ✅ Los colores y badges son consistentes

---

#### **Prueba 3.2: Verificar Orden de los Pagos**
1. Crear varios pagos en diferentes momentos
2. Verificar el orden en el listado

**Resultado Esperado:**
- ✅ Los pagos se muestran en orden cronológico (más recientes primero o último, según la implementación)
- ✅ El orden es consistente

---

### ✅ 4. Verificar Acción "Confirmar Pago"

#### **Prueba 4.1: Confirmar Pago Pendiente (Transferencia)**
1. Crear un pago de transferencia (debe quedar como `pending`)
2. En el listado, verificar que aparece el botón **"Confirmar"** (verde con ✓)
3. Click en **"Confirmar"**
4. Confirmar la acción en el diálogo

**Resultado Esperado:**
- ✅ El botón muestra un spinner mientras se procesa
- ✅ El pago cambia de estado `pending` → `confirmed`
- ✅ El badge cambia de amarillo a verde
- ✅ Aparece la fecha de confirmación: `Confirmado: [fecha]`
- ✅ El pago tiene `confirmed_by` con el ID del usuario actual
- ✅ El pago tiene `confirmed_at` con la fecha actual
- ✅ El balance de la venta se actualiza automáticamente
- ✅ Si el balance llega a 0, la venta cambia a estado `paid`

**Verificar en la consola:**
```javascript
// Después de confirmar, el pago debe tener:
{
  status: "confirmed",
  confirmed_by: "user-uuid-here",
  confirmed_at: "2024-12-01T10:30:00Z"
}
```

---

#### **Prueba 4.2: Verificar que Pagos Confirmados No Tienen Botón "Confirmar"**
1. Verificar un pago con estado `confirmed`
2. Verificar que NO aparece el botón "Confirmar"

**Resultado Esperado:**
- ✅ Solo los pagos `pending` tienen el botón "Confirmar"
- ✅ Los pagos `confirmed` no muestran el botón

---

#### **Prueba 4.3: Confirmar Pago QR Pendiente**
1. Crear un pago QR (debe quedar como `pending`)
2. En el listado, click en **"Confirmar"**
3. Verificar que el pago se confirma correctamente

**Resultado Esperado:**
- ✅ El pago QR se puede confirmar manualmente
- ✅ Después de confirmar, el QR ya no es necesario (se puede ocultar)
- ✅ El estado cambia a `confirmed`

---

#### **Prueba 4.4: Verificar Actualización del Balance**
1. Crear una venta con total: `$10,000`
2. Crear un pago de `$5,000` (confirmado)
3. Verificar que el balance muestra: `$5,000` pendiente
4. Crear otro pago de `$3,000` (confirmado)
5. Verificar que el balance muestra: `$2,000` pendiente
6. Crear un pago de `$2,000` (confirmado)
7. Verificar que:
   - ✅ El balance muestra: `$0` pendiente
   - ✅ La venta cambia automáticamente a estado `paid`
   - ✅ Se muestra el mensaje de "Venta pagada completamente"

**Resultado Esperado:**
- ✅ El balance se actualiza en tiempo real
- ✅ Solo los pagos `confirmed` cuentan para el balance
- ✅ Los pagos `pending` NO cuentan para el balance
- ✅ La venta cambia de estado automáticamente cuando se completa el pago

---

### ✅ 5. Verificar Compatibilidad Hacia Atrás

#### **Prueba 5.1: Pagos Antiguos Siguen Funcionando**
1. Si hay pagos creados antes de esta actualización, verificar que:
   - ✅ Se muestran correctamente en el listado
   - ✅ Tienen información completa (aunque usen campos antiguos)
   - ✅ Se pueden confirmar si están `pending`

**Resultado Esperado:**
- ✅ No se rompe la visualización de pagos antiguos
- ✅ Los campos antiguos (`payment_method_id`, `gateway_metadata`, etc.) se mantienen

---

## 🐛 Casos de Error a Probar

### **Error 1: Intentar Confirmar Pago Ya Confirmado**
1. Confirmar un pago
2. Intentar confirmarlo de nuevo

**Resultado Esperado:**
- ✅ Muestra error: "Este pago no puede ser confirmado" o similar
- ✅ El botón "Confirmar" no aparece después de confirmar

---

### **Error 2: Crear Pago en Venta Draft**
1. Intentar crear un pago en una venta con estado `draft`

**Resultado Esperado:**
- ✅ Muestra error: "Solo se pueden crear pagos en ventas confirmadas o pagadas"
- ✅ El botón "Registrar Pago" está deshabilitado o no aparece

---

### **Error 3: Monto Inválido**
1. Intentar crear un pago con monto negativo o cero

**Resultado Esperado:**
- ✅ Muestra error de validación
- ✅ El formulario no se envía

---

## 📊 Resumen de Verificación

### **Checklist Final:**

- [ ] ✅ Pagos manuales (cash) se crean como `confirmed` automáticamente
- [ ] ✅ Pagos de transferencia se crean como `pending` (requieren confirmación)
- [ ] ✅ Pagos QR se crean como `pending` con `provider: 'mercadopago'`
- [ ] ✅ Pagos Mercado Pago se crean correctamente
- [ ] ✅ Los métodos de pago se muestran en español
- [ ] ✅ Los providers se muestran correctamente
- [ ] ✅ El listado muestra Estado, Método y Monto claramente
- [ ] ✅ El botón "Confirmar" funciona para pagos `pending`
- [ ] ✅ Los pagos confirmados no muestran el botón "Confirmar"
- [ ] ✅ El balance se actualiza correctamente
- [ ] ✅ La venta cambia a `paid` cuando el balance llega a 0
- [ ] ✅ Los pagos antiguos siguen funcionando

---

## 🔍 Verificación Técnica (Opcional)

### **Inspeccionar Red (Network Tab)**

1. Abrir DevTools (F12) → Tab **Network**
2. Crear un pago manual
3. Verificar la petición `POST /api/sales/:id/payments`:

**Request Body Esperado:**
```json
{
  "amount": 1000,
  "method": "cash",
  "reference": "Pago en efectivo"
}
```

**Response Esperado:**
```json
{
  "id": "uuid",
  "sale_id": "uuid",
  "amount": "1000",
  "status": "confirmed",
  "method": "cash",
  "provider": "manual",
  "reference": "Pago en efectivo",
  "metadata": null,
  "confirmed_by": null,
  "confirmed_at": "2024-12-01T10:00:00Z",
  "created_at": "2024-12-01T10:00:00Z"
}
```

---

### **Confirmar Pago (Network Tab)**

1. Confirmar un pago pendiente
2. Verificar la petición `PATCH /api/payments/:id/confirm`:

**Request Esperado:**
```http
PATCH /api/payments/:id/confirm
Content-Type: application/json
```

**Response Esperado:**
```json
{
  "id": "uuid",
  "status": "confirmed",
  "confirmed_by": "user-uuid",
  "confirmed_at": "2024-12-01T10:30:00Z",
  "metadata": {}
}
```

---

## 📝 Notas

- **Provider Automático:** El backend determina automáticamente el `provider` según el `method`:
  - `cash` | `other` → `provider: "manual"`
  - `transfer` → `provider: "banco"`
  - `mp_point` | `qr` → `provider: "mercadopago"`
  - `card` → `provider: "pos"`

- **Status Automático:** El backend determina automáticamente el `status` según el `provider`:
  - `provider: "manual"` → `status: "confirmed"`
  - `provider: "mercadopago" | "banco" | "pos"` → `status: "pending"`

- **Confirmación Manual:** Solo los pagos con `status: "pending"` pueden ser confirmados manualmente mediante el botón "Confirmar".

---

**¡Listo para probar!** 🚀

