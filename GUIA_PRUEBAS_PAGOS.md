# 🧪 Guía de Pruebas - Sistema de Pagos

Esta guía te ayudará a probar todas las funcionalidades del sistema de pagos implementadas.

---

## 📋 Pre-requisitos

### 1. Verificar que el Backend esté corriendo

El backend debe estar ejecutándose en:
- **Desarrollo**: `http://localhost:3000/api`
- **Producción**: La URL configurada en `.env.local`

### 2. Configurar Variables de Entorno

Crea o verifica el archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

**Nota**: Si el backend está en producción, usa la URL correspondiente.

### 3. Instalar Dependencias (si es necesario)

```bash
npm install
```

---

## 🚀 Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

El frontend estará disponible en: **http://localhost:3001** (o el puerto que Next.js asigne)

---

## ✅ Checklist de Pruebas

### 1. Autenticación

#### Paso 1.1: Iniciar Sesión
1. Abre http://localhost:3001/login
2. Ingresa tus credenciales de administrador
3. Verifica que te redirija a `/admin`

**✅ Verificación:**
- [ ] El login funciona correctamente
- [ ] Se guarda el token en `localStorage` (ver DevTools → Application → Local Storage)
- [ ] No hay errores en la consola

---

### 2. Métodos de Pago Configurables

#### Paso 2.1: Verificar que se cargan métodos de pago
1. Ve a `/admin/sales` (Ventas)
2. Crea una nueva venta o abre una venta existente en estado `confirmed`
3. Abre la consola del navegador (F12 → Console)

**✅ Verificación:**
- [ ] No hay errores al cargar métodos de pago
- [ ] Los métodos de pago se cargan automáticamente
- [ ] Aparecen en el selector al crear un pago

#### Paso 2.2: Probar GET /api/payment-methods (Opcional - desde consola)

Abre la consola del navegador y ejecuta:

```javascript
// Obtener token
const token = localStorage.getItem('access_token');

// Probar obtener métodos de pago
fetch('http://localhost:3001/api/proxy/payment-methods?isActive=true', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(r => r.json())
  .then(data => console.log('Métodos de pago:', data));
```

**✅ Verificación:**
- [ ] La respuesta incluye un array de métodos
- [ ] Cada método tiene: `id`, `label`, `code`, `type`, `is_active`

---

### 3. Crear y Confirmar una Venta

#### Paso 3.1: Crear una Venta (Draft)
1. Ve a `/admin/sales/new`
2. Busca y agrega productos
3. Completa el formulario:
   - Método de pago (opcional en draft)
   - Notas (opcional)
4. Haz clic en "Guardar como Borrador"

**✅ Verificación:**
- [ ] La venta se crea exitosamente
- [ ] Se redirige a la página de detalle de la venta
- [ ] El estado es `draft`
- [ ] El stock NO se descuenta (verificar en productos)

#### Paso 3.2: Confirmar la Venta
1. En la página de detalle de la venta (estado `draft`)
2. Haz clic en "Confirmar Venta"
3. Confirma la acción en el diálogo

**✅ Verificación:**
- [ ] La venta cambia a estado `confirmed`
- [ ] El stock se descuenta (verificar en productos)
- [ ] Aparece la sección "Pagos" en la página
- [ ] Aparece el botón "Registrar Pago"

---

### 4. Resumen Financiero

#### Paso 4.1: Verificar Resumen Financiero
1. Abre una venta en estado `confirmed` o `paid`
2. Revisa la sección "Resumen Financiero"

**✅ Verificación:**
- [ ] Muestra `Total` (totalAmount del backend)
- [ ] Muestra `Pagado` (paidAmount del backend)
- [ ] Muestra `Saldo` (balanceAmount del backend)
- [ ] Muestra `Estado de pago` (isPaid del backend)
- [ ] **NO recalcula** estos valores en el frontend
- [ ] Los valores coinciden con los del backend

#### Paso 4.2: Verificar que usa valores del Backend
1. Abre DevTools → Network
2. Filtra por "sales"
3. Abre una venta y revisa la respuesta del GET `/api/sales/:id`

**✅ Verificación:**
- [ ] La respuesta incluye el campo `financial`
- [ ] Los valores mostrados en la UI coinciden con `financial` del backend
- [ ] No hay cálculos en el frontend (buscar `reduce`, `sum`, etc. en el código)

