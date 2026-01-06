# ❌ Problema: QR No Escaneable Aunque Payload EMV Correcto

## 🔍 Situación Actual

- ✅ Campo 52 corregido (`52045492`)
- ✅ Todos los campos EMV presentes y correctos
- ✅ Payload EMV válido según diagnóstico
- ❌ **QR NO es escaneable** desde Mercado Pago ni Naranja X

---

## 🎯 Causas Más Probables

### 1. 🔴 CRC Incorrecto (MÁS PROBABLE)

**Síntoma:**
- Payload EMV correcto
- Todos los campos presentes
- QR no escaneable

**Causa:**
Las billeteras validan el CRC antes de aceptar el QR. Si el CRC está mal calculado, rechazan el QR inmediatamente sin mostrar ningún error específico.

**Cómo verificar:**
```javascript
// Ejecutar en consola
diagnosticoQREscanear()
```

Buscar en la sección "5️⃣ VERIFICACIÓN DEL CRC":
- Formato válido: 4 caracteres hexadecimales (ej: `423E`)
- Si el formato es correcto pero aún no escanea → el valor está mal calculado

**Solución Backend:**
```python
def calculate_crc16_ccitt(data: str) -> int:
    """
    Calcula CRC16-CCITT (polynomial 0x1021) según estándar EMV.
    
    IMPORTANTE: El CRC se calcula sobre el payload SIN el campo 63 (CRC).
    """
    crc = 0xFFFF
    polynomial = 0x1021
    
    # Convertir string a bytes
    for byte in data.encode('utf-8'):
        crc ^= (byte << 8)
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ polynomial
            else:
                crc <<= 1
            crc &= 0xFFFF
    
    return crc

# Calcular CRC
payload_sin_crc = payload  # Sin el campo 63
crc = calculate_crc16_ccitt(payload_sin_crc + "6304")
crc_hex = f"{crc:04X}"  # Formato hexadecimal de 4 dígitos
payload += f"6304{crc_hex}"
```

**Verificación:**
- Usar herramientas de validación CRC online
- Comparar con otros generadores de QR EMV
- Probar con diferentes librerías de cálculo CRC

---

### 2. 🟡 Calidad de Imagen QR Insuficiente

**Síntoma:**
- Payload correcto
- QR visible pero no escaneable

**Causas:**
- QR muy pequeño (< 400x400px)
- Compresión excesiva
- Contraste insuficiente
- Distorsión de imagen

**Solución Backend:**
```python
import qrcode
from PIL import Image

def generate_high_quality_qr(payload: str) -> str:
    """
    Genera QR de alta calidad optimizado para escaneo.
    """
    # Configurar QR con alta corrección de errores
    qr = qrcode.QRCode(
        version=None,  # Auto-detectar versión
        error_correction=qrcode.constants.ERROR_CORRECT_M,  # 15% recuperación
        box_size=10,  # 10 píxeles por módulo
        border=4,     # 4 módulos de borde
    )
    
    qr.add_data(payload)
    qr.make(fit=True)
    
    # Generar imagen
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Redimensionar a tamaño óptimo (400x400px mínimo)
    img = img.resize((400, 400), Image.Resampling.LANCZOS)
    
    # Convertir a base64 SIN compresión
    import io
    import base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG', optimize=False)  # Sin optimización
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_base64}"
```

**Verificación:**
- Verificar dimensiones: mínimo 400x400px
- Verificar tamaño de archivo: no muy pequeño (< 2KB puede indicar compresión excesiva)
- Probar escaneando con app genérica de QR (no billetera)

---

### 3. 🟡 Formato del Merchant Account Information

**Síntoma:**
- Payload correcto
- CRC correcto
- QR no escaneable

**Causa:**
El campo 26 (Merchant Account Information) puede tener una estructura interna que no todas las billeteras reconocen.

**Estructura Esperada:**
```
26[LENGTH][GUID][MERCHANT_ID][TERMINAL_ID]
```

Donde:
- `GUID`: Identificador del GUID (ej: `0002AR`)
- `MERCHANT_ID`: CBU/CVU del comercio (22 dígitos)
- `TERMINAL_ID`: ID de terminal (opcional)

**Verificación:**
```javascript
// En el diagnóstico, verificar campo 26
// Debe tener estructura válida con subcampos correctos
```

**Solución:**
- Verificar que el CBU/CVU tenga exactamente 22 dígitos
- Verificar formato del GUID
- Verificar que la longitud total no exceda 99 caracteres

---

### 4. 🟢 Configuración de la Billetera

**Síntoma:**
- Payload correcto
- CRC correcto
- QR de buena calidad
- Algunas billeteras escanean, otras no

**Causa:**
Algunas billeteras requieren:
- Registro del comercio
- Configuración adicional
- Versión específica de la app

**Solución:**
- Probar con diferentes billeteras
- Contactar soporte de la billetera con el payload EMV
- Verificar si el comercio está registrado en la billetera

---

## 🧪 Cómo Diagnosticar

### Paso 1: Ejecutar Diagnóstico Completo

```javascript
// Copiar y pegar el contenido de scripts/diagnostico-qr-escanear.js
// O ejecutar directamente:
diagnosticoQREscanear()
```

Este script verificará:
1. ✅ Campo 52 específicamente
2. ✅ Todos los campos EMV
3. ✅ Imagen QR (tamaño, calidad)
4. ✅ CRC (formato y posible valor)
5. ✅ Merchant Account Information

### Paso 2: Revisar Resultados

Buscar en el diagnóstico:
- ❌ Problemas en campos EMV → Corregir en backend
- ⚠️ QR pequeño (< 400x400px) → Aumentar tamaño
- ⚠️ CRC formato correcto pero valor puede estar mal → Verificar cálculo
- ✅ Todo correcto → Problema puede ser configuración de billetera

---

## 🔧 Soluciones Prioritarias

### Prioridad 1: Verificar CRC

1. **Obtener el payload completo** del diagnóstico
2. **Calcular CRC manualmente** usando herramienta online
3. **Comparar con el CRC** en el payload
4. **Si no coincide** → Corregir cálculo en backend

### Prioridad 2: Mejorar Calidad de QR

1. **Aumentar tamaño** a 400x400px mínimo
2. **Usar ERROR_CORRECT_M** o `ERROR_CORRECT_H`
3. **Sin compresión** en la imagen
4. **Contraste máximo** (negro #000000 sobre blanco #FFFFFF)

### Prioridad 3: Verificar Merchant Account Information

1. **Verificar CBU/CVU** (22 dígitos exactos)
2. **Verificar formato** del GUID
3. **Verificar longitud total** (máximo 99 caracteres)

---

## 📋 Checklist de Diagnóstico

- [ ] Campo 52 tiene longitud `04` y valor `5492`
- [ ] Todos los campos EMV presentes
- [ ] CRC presente y formato válido (4 caracteres hexadecimales)
- [ ] QR generado a 400x400px mínimo
- [ ] QR sin compresión excesiva
- [ ] Contraste máximo (negro sobre blanco)
- [ ] Merchant Account Information con estructura válida
- [ ] CBU/CVU tiene 22 dígitos exactos

---

## 💡 Próximos Pasos

1. **Ejecutar `diagnosticoQREscanear()`** para obtener diagnóstico completo
2. **Revisar sección de CRC** - si el formato es correcto pero el valor puede estar mal
3. **Verificar tamaño del QR** - debe ser al menos 400x400px
4. **Si todo está correcto** → Problema puede ser cálculo del CRC o configuración de billetera

---

**Última actualización:** Diciembre 2024  
**Estado:** 🔍 Investigando causa raíz del problema de escaneo

