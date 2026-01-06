# 🧪 Guía de Pruebas - Sistema de Pagos desde la Interfaz Real

Esta guía explica cómo probar todas las implementaciones de los sprints FE-1 a FE-5 directamente desde la interfaz real de la aplicación.

---

## 📍 Ruta Principal de Pruebas

**Página de Detalle de Venta:** `/admin/sales/[id]`

Esta es la página donde se encuentran todas las funcionalidades de pagos implementadas.

---

## 🎯 Flujo Completo de Pruebas

### Paso 1: Crear una Venta

1. **Ir a Ventas** → `/admin/sales`
2. **Crear Nueva Venta** → Click en "Nueva Venta"
3. **Agregar Productos** al carrito
4. **Confirmar la Venta** → Esto cambia el estado de `draft` a `confirmed`
5. **Anotar el ID de la venta** (aparece en la URL: `/admin/sales/[id]`)

**✅ Verificaciones:**
- La venta debe estar en estado `confirmed`
- Debe aparecer el resumen financiero con `totalAmount`, `paidAmount`, `balanceAmount`
- Debe aparecer la sección de "Pagos" con botones para crear pagos

---

### Paso 2: Probar Pagos Manuales (Sprint FE-2)

#### 2.1 Crear Pago Manual

1. En la página de detalle de venta (`/admin/sales/[id]`)
2. Click en **"Pago Manual"** (botón azul)
3. En el modal:
   - Seleccionar método de pago (debe aparecer efectivo/transferencia)
   - Ingresar monto
   - (Opcional) Agregar referencia
4. Click en **"Registrar Pago"**

**✅ Verificaciones:**
- El pago aparece en la lista con estado `confirmed`
- El resumen financiero se actualiza automáticamente
- `paidAmount` aumenta
- `balanceAmount` disminuye
- Si `balanceAmount <= 0`, la venta cambia a estado `paid`

#### 2.2 Eliminar Pago Pendiente

1. Crear un pago manual (se crea como `confirmed`, no se puede eliminar)
2. Para probar eliminación, crear un pago QR primero (ver Paso 3)
3. El pago QR queda `pending` y se puede eliminar

**✅ Verificaciones:**
- Solo pagos `pending` muestran botón "Eliminar"
- Al eliminar, el resumen financiero se actualiza

#### 2.3 Probar Idempotencia

1. Crear un pago manual
2. Intentar crear el mismo pago nuevamente (mismo monto, mismo método)
3. Debe manejar correctamente la duplicación

**✅ Verificaciones:**
- No debe crear pagos duplicados
- Debe mostrar mensaje apropiado o simplemente no crear el duplicado

---

### Paso 3: Probar Pagos QR (Sprint FE-3)

#### 3.1 Crear Pago QR

1. En la página de detalle de venta
2. Click en **"Pago QR"** (botón amarillo)
3. En el modal:
   - **Seleccionar método de pago QR** (debe aparecer métodos con `type: 'qr'` o `category: 'qr'`)
   - Ingresar monto
   - (Opcional) Agregar referencia
4. Click en **"Crear Pago QR"**

**✅ Verificaciones:**
- El pago se crea con estado `pending`
- Aparece vista con QR/referencia generada
- **Se muestra código QR** si el backend devuelve `gateway_metadata.qr_code`
- Se muestra referencia y external_reference

**⚠️ Importante - Para que aparezca el QR:**
- El método seleccionado debe tener `type: 'qr'` o `category: 'qr'`
- El backend debe generar el QR y devolverlo en `gateway_metadata.qr_code`
- Ver documentación completa en `CONFIGURACION_METODOS_PAGO_QR.md`

#### 3.2 Confirmar Pago QR

1. Después de crear el pago QR
2. En la lista de pagos, buscar el pago `pending`
3. Click en **"Confirmar"** (botón verde)
4. Confirmar la acción