---

### 5. Crear Pagos

#### Paso 5.1: Registrar un Pago
1. Abre una venta en estado `confirmed`
2. Haz clic en "Registrar Pago"
3. Completa el formulario:
   - **Método de Pago**: Selecciona un método de la lista
   - **Monto**: Ingresa un monto (ej: 10000)
   - **Referencia** (opcional): Número de transferencia, comprobante, etc.
4. Haz clic en "Registrar Pago"

**✅ Verificación:**
- [ ] El pago se crea exitosamente
- [ ] Aparece en la lista de pagos
- [ ] El resumen financiero se actualiza automáticamente
- [ ] El `paidAmount` aumenta
- [ ] El `balanceAmount` disminuye
- [ ] Si `balanceAmount <= 0`, la venta cambia a estado `paid`

#### Paso 5.2: Verificar Estados de Pago
1. Revisa la lista de pagos creados
2. Verifica los badges de estado

**✅ Verificación:**
- [ ] Los pagos muestran el estado correcto (badge de color)
- [ ] Los estados posibles son: `pending`, `confirmed`, `failed`, `refunded`
- [ ] Los pagos `confirmed` se cuentan en el total pagado
- [ ] Los pagos `pending` NO se cuentan en el total pagado

#### Paso 5.3: Probar con Diferentes Métodos de Pago
1. Registra varios pagos con diferentes métodos
2. Verifica que cada uno muestra el método correcto

**✅ Verificación:**
- [ ] Cada pago muestra el método de pago correcto
- [ ] Si el método tiene `payment_methods.label`, se muestra ese
- [ ] Si no, se muestra el `method` (backward compatibility)

---

### 6. Eliminar Pagos

#### Paso 6.1: Eliminar un Pago Pending
1. Crea un pago con estado `pending` (si es posible desde la UI)
2. O verifica que exista un pago `pending`
3. Haz clic en el botón de eliminar (🗑️)
4. Confirma la eliminación

**✅ Verificación:**
- [ ] El pago se elimina exitosamente
- [ ] Desaparece de la lista
- [ ] El resumen financiero se actualiza
- [ ] El `paidAmount` disminuye (si estaba confirmado)

#### Paso 6.2: Intentar Eliminar un Pago Confirmed
1. Intenta eliminar un pago con estado `confirmed`

**✅ Verificación:**
- [ ] El botón de eliminar NO aparece para pagos `confirmed`
- [ ] Si intentas eliminarlo por API, debería dar error 400

---

### 7. Validaciones de Estados

#### Paso 7.1: Intentar Crear Pago en Venta Draft
1. Abre una venta en estado `draft`
2. Verifica que NO aparece la sección de pagos

**✅ Verificación:**
- [ ] No se puede crear pagos en ventas `draft`
- [ ] La sección de pagos NO aparece
- [ ] Si intentas crear un pago por API, debería dar error 400

#### Paso 7.2: Intentar Crear Pago en Venta Paid
1. Abre una venta completamente pagada (`paid` o `balanceAmount <= 0`)
2. Verifica que NO aparece el botón "Registrar Pago"

**✅ Verificación:**
- [ ] El botón "Registrar Pago" NO aparece
- [ ] La sección de pagos muestra "No hay pagos" o la lista existente
- [ ] Si intentas crear un pago por API, debería dar error 400

#### Paso 7.3: Verificar Edición de Venta
1. Abre una venta en estado `draft`
2. Haz clic en "Editar"
3. Modifica método de pago o notas
4. Guarda los cambios

**✅ Verificación:**
- [ ] Solo se puede editar ventas en estado `draft`
- [ ] Los cambios se guardan correctamente
- [ ] No se puede editar ventas `confirmed` o `paid`

#### Paso 7.4: Verificar Cancelación de Venta
1. Abre una venta en estado `draft` o `confirmed`
2. Haz clic en "Cancelar Venta"
3. Confirma la acción

**✅ Verificación:**
- [ ] Se puede cancelar ventas `draft` o `confirmed`
- [ ] NO se puede cancelar ventas `paid`
- [ ] Si la venta estaba `confirmed`, el stock se revierte
- [ ] Si la venta estaba `draft`, no hay cambios en stock

---

