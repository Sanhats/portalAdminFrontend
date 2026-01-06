# 🧪 Guía de Verificación: Terminal ID Fijo

**Fecha**: 4 de enero de 2026  
**Objetivo**: Verificar que el backend aplicó correctamente la corrección del Terminal ID

---

## 📋 Qué Vamos a Verificar

El backend reporta que aplicó esta corrección:

```typescript
// ✅ CORRECCIÓN APLICADA EN BACKEND:
const terminalId = "TERMINAL01"; // FIJO
const accountInfo = 
  "00" + padLength("AR", 2) +
  "01" + padLength(normalizedCBU, 2) +
  "02" + padLength(terminalId, 2); // FIJO (antes era normalizedReference)
```

Vamos a verificar que:
1. ✅ El campo 26, subcampo 02 contenga `"TERMINAL01"`
2. ✅ El campo 26, subcampo 02 NO contenga `"SALE-"` (referencia variable)
3. ✅ El campo 62 contenga la referencia `"SALE-XXXXX"` (correcto)

---

## 🚀 Pasos para Verificar

### Paso 1: Preparar el Entorno

1. Asegúrate de que el **servidor esté corriendo**:
   ```bash
   npm run dev
   ```

2. Abre el navegador y navega a:
   ```
   http://localhost:3000/admin/sales/[id]
   ```
   (Reemplaza `[id]` con el ID de una venta existente)

3. Abre la **consola del navegador** (F12)

### Paso 2: Ejecutar el Script de Verificación

En la consola del navegador, copia y pega el contenido de:
```
scripts/verificar-terminal-id-backend.js
```

O simplemente ejecuta:
```javascript
verificarTerminalIdBackend()
```

### Paso 3: Interpretar los Resultados

#### ✅ Resultado Exitoso

Si todo está correcto, verás:

```
═══════════════════════════════════════════════════════════════════════
📊 RESULTADO FINAL

Tests pasados:  4
Tests fallados: 0

🎉 ✅ CORRECCIÓN VERIFICADA: El backend está usando Terminal ID FIJO
   El QR debería funcionar correctamente en todas las billeteras

🧪 Próximo paso: Probar escaneo con billeteras:
   - Mercado Pago
   - Naranja X
   - MODO
   - App bancaria
═══════════════════════════════════════════════════════════════════════
```

#### ❌ Resultado con Errores

Si hay problemas, verás algo como:

```
❌ PROBLEMAS DETECTADOS:
   - Terminal ID fijo
   - Terminal ID no variable

💡 El backend necesita verificar la corrección aplicada.
```

---

## 🔍 Análisis Detallado del Payload

El script también mostrará el análisis del campo 26:

```
Campo 26 completo: "0002AR01220110343230034317537929020ATERMINAL01"
Longitud: 43 caracteres

Subcampos decodificados:
  00 (País): "AR"
  01 (CBU/CVU): "0110343230034317537929"
  02 (Terminal ID): "TERMINAL01"
```

### ✅ Estructura Correcta

```
Campo 26: 0002AR01220110343230034317537929020ATERMINAL01
          │     │                           │  │  │
          │     │                           │  │  └─ TERMINAL01 (10 chars)
          │     │                           │  └──── Longitud: 0A (10 en hex)
          │     │                           └─────── Subcampo 02
          │     └─────────────────────────────────── Subcampo 01 (CBU/CVU)
          └───────────────────────────────────────── Subcampo 00 (País)
```

### ❌ Estructura Incorrecta (antes de la corrección)

```
Campo 26: 0002AR012201103432300343175379290213SALE-EC08FEBC
          │     │                           │  │  │
          │     │                           │  │  └─ SALE-EC08FEBC (VARIABLE ❌)
          │     │                           │  └──── Longitud: 13
          │     │                           └─────── Subcampo 02
```

---

## 🧪 Pruebas Adicionales

### 1. Verificar Múltiples Pagos

Ejecuta el script varias veces (crea varios pagos):

```javascript
// Ejecutar 3 veces
verificarTerminalIdBackend()
// Esperar 2 segundos
setTimeout(() => verificarTerminalIdBackend(), 2000)
// Esperar 4 segundos
setTimeout(() => verificarTerminalIdBackend(), 4000)
```

**Resultado esperado**: Todos los pagos deben tener Terminal ID `"TERMINAL01"` (fijo)