**✅ Verificaciones:**
- El pago cambia de `pending` a `confirmed`
- El resumen financiero se actualiza
- El botón "Confirmar" desaparece
- Si el balance llega a 0, la venta cambia a `paid`

---

### Paso 4: Probar Mercado Pago (Sprint FE-4)

#### 4.1 Crear Pago Mercado Pago

1. En la página de detalle de venta
2. Click en **"Mercado Pago"** (botón morado)
3. En el modal:
   - Seleccionar método Mercado Pago (debe aparecer métodos MP)
   - Ingresar monto
4. Click en **"Crear Pago MP"**

**✅ Verificaciones:**
- El pago se crea con estado `pending`
- Aparece vista "Esperando Confirmación"
- Se muestra botón "Abrir Checkout de Mercado Pago" si hay `init_point`
- Se inicia polling automático (cada 10 segundos)

#### 4.2 Probar Polling Automático

1. Después de crear el pago MP
2. El sistema debe verificar automáticamente cada 10 segundos
3. Si el pago se confirma en MP, debe actualizarse automáticamente

**✅ Verificaciones:**
- Contador de polling visible (ej: "Verificando estado... (5/60)")
- El estado cambia automáticamente cuando MP confirma
- Se muestra mensaje de éxito cuando se confirma
- El modal se cierra automáticamente después de confirmar

#### 4.3 Probar Timeout y Fallback Manual

1. Esperar a que el polling llegue al máximo (60 intentos = 10 minutos)
2. O simular timeout cambiando el código temporalmente
3. Debe aparecer mensaje de timeout
4. Click en **"Verificar Manualmente"**

**✅ Verificaciones:**
- Mensaje de timeout aparece correctamente
- Botón de verificación manual funciona
- Puede refrescar el estado manualmente

---

### Paso 5: Probar Timeline y Auditoría (Sprint FE-5)

#### 5.1 Ver Timeline de Pagos

1. En la página de detalle de venta
2. En la sección de Pagos, click en **"Ver Timeline"**
3. Ver la vista cronológica de pagos

**✅ Verificaciones:**
- Los pagos aparecen ordenados (más recientes primero)
- Cada pago muestra:
  - Icono de estado con color
  - Monto formateado
  - Método de pago
  - Referencia y external_reference
  - Fecha de creación
  - `last_webhook` si está disponible
- Líneas conectoras entre pagos

#### 5.2 Ver Información de Auditoría

1. En el timeline o lista de pagos
2. Verificar que se muestre:
   - `last_webhook` con fecha formateada
   - `external_reference` con link si hay `init_point`
   - Metadata técnica expandible (si está disponible)

**✅ Verificaciones:**
- Toda la información de auditoría es visible
- Los links funcionan correctamente
- Las fechas están bien formateadas

#### 5.3 Probar Estados Especiales

1. Crear pagos con diferentes estados:
   - `confirmed` (verde)
   - `pending` (amarillo)
   - `failed` (rojo) - simular desde backend
   - `refunded` (gris) - simular desde backend

**✅ Verificaciones:**
- Cada estado tiene su color e icono correcto
- Los mensajes de estado se muestran correctamente
- Los botones de acción aparecen según el estado

---

### Paso 6: Probar Bloqueos Visuales (Sprint FE-5)

#### 6.1 Venta Completamente Pagada

1. Crear pagos hasta que `balanceAmount <= 0`
2. La venta debe cambiar automáticamente a estado `paid`

**✅ Verificaciones:**
- Aparece bloqueo visual verde "Venta Completamente Pagada"
- Los botones de crear pago desaparecen
- No se puede cancelar la venta
- Se muestra fecha de completado si está disponible

---

## 🔍 Verificaciones de Componentes Específicos

### SaleFinancialCard
- ✅ Muestra total, pagado, saldo correctamente
- ✅ Colores cambian según estado (verde si pagado, amarillo si pendiente)
- ✅ Muestra fecha de completado si está disponible
- ✅ Formato de moneda correcto (ARS)