### 8. Pruebas desde la Consola del Navegador

#### Paso 8.1: Probar API de Pagos directamente

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Obtener token
const token = localStorage.getItem('access_token');

// Obtener métodos de pago
fetch('http://localhost:3001/api/proxy/payment-methods?isActive=true', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(data => console.log('Métodos:', data));

// Obtener pagos de una venta (reemplaza SALE_ID)
const saleId = 'TU_SALE_ID_AQUI';
fetch(`http://localhost:3001/api/proxy/sales/${saleId}/payments`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(data => console.log('Pagos:', data));

// Crear un pago (reemplaza SALE_ID y PAYMENT_METHOD_ID)
fetch(`http://localhost:3001/api/proxy/sales/${saleId}/payments`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 5000,
    status: 'confirmed',
    paymentMethodId: 'PAYMENT_METHOD_ID_AQUI',
    reference: 'Pago de prueba desde consola'
  })
})
  .then(r => r.json())
  .then(data => console.log('Pago creado:', data));
```

---

## 🐛 Problemas Comunes y Soluciones

### ❌ Error: "API_URL no configurada"
**Causa**: Falta la variable de entorno `NEXT_PUBLIC_API_URL`

**Solución**: 
1. Crea `.env.local` en la raíz del proyecto
2. Agrega: `NEXT_PUBLIC_API_URL=http://localhost:3000/api`
3. Reinicia el servidor de desarrollo (`npm run dev`)

### ❌ Error: "No autorizado" o 401
**Causa**: Token expirado o no válido

**Solución**: 
1. Cierra sesión y vuelve a iniciar sesión
2. Verifica que el token esté en `localStorage`

### ❌ Error: "No se pueden registrar pagos en ventas draft"
**Causa**: Intentando crear un pago en una venta en estado `draft`

**Solución**: Confirma la venta primero (botón "Confirmar Venta")

### ❌ Error: "No se puede eliminar pago confirmed"
**Causa**: Intentando eliminar un pago que no está en estado `pending`

**Solución**: Solo se pueden eliminar pagos `pending`. Los pagos `confirmed` no se pueden eliminar.

### ❌ Los valores financieros no coinciden
**Causa**: El frontend está recalculando valores en lugar de usar los del backend

**Solución**: Verifica que estés usando `sale.financial.paidAmount` y `sale.financial.balanceAmount` directamente, sin cálculos.

### ❌ No aparecen métodos de pago
**Causa**: El backend no tiene métodos de pago creados o hay un error al cargarlos

**Solución**: 
1. Verifica que el backend tenga métodos de pago creados
2. Revisa la consola del navegador para ver errores
3. Prueba obtener métodos de pago directamente desde la consola

---

## 📊 Checklist Final

Antes de considerar las pruebas completas, verifica:

- [ ] ✅ Login funciona correctamente
- [ ] ✅ Se pueden crear ventas (draft)
- [ ] ✅ Se pueden confirmar ventas
- [ ] ✅ Se cargan métodos de pago automáticamente
- [ ] ✅ Se pueden crear pagos en ventas confirmed
- [ ] ✅ El resumen financiero muestra valores del backend
- [ ] ✅ Los pagos se muestran correctamente con su estado
- [ ] ✅ Se pueden eliminar pagos pending
- [ ] ✅ NO se pueden crear pagos en ventas draft
- [ ] ✅ NO se pueden crear pagos en ventas paid
- [ ] ✅ NO se pueden eliminar pagos confirmed
- [ ] ✅ La edición solo funciona en ventas draft
- [ ] ✅ La cancelación funciona correctamente
- [ ] ✅ El stock se descuenta al confirmar
- [ ] ✅ El stock se revierte al cancelar (si estaba confirmed)

---

## 🎯 Próximos Pasos

Si todas las pruebas pasan:

1. ✅ **Integración completa** - El sistema de pagos está funcionando
2. 📝 **Documentar** - Actualiza la documentación si es necesario
3. 🚀 **Deploy** - Prepara para producción

Si hay problemas:

1. 🔍 **Revisar logs** - Consola del navegador y terminal del backend
2. 🐛 **Reportar bugs** - Documenta los errores encontrados
3. 🔧 **Corregir** - Aplica las correcciones necesarias

---

**Última actualización**: Diciembre 2024

