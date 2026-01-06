# 🔧 Soluciones Completas: QR No Escaneable por Mercado Pago

## ❌ Problema Actual

Aunque el CRC se corrige correctamente en el frontend (`07C8` → `1098`), **Mercado Pago sigue rechazando el QR** con el mensaje:

> "Por el momento, no podemos leer este QR. Estamos trabajando para que puedas pagar con este tipo de códigos."

---

## 🔍 Posibles Causas

### 1. **Merchant Account Information Incorrecto** (MÁS PROBABLE)

El campo 26 (Merchant Account Information) debe tener un formato específico para Argentina:

```
26[LENGTH]0002AR01[GUID]02[TERMINAL_ID]...
```

**Problemas comunes:**
- GUID inválido o no registrado en Mercado Pago
- Terminal ID incorrecto
- Formato del campo 26 incorrecto
- CBU/CVU no verificado en Mercado Pago

**Solución:**
- Verificar que el comercio esté registrado en Mercado Pago
- Verificar que el GUID y Terminal ID sean correctos
- Contactar soporte de Mercado Pago para validar configuración

---

### 2. **QR Regenerado No Contiene el Payload Corregido**

Aunque el frontend regenera el QR, puede que:
- El QR regenerado no se esté mostrando correctamente
- El QR regenerado tenga problemas de calidad
- El payload corregido no se esté codificando correctamente en el QR

**Solución:**
- Verificar que el QR mostrado en pantalla contenga el payload corregido
- Usar una herramienta de lectura QR para verificar el contenido
- Mejorar la calidad del QR regenerado

---

### 3. **Campos EMV Incorrectos o Faltantes**

Mercado Pago es muy estricto con el formato EMV. Puede haber problemas con:

- **Campo 01 (Point of Initiation):** Debe ser `12` (Static QR)
- **Campo 52 (MCC):** Debe ser un código válido (no `0000`)
- **Campo 54 (Amount):** Formato sin decimales
- **Campo 59 (Merchant Name):** No puede estar vacío
- **Campo 60 (Merchant City):** No puede estar vacío

**Solución:**
- Ejecutar `diagnosticoCompletoQRMercadoPago()` para verificar todos los campos
- Corregir campos incorrectos en el backend

---

### 4. **Comercio No Registrado en Mercado Pago**

Mercado Pago puede rechazar QRs de comercios no registrados o no verificados.

**Solución:**
- Registrar el comercio en Mercado Pago
- Verificar CBU/CVU en Mercado Pago
- Activar Terminal ID en Mercado Pago

---

### 5. **Calidad del QR Insuficiente**

Aunque el QR se regenera a 400x400px, puede haber problemas de:
- Contraste insuficiente
- Margen incorrecto
- Error correction level incorrecto
- Compresión de imagen

**Solución:**
- Mejorar configuración del QR regenerado (ya implementado)
- Verificar que el QR tenga suficiente contraste
- Asegurar que el margen sea correcto (mínimo 4 módulos)

---

## ✅ Soluciones Implementadas

### 1. Corrección Automática de CRC ✅
- El frontend corrige el CRC automáticamente
- El QR se regenera con el payload corregido

### 2. Mejora de Calidad del QR ✅
- QR regenerado a 400x400px
- Máxima calidad (quality: 1.0)
- Contraste máximo (negro/blanco puro)
- Error correction level M

---

## 🔧 Soluciones Adicionales Recomendadas

### Solución 1: Verificar Merchant Account Information

**Ejecutar diagnóstico completo:**

```javascript
// En la consola del navegador
diagnosticoCompletoQRMercadoPago()
```

Este script analiza:
- Todos los campos EMV
- Estructura del Merchant Account Information
- Problemas específicos de Mercado Pago
- Calidad del QR regenerado

---

### Solución 2: Usar QR Específico de Mercado Pago (Alternativa)

En lugar de QR interoperable, usar la API de Mercado Pago directamente:

**Ventajas:**
- Mayor compatibilidad con Mercado Pago
- Mejor integración
- Soporte oficial

**Desventajas:**
- Solo funciona con Mercado Pago
- Requiere integración adicional
- Más complejo

