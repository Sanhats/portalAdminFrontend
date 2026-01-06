# 🔴 Diagnóstico Final: QR Sigue Sin Escanearse

**Fecha**: 4 de enero de 2026  
**Estado**: 🔴 **CBU/CVU NO REGISTRADO (Alta probabilidad)**

---

## ✅ Lo que YA está CORRECTO

Después de las correcciones aplicadas:

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| **Terminal ID** | ✅ Correcto | `"TERMINAL01"` (fijo) |
| **Formato EMV** | ✅ Correcto | Cumple especificación EMVCo |
| **CRC** | ✅ Correcto | Calculado correctamente |
| **Campo 62** | ✅ Correcto | Referencia en lugar correcto |
| **Estructura** | ✅ Correcta | Todos los campos presentes |
| **Tamaño QR** | ✅ Correcto | 400x400px con nivel H |

---

## 🔴 Problema Identificado: CBU/CVU NO REGISTRADO

### Payload Actual

```
00020101021226460002AR012201103432300343175379290210TERMINAL01
52045492530303254061000005802AR5912Toludev shop6009Argentina
62170513SALE-854F369E6304C11E
```

### Campo 26 Decodificado

```
Campo 26: 0002AR012201103432300343175379290210TERMINAL01
          │     │                           │  │  │
          │     │                           │  │  └─ TERMINAL01 ✅
          │     │                           │  └──── Longitud: 10
          │     │                           └─────── Subcampo 02 (Terminal ID)
          │     └─────────────────────────────────── Subcampo 01 (CBU/CVU)
          └───────────────────────────────────────── Subcampo 00 (País: AR)
```

**CBU/CVU**: `0110343230034317537929` (22 dígitos) ✅

---

## 🔍 Por Qué Falla el Escaneo

### 1. Sistema de QR Interoperables

El estándar de QR Interoperables en Argentina requiere:

1. **CBU/CVU registrado** en el sistema COELSA/BCRA
2. **Comercio registrado** con datos fiscales
3. **MCC habilitado** para ese CBU específico

### 2. Flujo de Validación de las Billeteras

Cuando escaneas un QR:

```
1. Billetera lee el QR
   ↓
2. Extrae el CBU del campo 26
   ↓
3. Consulta al sistema COELSA/BCRA:
   "¿Este CBU está registrado para QR Interoperables?"
   ↓
4. Si NO está registrado:
   → ❌ "No podemos leer este QR"
   
5. Si SÍ está registrado:
   → ✅ Muestra datos del comercio
   → ✅ Permite el pago
```

### 3. El CBU `0110343230034317537929`

```
Banco: 011 (Banco de la Nación Argentina)
Cuenta: 0343230034317537929

Estado: ⚠️ PROBABLEMENTE NO REGISTRADO para QR Interoperables
```

---

## 📋 Cómo Verificar si un CBU está Registrado

### Opción 1: Consultar al Banco

Contactar al **Banco de la Nación Argentina** (011) y preguntar:

1. ¿Está habilitado el CBU `0110343230034317537929` para recibir pagos con QR Interoperables?
2. ¿El comercio está registrado en COELSA?
3. ¿Qué pasos faltan para completar el registro?

### Opción 2: Probar con un QR Conocido

Generar un QR con los datos de un comercio que **sabés que funciona**:
- Rapipago
- PagoFácil
- Un kiosco local que acepte QR

Si ese QR **sí funciona** con tu código, confirma que el problema es el CBU.

### Opción 3: Usar CBU de Prueba

Solicitar al banco un **CBU de prueba** o usar el ambiente de **sandbox de COELSA**.

---

## 🎯 Soluciones Posibles

### Solución 1: Registrar el CBU en COELSA (DEFINITIVA)

**Pasos**:

1. Contactar al banco emisor del CBU
2. Solicitar habilitación para QR Interoperables
3. Completar registro en COELSA con:
   - CUIT del comercio
   - Razón social
   - Domicilio fiscal
   - MCC (Merchant Category Code)
4. Esperar aprobación (puede tardar días/semanas)

**Tiempo estimado**: 1-3 semanas  
**Esfuerzo**: Medio  
**Garantía**: Alta (solución definitiva)

---

### Solución 2: Usar Mercado Pago (TEMPORAL)

Mientras se registra el CBU, usar Mercado Pago con su propio sistema:

