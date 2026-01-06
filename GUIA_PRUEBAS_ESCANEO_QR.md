# 📱 Guía de Pruebas: Escaneo QR Interoperable

## 🎯 Objetivo

Verificar que el QR generado sea escaneable por todas las billeteras digitales argentinas.

---

## ✅ Pre-requisitos

1. ✅ Campo 52 corregido en el backend
2. ✅ Payload EMV válido generado
3. ✅ QR generado con calidad adecuada (400x400px mínimo)

---

## 🧪 Paso 1: Verificar Payload EMV

### Desde el Frontend

1. Crear un nuevo pago QR
2. Ejecutar en la consola del navegador:

```javascript
diagnosticoCompletoQR()
```

### Resultado Esperado

```
✅ VERIFICACIÓN DE CAMPOS REQUERIDOS:
   ✅ 00 - Payload Format Indicator: ✅
   ✅ 01 - Point of Initiation Method: ✅
   ✅ 52 - Merchant Category Code: ✅
   ✅ 53 - Transaction Currency: ✅
   ✅ 54 - Transaction Amount: ✅
   ✅ 58 - Country Code: ✅
   ✅ 59 - Merchant Name: ✅
   ✅ 60 - Merchant City: ✅
   ✅ 63 - CRC: ✅

📊 DIAGNÓSTICO FINAL:
   ✅ El payload EMV parece estar correcto.
```

### Verificar Campo 52 Específicamente

```javascript
analizarUltimoQR()
```

**Resultado esperado:**
```
📋 Campo 52 (posición 65):
   ID: "52"
   Longitud (string): "04" ✅
   Longitud (número): 4 ✅
   Valor: "5492" ✅

💡 DIAGNÓSTICO:
   ✅ El campo 52 está correcto
```

---

## 📱 Paso 2: Probar Escaneo con Billeteras

### Billetera 1: MODO

1. **Abrir app MODO**
2. **Ir a "Pagar con QR" o "Escanear QR"**
3. **Escanear el QR mostrado en el frontend**
4. **Verificar:**
   - ✅ El QR se escanea correctamente
   - ✅ Aparece el monto correcto
   - ✅ Aparece el nombre del comercio ("Toludev shop")
   - ✅ Se puede proceder con el pago
   - ❌ NO aparece mensaje de error

**Resultado esperado:**
- Pantalla de confirmación de pago
- Monto visible
- Nombre del comercio visible
- Botón para confirmar pago

---

### Billetera 2: Naranja X

1. **Abrir app Naranja X**
2. **Ir a "Pagar" o "Escanear QR"**
3. **Escanear el QR**
4. **Verificar:**
   - ✅ El QR se escanea correctamente
   - ✅ Aparece el monto correcto
   - ✅ Aparece el nombre del comercio
   - ✅ Se puede proceder con el pago

**Resultado esperado:**
- Pantalla de confirmación de pago
- Monto visible
- Nombre del comercio visible

---

### Billetera 3: Mercado Pago

1. **Abrir app Mercado Pago**
2. **Ir a "Pagar" o "Escanear QR"**
3. **Escanear el QR**
4. **Verificar:**
   - ✅ El QR se escanea correctamente
   - ✅ Aparece el monto correcto
   - ✅ Aparece el nombre del comercio
   - ✅ Se puede proceder con el pago

**Resultado esperado:**
- Pantalla de confirmación de pago
- Monto visible
- Nombre del comercio visible

---

### Billetera 4: Ualá

1. **Abrir app Ualá**
2. **Ir a "Pagar" o "Escanear QR"**
3. **Escanear el QR**
4. **Verificar:**
   - ✅ El QR se escanea correctamente
   - ✅ Aparece el monto correcto
   - ✅ Aparece el nombre del comercio
   - ✅ Se puede proceder con el pago

**Resultado esperado:**
- Pantalla de confirmación de pago
- Monto visible
- Nombre del comercio visible

---

## 🔍 Paso 3: Verificar Información Mostrada

Al escanear el QR, las billeteras deberían mostrar:

### Información Requerida

- ✅ **Monto:** Debe coincidir con el monto del pago
- ✅ **Comercio:** "Toludev shop" (o el nombre configurado)
- ✅ **Ciudad:** "Argentina" (o la ciudad configurada)
- ✅ **Referencia:** Opcional, pero puede aparecer

### Información NO Requerida (pero puede aparecer)

- CBU/CVU del comercio
- Categoría del comercio (Retail)
- Moneda (ARS)

---

## ❌ Problemas Comunes y Soluciones

### Problema 1: "No se puede leer este QR"

**Causas posibles:**
- Campo 52 aún con longitud incorrecta
- CRC incorrecto
- Formato del Merchant Account Information no compatible

**Solución:**
1. Ejecutar `diagnosticoCompletoQR()` y verificar todos los campos
2. Verificar que el campo 52 tenga longitud `04` y valor `5492`
3. Verificar que el CRC esté presente y tenga formato válido

---

### Problema 2: QR se escanea pero muestra información incorrecta

**Causas posibles:**
- Monto incorrecto en el payload
- Nombre del comercio incorrecto
- Ciudad incorrecta

**Solución:**
1. Verificar el campo 54 (Transaction Amount) en el diagnóstico
2. Verificar el campo 59 (Merchant Name)
3. Verificar el campo 60 (Merchant City)

---

### Problema 3: QR no se escanea (cámara no lo detecta)

**Causas posibles:**
- QR muy pequeño
- Calidad de imagen baja
- Contraste insuficiente

**Solución:**
1. Verificar que el QR se muestre a 400x400px mínimo
2. Verificar calidad de imagen (sin compresión excesiva)
3. Verificar contraste (negro sobre blanco)

---

## 📊 Checklist de Pruebas

### Verificación Técnica
- [ ] Campo 52 tiene longitud `04` y valor `5492`
- [ ] Todos los campos EMV presentes
- [ ] CRC presente y formato válido
- [ ] QR generado a 400x400px mínimo
- [ ] Imagen QR con buena calidad

### Pruebas de Escaneo
- [ ] MODO puede escanear el QR
- [ ] Naranja X puede escanear el QR
- [ ] Mercado Pago puede escanear el QR
- [ ] Ualá puede escanear el QR

### Verificación de Información
- [ ] Monto mostrado correctamente
- [ ] Nombre del comercio mostrado correctamente
- [ ] Ciudad mostrada correctamente
- [ ] Se puede proceder con el pago

---

## 🎯 Resultado Esperado Final

Con todas las pruebas pasadas:

✅ **El QR es escaneable por todas las billeteras**  
✅ **La información se muestra correctamente**  
✅ **Se puede proceder con el pago**  
✅ **El sistema está listo para producción**

---

**Última actualización:** Diciembre 2024  
**Estado:** ✅ Campo 52 corregido - Listo para pruebas de escaneo

