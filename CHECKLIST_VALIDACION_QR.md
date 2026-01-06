# ✅ Checklist de Validación - Pagos QR

## 🎯 Casos que DEBEN probar antes de cerrar el sprint

---

## ✅ Caso 1: Crear Pago QR

### Pasos:
1. Ir a `/admin/sales/[id]` (venta confirmada)
2. Click en **"Pago QR"**
3. Seleccionar método QR del select
4. Ingresar monto
5. Click en **"Crear Pago QR"**

### Verificaciones:
- [ ] El pago se crea exitosamente
- [ ] **El QR aparece inmediatamente** en el modal
- [ ] El QR es renderizable (se ve la imagen)
- [ ] El estado es `pending`
- [ ] Se muestra referencia si existe
- [ ] Se muestra external_reference si existe

### Resultado Esperado:
```
✅ Pago creado con status: pending
✅ gateway_metadata.qr_code contiene URL o data URL
✅ QR visible en el modal
```

---

## ✅ Caso 2: Recargar Página

### Pasos:
1. Crear un pago QR (caso 1)
2. Cerrar el modal
3. **Recargar la página** (F5)
4. Ver la lista de pagos

### Verificaciones:
- [ ] El pago QR aparece en la lista
- [ ] **El QR sigue visible** en la lista (si está pending)
- [ ] El estado sigue siendo `pending`
- [ ] El resumen financiero es correcto

### Resultado Esperado:
```
✅ Pago persiste después de recargar
✅ QR visible en lista de pagos (si pending)
✅ Resumen financiero actualizado
```

---

## ✅ Caso 3: Confirmar Pago desde Backend/Webhook

### Pasos:
1. Crear un pago QR
2. Simular confirmación desde backend (cambiar status a `confirmed`)
3. O esperar webhook real si está configurado
4. Verificar actualización automática

### Verificaciones:
- [ ] **El polling detecta el cambio** (cada 5 segundos)
- [ ] **El QR desaparece** cuando pasa a `confirmed`
- [ ] Se muestra mensaje "Pago confirmado"
- [ ] El resumen financiero se actualiza automáticamente
- [ ] El modal se cierra automáticamente después de confirmar

### Resultado Esperado:
```
✅ Polling funciona correctamente
✅ UI se actualiza automáticamente
✅ QR oculto cuando confirmed
✅ Resumen financiero actualizado
```

---

## ✅ Caso 4: Venta con Múltiples Pagos

### Pasos:
1. Crear una venta
2. Crear múltiples pagos QR
3. Crear pagos manuales también
4. Verificar que todo funciona correctamente

### Verificaciones:
- [ ] **Múltiples QR no rompen** el resumen financiero
- [ ] Cada QR se muestra correctamente
- [ ] El timeline muestra todos los pagos
- [ ] El resumen financiero suma correctamente
- [ ] No hay errores en consola

### Resultado Esperado:
```
✅ Múltiples pagos QR funcionan
✅ Resumen financiero correcto
✅ Timeline muestra todo
✅ Sin errores
```

---

## ✅ Caso 5: Método QR Genérico

### Pasos:
1. Crear un método de pago QR genérico (sin Mercado Pago)
2. Crear un pago con ese método
3. Verificar que funciona

### Verificaciones:
- [ ] El método aparece en el select
- [ ] Se puede crear el pago
- [ ] **El QR se muestra** (backend debe generar QR genérico)
- [ ] Funciona sin configuración de Mercado Pago

### Resultado Esperado:
```
✅ Método QR genérico funciona
✅ QR visible
✅ No requiere Mercado Pago
```

---

## ✅ Caso 6: Expiración del QR

### Pasos:
1. Crear un pago QR con `expires_at` en el futuro cercano
2. Verificar countdown
3. Esperar a que expire
4. Verificar comportamiento

### Verificaciones:
- [ ] **Countdown se muestra** si existe `expires_at`
- [ ] El countdown cuenta hacia atrás correctamente
- [ ] **Cuando expira, se muestra "QR Expirado"**
- [ ] El QR se deshabilita visualmente cuando expira
- [ ] El polling se detiene cuando expira