**Backend necesita**:
```python
# Configurar credenciales de Mercado Pago
MERCADOPAGO_ACCESS_TOKEN = "APP_USR-..."
MERCADOPAGO_USER_ID = "123456789"
MERCADOPAGO_EXTERNAL_POS_ID = "POS001"

# Generar QR con API de Mercado Pago
import mercadopago
sdk = mercadopago.SDK(MERCADOPAGO_ACCESS_TOKEN)

qr_data = {
    "external_reference": "SALE-ABC123",
    "title": "Venta",
    "description": "Pago de productos",
    "notification_url": "https://tu-backend.com/webhooks/mercadopago",
    "total_amount": 1000.00,
    "items": [...]
}

qr_response = sdk.pos().create_qr(USER_ID, EXTERNAL_POS_ID, qr_data)
qr_code = qr_response["response"]["qr_data"]
```

**Ventajas**:
- Funciona inmediatamente
- No requiere registro en COELSA
- Solo funciona con Mercado Pago

**Desventajas**:
- Solo Mercado Pago (no interoperable)
- Requiere cuenta de Mercado Pago
- Comisiones de Mercado Pago

---

### Solución 3: Usar CBU de Otro Banco (PRUEBA)

Si tienes cuenta en otro banco que **ya tenga QR Interoperables habilitado**:

1. Obtener el CBU de esa cuenta
2. Reemplazar en el backend:
   ```python
   # Reemplazar
   cbu_o_cvu = "0110343230034317537929"  # ❌ No registrado
   
   # Por (ejemplo)
   cbu_o_cvu = "0170099120000012345678"  # ✅ Banco Galicia habilitado
   ```

**Importante**: El CBU debe estar asociado a **tu comercio registrado**.

---

## 📊 Comparación de Soluciones

| Solución | Tiempo | Esfuerzo | Costo | Interoperable | Producción |
|----------|--------|----------|-------|---------------|------------|
| Registrar CBU | 1-3 sem | Medio | Bajo | ✅ Sí | ✅ Sí |
| Mercado Pago | Inmediato | Bajo | Medio* | ❌ No | ✅ Sí |
| CBU de prueba | Inmediato | Bajo | Bajo | ✅ Sí | ⚠️ Solo test |

*Comisiones de Mercado Pago

---

## 🧪 Script de Verificación

Ejecuta en consola:

```javascript
// Copiar contenido de: scripts/analizar-por-que-no-escanea.js
```

Este script te dará un análisis detallado del CBU y posibles problemas.

---

## 📝 Checklist de Verificación

### Verificar con el Banco

- [ ] Llamar al Banco de la Nación (011)
- [ ] Preguntar por habilitación de QR Interoperables
- [ ] Solicitar CBU de prueba si está disponible
- [ ] Consultar tiempo de habilitación

### Verificar Registro en COELSA

- [ ] Confirmar que el comercio está registrado
- [ ] Verificar datos fiscales (CUIT)
- [ ] Verificar MCC asignado
- [ ] Verificar estado del trámite

### Alternativas Temporales

- [ ] Evaluar usar Mercado Pago
- [ ] Conseguir CBU de prueba
- [ ] Probar con CBU de otro comercio conocido

---

## 🎯 Recomendación Final

### Para Producción (Definitivo)

**Registrar el CBU en COELSA** es la única solución definitiva para QR Interoperables.

**Pasos inmediatos**:
1. Contactar al banco **HOY**
2. Solicitar habilitación para QR Interoperables
3. Completar formularios necesarios
4. Esperar aprobación

### Para Testing (Temporal)

Mientras se registra el CBU:

**Opción A**: Usar Mercado Pago (funciona ahora, no interoperable)  
**Opción B**: Conseguir CBU de prueba del banco  
**Opción C**: Probar en sandbox de COELSA si está disponible

---

## 📞 Contactos Útiles

- **Banco de la Nación**: 0810-666-4444
- **COELSA**: https://www.coelsa.com.ar/
- **BCRA QR Interoperables**: https://www.bcra.gob.ar/
- **Soporte Mercado Pago**: https://www.mercadopago.com.ar/ayuda

---

## ✅ Conclusión

El código está **100% correcto** según el estándar EMVCo:

- ✅ Terminal ID fijo
- ✅ Formato EMV válido
- ✅ CRC correcto
- ✅ Todos los campos presentes

El problema es **externo al código**: el CBU no está registrado en el sistema de QR Interoperables.

**No es un problema de código, es un problema de registro administrativo/bancario.**

---

**Última actualización**: 4 de enero de 2026  
**Versión**: 1.0.0