### 2. Verificar Diferentes Referencias

Cada pago tendrá una referencia diferente (ej: `SALE-ABC123`, `SALE-DEF456`), pero **todos deben tener el mismo Terminal ID** (`TERMINAL01`).

### 3. Usar el Script de Lectura de QR

Una vez verificado el payload, usa el script de lectura de QR para verificar que el QR renderizado sea correcto:

```javascript
// En scripts/leer-qr-pantalla.js
leerQRPantalla()
```

---

## 📊 Checklist de Verificación

### Backend (lo que reportó)

- [x] Código modificado: `src/lib/qr-helpers.ts`
- [x] Terminal ID cambiado a `"TERMINAL01"`
- [x] Referencia movida a campo 62
- [x] Documentación creada

### Frontend (lo que vamos a verificar)

- [ ] Script de verificación ejecutado
- [ ] Todos los tests pasados (4/4)
- [ ] Terminal ID es `"TERMINAL01"`
- [ ] Terminal ID NO contiene `"SALE-"`
- [ ] Campo 62 contiene referencia `"SALE-"`
- [ ] Múltiples pagos tienen mismo Terminal ID

### Pruebas con Billeteras (siguiente paso)

- [ ] Mercado Pago puede escanear el QR
- [ ] Naranja X puede escanear el QR
- [ ] MODO puede escanear el QR
- [ ] App bancaria puede escanear el QR
- [ ] El monto se muestra correctamente
- [ ] El nombre del comercio se muestra

---

## 🎯 Próximos Pasos según Resultado

### ✅ Si la verificación es exitosa:

1. **Probar con billeteras reales**:
   - Generar un QR
   - Escanear con Mercado Pago
   - Escanear con Naranja X
   - Verificar que ambas puedan leerlo

2. **Documentar resultados**:
   - Qué billeteras funcionan
   - Qué información se muestra
   - Tiempo de respuesta

3. **Desplegar a producción** (si staging funciona)

### ❌ Si la verificación falla:

1. **Verificar que el backend deployó los cambios**
   - ¿El servidor backend fue reiniciado?
   - ¿Los cambios están en la rama correcta?
   - ¿El código se compiló sin errores?

2. **Revisar logs del backend**
   - ¿Hay errores al generar el QR?
   - ¿El endpoint está usando el código correcto?

3. **Contactar al equipo de backend**
   - Compartir el resultado del script
   - Compartir el payload completo
   - Solicitar revisión del código

---

## 📝 Notas Importantes

### Diferencia entre Campo 26 y Campo 62

| Campo | Contenido | Propósito | Debe ser |
|-------|-----------|-----------|----------|
| **26** | Terminal ID | Identificar el punto de venta | **FIJO** |
| **62** | Referencia | Identificar la transacción | **VARIABLE** |

**Correcto**:
- Campo 26: `TERMINAL01` (siempre igual) ✅
- Campo 62: `SALE-ABC123` (cambia cada vez) ✅

**Incorrecto (antes)**:
- Campo 26: `SALE-ABC123` (cambiaba cada vez) ❌
- Campo 62: `SALE-ABC123` (cambia cada vez) ✅

### Por Qué es Importante

Las billeteras:
1. Buscan el Terminal ID (campo 26) para identificar el comercio
2. Si el Terminal ID es variable, no pueden asociarlo a un comercio conocido
3. Por eso rechazan el QR con el error "no podemos leer este QR"

Con el Terminal ID fijo:
1. Las billeteras pueden identificar el comercio
2. Usan la referencia (campo 62) para la transacción específica
3. El QR es aceptado y escaneable

---

## 🔗 Referencias

- **Script de verificación**: `scripts/verificar-terminal-id-backend.js`
- **Script de lectura QR**: `scripts/leer-qr-pantalla.js`
- **Documentación backend**: Ver el índice que te enviaron
- **Fix aplicado en backend**: `src/lib/qr-helpers.ts` (líneas 544-568)

---

## ✅ Conclusión

Esta guía te permite verificar que el backend aplicó correctamente la corrección del Terminal ID. 

**Si todos los tests pasan**, el problema del QR no escaneable debería estar **resuelto** y las billeteras deberían poder leer el QR correctamente.

**Última actualización**: 4 de enero de 2026  
**Versión**: 1.0.0

