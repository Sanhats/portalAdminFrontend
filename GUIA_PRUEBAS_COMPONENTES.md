# 🧪 Guía de Pruebas - Componentes de Pagos

**Ruta de Pruebas:** `/admin/test/payments`

---

## 📋 Descripción

Esta página permite probar todos los componentes y funcionalidades implementadas en los sprints FE-1 a FE-5 sin necesidad de datos reales del backend.

---

## 🎯 Componentes que se Pueden Probar

### 1. **Controles de Estado**
- Cambiar el estado de la venta (draft, confirmed, paid, cancelled)
- Ver cómo afecta a los helpers de validación
- Ver los colores y labels de cada estado

### 2. **SaleFinancialCard**
- Ver el componente con estado pendiente
- Ver el componente con estado pagado
- Comparar ambos estados visualmente

### 3. **Modales de Pago**
- Modal de Pago Manual (simulado)
- Modal de Pago QR (simulado)
- Modal de Mercado Pago (simulado)

**Nota:** Los modales están en modo de demostración. Para probarlos con datos reales, usa la página de detalle de venta (`/admin/sales/[id]`).

### 4. **Helpers de Validación**
- `canPaySale()`: Verifica si se puede crear un pago
- `canDeletePayment()`: Verifica si se puede eliminar un pago
- `canConfirmPayment()`: Verifica si se puede confirmar un pago

### 5. **Mapeos de Estados**
- Ver todos los estados de venta con sus colores y iconos
- Ver todos los estados de pago con sus colores y iconos

### 6. **Lista de Pagos**
- Ver pagos en formato de lista
- Ver diferentes estados: confirmed, pending, failed, refunded
- Ver referencias y external_reference
- Ver información de webhooks
- Ver botones de acción según el estado

### 7. **Timeline de Pagos**
- Ver pagos en formato timeline
- Ver orden cronológico (más recientes primero)
- Ver iconos y colores de estado
- Ver información completa de cada pago

---

## 🔍 Datos de Ejemplo Incluidos

### Ventas
- **Venta Pendiente**: Total $50,000, Pagado $30,000, Saldo $20,000
- **Venta Pagada**: Total $50,000, Pagado $50,000, Saldo $0

### Pagos de Ejemplo
1. **Pago Confirmado** (Efectivo)
   - Monto: $20,000
   - Estado: confirmed
   - Referencia: TRF-123456
   - Creado hace 1 día

2. **Pago Pendiente** (QR)
   - Monto: $10,000
   - Estado: pending
   - Referencia: QR-789012
   - External Reference: MP-345678
   - QR Code disponible
   - Creado hace 1 hora

3. **Pago Pendiente** (Mercado Pago)
   - Monto: $15,000
   - Estado: pending
   - External Reference: MP-999888
   - Init Point disponible
   - Último webhook hace 30 min
   - Creado hace 30 min

4. **Pago Fallido** (Mercado Pago)
   - Monto: $5,000
   - Estado: failed
   - External Reference: MP-777666
   - Último webhook hace 2 horas
   - Creado hace 2 horas

---

## ✅ Checklist de Pruebas

### Pruebas Visuales
- [ ] Verificar que todos los estados de venta se muestran correctamente
- [ ] Verificar que todos los estados de pago se muestran correctamente
- [ ] Verificar colores y iconos de estados
- [ ] Verificar que SaleFinancialCard muestra datos correctos
- [ ] Verificar que Timeline muestra pagos ordenados correctamente
- [ ] Verificar que los helpers muestran resultados correctos

### Pruebas de Interacción
- [ ] Cambiar estado de venta y ver cómo afecta a los helpers
- [ ] Abrir modales (aunque sean simulados)
- [ ] Verificar que los botones de acción aparecen según el estado
- [ ] Verificar que los mensajes de estado se muestran correctamente

### Pruebas de Datos
- [ ] Verificar que las referencias se muestran correctamente
- [ ] Verificar que external_reference se muestra con links
- [ ] Verificar que last_webhook se muestra con fecha formateada
- [ ] Verificar que los montos se formatean correctamente
- [ ] Verificar que las fechas se formatean correctamente

---

## 🚀 Próximos Pasos

Después de probar los componentes aquí, puedes:

1. **Probar con datos reales** en `/admin/sales/[id]`
2. **Crear una venta real** y probar los flujos completos
3. **Probar integración con backend** usando los endpoints reales

---

## 📝 Notas

- Esta página es solo para pruebas visuales y de componentes
- No realiza llamadas reales al backend
- Los modales están simulados para evitar errores
- Para pruebas completas, usa la página de detalle de venta real

---

**Última actualización:** Diciembre 2024