### Resultado Esperado:
```
✅ Countdown visible si expires_at existe
✅ Expiración detectada correctamente
✅ UI actualizada cuando expira
```

---

## ✅ Caso 7: Estados Visuales

### Verificaciones:
- [ ] **Pending**: Muestra QR + "Esperando pago"
- [ ] **Confirmed**: Muestra "Pago confirmado" (sin QR)
- [ ] **Failed**: Muestra error (sin QR)
- [ ] **Refunded**: Muestra badge (sin QR)

### Resultado Esperado:
```
✅ QR solo visible cuando pending
✅ Estados visuales correctos
✅ Colores e iconos apropiados
```

---

## ✅ Caso 8: Polling Automático

### Verificaciones:
- [ ] Polling inicia automáticamente cuando se crea pago QR
- [ ] Polling verifica cada 5 segundos
- [ ] Polling se detiene cuando el pago se confirma
- [ ] Polling se detiene cuando el pago falla
- [ ] Polling se detiene cuando el QR expira
- [ ] No hay memory leaks (polling se limpia correctamente)

### Resultado Esperado:
```
✅ Polling automático funciona
✅ Se detiene correctamente
✅ Sin memory leaks
```

---

## ✅ Caso 9: Confirmación Manual

### Pasos:
1. Crear un pago QR
2. Click en **"Confirmar"** en la lista de pagos
3. Verificar actualización

### Verificaciones:
- [ ] Botón "Confirmar" aparece solo para pagos `pending`
- [ ] Al confirmar, el estado cambia a `confirmed`
- [ ] El QR desaparece después de confirmar
- [ ] El resumen financiero se actualiza

### Resultado Esperado:
```
✅ Confirmación manual funciona
✅ Estado actualizado
✅ QR oculto después de confirmar
```

---

## ✅ Caso 10: Verificación Manual (Refresh)

### Pasos:
1. Crear un pago QR
2. Click en **"Verificar Estado"** en el modal
3. Verificar que refresca correctamente

### Verificaciones:
- [ ] Botón "Verificar Estado" funciona
- [ ] Refresca el estado del pago
- [ ] Detecta cambios de estado correctamente
- [ ] Muestra mensaje apropiado según el estado

### Resultado Esperado:
```
✅ Verificación manual funciona
✅ Estado refrescado correctamente
```

---

## 🐛 Problemas Comunes a Verificar

### ❌ QR no aparece
- [ ] Verificar que `gateway_metadata.qr_code` existe en la respuesta
- [ ] Verificar que el pago está en estado `pending`
- [ ] Verificar que la URL/data URL es válida

### ❌ Polling no funciona
- [ ] Verificar que el polling se inicia al crear el pago
- [ ] Verificar que el endpoint `/api/sales/:id/payments` funciona
- [ ] Verificar que no hay errores en consola

### ❌ Countdown no funciona
- [ ] Verificar que `gateway_metadata.expires_at` existe
- [ ] Verificar formato de fecha (ISO 8601)
- [ ] Verificar que el countdown se actualiza cada segundo

### ❌ QR no desaparece cuando se confirma
- [ ] Verificar que el componente verifica `payment.status === 'pending'`
- [ ] Verificar que el polling detecta el cambio de estado
- [ ] Verificar que el componente se re-renderiza cuando cambia el estado

---

## 📋 Checklist Final

Antes de dar por cerrado el sprint, verificar:

- [ ] Todos los casos de prueba pasan
- [ ] QR se muestra correctamente
- [ ] QR desaparece cuando se confirma
- [ ] Polling funciona automáticamente
- [ ] Countdown funciona si existe expiración
- [ ] Múltiples pagos QR funcionan
- [ ] Método QR genérico funciona
- [ ] Estados visuales correctos
- [ ] Sin errores en consola
- [ ] Sin memory leaks (polling se limpia)

---

**Última actualización:** Diciembre 2024