**Implementación:**
```python
# Backend - Generar QR específico de Mercado Pago
import mercadopago

sdk = mercadopago.SDK("ACCESS_TOKEN")
preference_data = {
    "items": [
        {
            "title": "Pago",
            "quantity": 1,
            "unit_price": amount
        }
    ],
    "back_urls": {
        "success": "https://tu-sitio.com/success",
        "failure": "https://tu-sitio.com/failure"
    }
}

preference = sdk.preference().create(preference_data)
qr_code = preference["response"]["qr_code"]
```

---

### Solución 3: Contactar Soporte de Mercado Pago

**Información a proporcionar:**
1. Payload EMV completo
2. QR generado (imagen)
3. CBU/CVU del comercio
4. Terminal ID
5. GUID usado

**Preguntas específicas:**
- ¿El formato del Merchant Account Information es correcto?
- ¿El comercio está correctamente registrado?
- ¿Hay algún requisito adicional para QR interoperables?

---

### Solución 4: Verificar con Otras Billeteras

**Probar con:**
- Naranja X
- MODO
- Ualá
- Bancos argentinos

**Si otras billeteras funcionan:**
- El problema es específico de Mercado Pago
- Puede ser un tema de registro/verificación
- Contactar soporte de Mercado Pago

**Si ninguna funciona:**
- El problema es del payload EMV
- Revisar todos los campos con el diagnóstico completo
- Corregir en el backend

---

### Solución 5: Mejorar Backend (SOLUCIÓN DEFINITIVA)

**Corregir en el backend:**

1. **CRC correcto:**
   ```python
   # Ver: CORRECCION_CRC_BACKEND_URGENTE.md
   ```

2. **Merchant Account Information correcto:**
   ```python
   # Formato: 0002AR01[GUID]02[TERMINAL_ID]...
   guid = "tu-guid-registrado-en-mercadopago"
   terminal_id = "tu-terminal-id-activo"
   mai = f"0002AR01{len(guid):02d}{guid}02{len(terminal_id):02d}{terminal_id}"
   ```

3. **Todos los campos correctos:**
   - Campo 01 = `12` (Static QR)
   - Campo 52 = MCC válido (no `0000`)
   - Campo 54 = Amount sin decimales
   - Campo 59 = Merchant Name (no vacío)
   - Campo 60 = Merchant City (no vacío)

---

## 🧪 Pasos de Diagnóstico

### Paso 1: Ejecutar Diagnóstico Completo

```javascript
diagnosticoCompletoQRMercadoPago()
```

### Paso 2: Verificar Payload Corregido

```javascript
// Obtener el payload corregido
const payment = /* obtener pago QR */;
const payloadOriginal = payment.gateway_metadata.qr_payload;
const payloadCorregido = corregirCRC(payloadOriginal);

console.log('Payload original:', payloadOriginal);
console.log('Payload corregido:', payloadCorregido);
```

### Paso 3: Verificar QR Regenerado

Usar una app de lectura QR (como "QR Code Reader") para escanear el QR mostrado y verificar que contenga el payload corregido.

### Paso 4: Probar con Otras Billeteras

- Si Naranja X funciona → Problema específico de Mercado Pago
- Si ninguna funciona → Problema del payload EMV

---

## 📋 Checklist de Verificación

- [ ] CRC corregido correctamente (`1098`)
- [ ] QR regenerado a 400x400px
- [ ] Payload EMV completo y válido
- [ ] Campo 26 (Merchant Account Info) con formato correcto
- [ ] Comercio registrado en Mercado Pago
- [ ] CBU/CVU verificado en Mercado Pago
- [ ] Terminal ID activo en Mercado Pago
- [ ] QR probado con otras billeteras
- [ ] Contactado soporte de Mercado Pago (si es necesario)

---

## 🎯 Próximos Pasos Recomendados

1. **Ejecutar diagnóstico completo** para identificar problemas específicos
2. **Verificar Merchant Account Information** con Mercado Pago
3. **Probar con otras billeteras** para aislar el problema
4. **Contactar soporte de Mercado Pago** si el problema persiste
5. **Considerar usar API de Mercado Pago** como alternativa

---

**Última actualización:** Diciembre 2024  
**Estado:** 🔍 Diagnóstico en curso

