# 🔧 Soluciones Prioritarias: QR No Escaneable

## 📊 Diagnóstico Actual

### ✅ Lo que está Correcto

- ✅ Campo 52: `52045492` (correcto)
- ✅ Todos los campos EMV presentes
- ✅ Payload EMV válido
- ✅ CRC formato válido (`423E`)

### ⚠️ Problemas Detectados

1. **QR muy pequeño:** 300x300px (debería ser mínimo 400x400px)
2. **CRC puede estar incorrecto:** Formato válido pero valor puede estar mal calculado

---

## 🔴 Prioridad 1: Validar y Corregir CRC

### Cómo Validar el CRC

Ejecutar en la consola del navegador:

```javascript
// Copiar y pegar el contenido de scripts/validar-crc-emv.js
// Luego ejecutar:
validarCRCUltimoQR()
```

Este script:
- Calcula el CRC según el estándar EMV
- Compara con el CRC en el payload
- Indica si está correcto o incorrecto

### Si el CRC está Incorrecto

**Solución Backend:**

```python
def calculate_crc16_ccitt(data: str) -> int:
    """
    Calcula CRC16-CCITT (polynomial 0x1021) según estándar EMV.
    
    IMPORTANTE: El CRC se calcula sobre:
    - Payload completo SIN el campo 63 (CRC)
    - Más los caracteres "6304" (campo 63 + longitud)
    """
    crc = 0xFFFF
    polynomial = 0x1021
    
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
data_para_crc = payload_sin_crc + "6304"  # Agregar "6304"
crc = calculate_crc16_ccitt(data_para_crc)
crc_hex = f"{crc:04X}"  # Formato hexadecimal de 4 dígitos

# Agregar CRC al payload
payload += f"6304{crc_hex}"
```

**Verificación:**
- Usar el script `validarCRCUltimoQR()` para verificar
- Comparar con herramientas online de CRC16-CCITT
- Probar con diferentes librerías

---

## 🟡 Prioridad 2: Aumentar Tamaño del QR

### Problema Actual

- QR generado: 300x300px
- QR mostrado: 400x400px (frontend)
- **Problema:** El QR original es muy pequeño

### Solución Backend

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
    
    # ⚠️ IMPORTANTE: Redimensionar a 400x400px mínimo
    img = img.resize((400, 400), Image.Resampling.LANCZOS)
    
    # Convertir a base64 SIN compresión
    import io
    import base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG', optimize=False)  # Sin optimización
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_base64}"
```

**Cambios necesarios:**
- `box_size=10` (aumentar de 8 a 10)
- `resize((400, 400))` (aumentar de 300x300 a 400x400)
- `optimize=False` (sin compresión)

---

## 🟡 Prioridad 3: Verificar Merchant Account Information

### Estructura Actual

```
0002AR012201103432300343175379290213SALE-A7FA9374
```

**Análisis:**
- `0002` = GUID prefix
- `AR` = País
- `01` = Subcampo ID (Merchant ID)
- `22` = Longitud (22 caracteres)
- `0110343230034317537929` = Merchant ID (CBU/CVU)
- `02` = Subcampo ID (Terminal ID)
- `13` = Longitud (13 caracteres)
- `SALE-A7FA9374` = Terminal ID

### Posibles Problemas

1. **GUID prefix:** `0002` puede no ser reconocido por todas las billeteras
2. **Estructura:** Puede requerir formato específico según estándar argentino

**Solución:**
- Verificar formato según estándar BCRA/EMV para Argentina
- Consultar documentación de las billeteras sobre formato requerido

---

## 📋 Checklist de Acciones

### Backend

- [ ] **Validar CRC:**
  - [ ] Ejecutar `validarCRCUltimoQR()` desde frontend
  - [ ] Si está incorrecto, corregir cálculo
  - [ ] Verificar con herramientas online

- [ ] **Aumentar tamaño QR:**
  - [ ] Cambiar `box_size` a 10
  - [ ] Cambiar `resize` a 400x400px
  - [ ] Desactivar compresión (`optimize=False`)

- [ ] **Mejorar calidad:**
  - [ ] Usar `ERROR_CORRECT_M` o `ERROR_CORRECT_H`
  - [ ] Verificar contraste (negro #000000 sobre blanco #FFFFFF)

- [ ] **Verificar Merchant Account Information:**
  - [ ] Consultar formato requerido por billeteras argentinas
  - [ ] Verificar que el GUID prefix sea correcto

### Frontend

- [x] QR mostrado a 400x400px
- [x] Sin elementos que interfieran
- [x] Contraste máximo
- [x] Scripts de diagnóstico funcionando

---

## 🧪 Cómo Probar las Correcciones

### Paso 1: Validar CRC

```javascript
validarCRCUltimoQR()
```

**Resultado esperado:**
```
✅ CRC CORRECTO
El CRC está bien calculado según el estándar EMV.
```

### Paso 2: Verificar Tamaño QR

```javascript
diagnosticoQREscanear()
```

Buscar en "4️⃣ VERIFICACIÓN DE IMAGEN QR":
```
Dimensiones: 400x400px
✅ Tamaño óptimo para escaneo
```

### Paso 3: Probar Escaneo

- Mercado Pago
- Naranja X
- MODO
- Ualá

---

## 💡 Orden de Prioridad

1. **🔴 CRC** - Si está mal, las billeteras rechazan inmediatamente
2. **🟡 Tamaño QR** - 300x300px puede ser insuficiente
3. **🟡 Merchant Account Information** - Puede requerir formato específico
4. **🟢 Configuración billetera** - Último recurso

---

**Última actualización:** Diciembre 2024  
**Estado:** 🔍 Investigando CRC y tamaño del QR