### Helpers de Validación
- ✅ `canPaySale()`: Solo permite crear pagos en ventas `confirmed` o `paid`
- ✅ `canDeletePayment()`: Solo permite eliminar pagos `pending`
- ✅ `canConfirmPayment()`: Solo permite confirmar pagos `pending`

### Mapeos de Estados
- ✅ Colores correctos para cada estado
- ✅ Labels en español correctos
- ✅ Iconos apropiados para cada estado

---

## 🐛 Problemas Comunes y Soluciones

### Los métodos de pago no aparecen en los selects

**Causa:** Los métodos de pago en el backend no tienen `category` configurada o el filtro es muy estricto.

**Solución:** Los filtros ahora son más flexibles:
- **Pago Manual**: Busca `category: 'manual'` O `type: 'cash'/'transfer'`
- **Pago QR**: Busca `category: 'qr'` O `type: 'qr'`
- **Mercado Pago**: Busca `category: 'gateway'` Y código que contenga 'mercadopago'/'mp'

**Verificar en backend:**
- Los métodos de pago deben tener `is_active: true`
- Deben tener `type` o `category` configurado correctamente

### El polling no funciona

**Causa:** El endpoint de pagos no está devolviendo el estado actualizado.

**Solución:** Verificar que `GET /api/sales/:id/payments` devuelve el estado actualizado del pago.

### Los estados no se actualizan automáticamente

**Causa:** El refresco automático no se está ejecutando.

**Solución:** Verificar que `onSuccess()` está llamando a `loadPayments()` y `loadSale()`.

---

## 📋 Checklist de Pruebas Completas

### Sprint FE-1 - Fundaciones
- [ ] Tipos compartidos funcionan correctamente
- [ ] Helpers de validación funcionan
- [ ] SaleFinancialCard se muestra correctamente
- [ ] Mapeos de estados funcionan
- [ ] Manejo de errores muestra mensajes apropiados

### Sprint FE-2 - Pagos Manuales
- [ ] Modal de pago manual se abre
- [ ] Métodos manuales aparecen en el select
- [ ] Se puede crear pago manual
- [ ] El pago se crea con `status: 'confirmed'`
- [ ] El resumen financiero se actualiza
- [ ] Se puede eliminar pago `pending`
- [ ] Idempotencia funciona correctamente

### Sprint FE-3 - Pagos QR
- [ ] Modal de pago QR se abre
- [ ] Métodos QR aparecen en el select
- [ ] Se puede crear pago QR
- [ ] El pago se crea con `status: 'pending'`
- [ ] Se muestra QR/referencia después de crear
- [ ] Se puede confirmar pago QR manualmente
- [ ] El estado cambia correctamente

### Sprint FE-4 - Mercado Pago
- [ ] Modal de Mercado Pago se abre
- [ ] Métodos MP aparecen en el select
- [ ] Se puede crear pago MP
- [ ] Se muestra vista "Esperando Confirmación"
- [ ] Polling automático funciona
- [ ] Se puede abrir checkout de MP
- [ ] Timeout y fallback manual funcionan

### Sprint FE-5 - Auditoría
- [ ] Timeline de pagos se muestra correctamente
- [ ] `last_webhook` se muestra con fecha
- [ ] `external_reference` se muestra con links
- [ ] Estados `failed` y `refunded` se muestran correctamente
- [ ] Bloqueos visuales para ventas `paid` funcionan

---

## 🎯 Próximos Pasos

Después de probar todas las funcionalidades:

1. **Verificar integración con backend** - Asegurarse de que todos los endpoints funcionan
2. **Probar casos edge** - Pagos muy grandes, múltiples pagos, etc.
3. **Probar en diferentes navegadores** - Chrome, Firefox, Safari, Edge
4. **Probar responsividad** - En móviles y tablets
5. **Documentar bugs encontrados** - Crear issues si es necesario

---

**Última actualización:** Diciembre 2024

