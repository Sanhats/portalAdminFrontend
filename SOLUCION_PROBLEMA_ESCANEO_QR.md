# 🔧 Solución al Problema de Escaneo QR

## ❌ Problema Actual

Las billeteras (Mercado Pago, Naranja X) **NO pueden escanear el QR** aunque el payload EMV parece estar correcto.

---

## 🔍 Posibles Causas

### 1. Calidad/Resolución de la Imagen QR

El QR puede estar generado con:
- ❌ Resolución muy baja
- ❌ Compresión excesiva
- ❌ Formato incorrecto
- ❌ Distorsión de imagen

**Solución Backend:**
```python
# Asegurar alta calidad en la generación del QR
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_M,  # Nivel M o H
    box_size=10,  # Tamaño de cada módulo (píxeles)
    border=4,     # Borde alrededor del QR
)

# Generar imagen con alta calidad
img = qr.make_image(fill_color="black", back_color="white")
img = img.resize((400, 400), Image.Resampling.LANCZOS)  # Redimensionar con alta calidad
```

---

### 2. Formato del Merchant Account Information

El campo `26` (Merchant Account Information) puede tener un formato que las billeteras no reconocen.

**Verificar:**
- El GUID debe estar en el formato correcto
- El Merchant ID (CBU/CVU) debe tener exactamente 22 dígitos
- La estructura debe seguir el estándar EMV exacto

---

### 3. CRC Incorrecto

El CRC puede estar mal calculado, causando que las billeteras rechacen el QR.

**Solución Backend:**
```python
def calculate_crc16_ccitt(data: str) -> int:
    """
    Calcula CRC16-CCITT (polynomial 0x1021) según estándar EMV
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

# Calcular CRC antes de agregarlo al payload
payload_sin_crc = payload  # Sin el campo 63
crc = calculate_crc16_ccitt(payload_sin_crc + "6304")
payload += f"6304{crc:04X}"
```

---

### 4. Tamaño Mínimo del QR

Las billeteras pueden requerir un tamaño mínimo específico.

**Solución Frontend:**
- ✅ Ya implementado: 320x320px
- ✅ Verificar que la imagen no se distorsione
- ✅ Usar `imageRendering: 'crisp-edges'`

---

### 5. Contraste Insuficiente

El QR debe tener máximo contraste (negro sobre blanco).

**Verificar:**
- Fondo blanco puro (#FFFFFF)
- QR negro puro (#000000)
- Sin sombras ni efectos

---

## 🧪 Cómo Diagnosticar

### Paso 1: Ejecutar Diagnóstico Completo

```javascript
// En la consola del navegador
diagnosticoCompletoQR()
```

Este script:
- ✅ Decodifica el payload EMV completo
- ✅ Verifica todos los campos
- ✅ Analiza la imagen QR
- ✅ Identifica problemas específicos

### Paso 2: Verificar Imagen QR

1. **Descargar la imagen QR:**
   - Click derecho en el QR → "Guardar imagen como..."
   - O copiar el base64 y convertir a imagen

2. **Verificar dimensiones:**
   - Debe ser al menos 200x200px
   - Preferiblemente 320x320px o más

3. **Verificar calidad:**
   - Debe ser nítido y claro
   - Sin compresión visible
   - Contraste máximo

### Paso 3: Probar con Lector QR Genérico

Usar una app de lectura QR genérica (no billetera) para verificar:
- Si puede leer el QR → problema de formato EMV
- Si NO puede leer → problema de calidad de imagen

---

## ✅ Soluciones Recomendadas

### Backend: Mejorar Generación del QR

```python
import qrcode
from PIL import Image

def generate_high_quality_qr(payload: str) -> str:
    """
    Genera QR de alta calidad optimizado para escaneo
    """
    # Configurar QR con alta corrección de errores
    qr = qrcode.QRCode(
        version=None,  # Auto-detectar versión
        error_correction=qrcode.constants.ERROR_CORRECT_M,  # Nivel M (15% recuperación)
        box_size=10,  # 10 píxeles por módulo
        border=4,     # 4 módulos de borde
    )
    
    qr.add_data(payload)
    qr.make(fit=True)
    
    # Generar imagen
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Redimensionar a tamaño óptimo (400x400px)
    img = img.resize((400, 400), Image.Resampling.LANCZOS)
    
    # Convertir a base64
    import io
    import base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG', optimize=False)  # Sin optimización para máxima calidad
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_base64}"
```

### Frontend: Verificar Renderizado

```tsx
<img 
  src={qrCode} 
  alt="QR Code" 
  width="400"
  height="400"
  style={{ 
    width: '400px',
    height: '400px',
    display: 'block',
    imageRendering: 'crisp-edges',
    backgroundColor: '#FFFFFF'  // Fondo blanco explícito
  }}
  draggable={false}
/>
```

---

## 🔍 Checklist de Verificación

### Backend
- [ ] QR generado con `ERROR_CORRECT_M` o `ERROR_CORRECT_H`
- [ ] Tamaño mínimo: 200x200px (recomendado: 400x400px)
- [ ] Formato PNG sin compresión
- [ ] Contraste máximo (negro #000000 sobre blanco #FFFFFF)
- [ ] CRC calculado correctamente
- [ ] Merchant Account Information en formato correcto
- [ ] Todos los campos EMV presentes y correctos

### Frontend
- [x] QR mostrado a 320x320px mínimo
- [x] `imageRendering: 'crisp-edges'`
- [x] Sin elementos que interfieran
- [x] Fondo blanco puro

### Payload EMV
- [x] Empieza con `000201`
- [x] Point of Initiation = `12` (Static)
- [x] Merchant Category Code = `5492`
- [x] Currency = `032` (ARS)
- [x] Country = `AR`
- [x] Amount sin decimales
- [x] CRC presente y válido

---

## 💡 Próximos Pasos

1. **Ejecutar diagnóstico completo:**
   ```javascript
   diagnosticoCompletoQR()
   ```

2. **Verificar la imagen QR:**
   - Descargar y verificar calidad
   - Probar con lector QR genérico

3. **Si el payload es correcto pero no escanea:**
   - Problema probablemente en la calidad de la imagen
   - Backend debe generar QR de mayor calidad
   - Aumentar `box_size` y `error_correction`

4. **Si el lector genérico tampoco puede leer:**
   - Problema en la generación de la imagen QR
   - Verificar librería de generación QR
   - Probar con otra librería

---

**Última actualización:** Diciembre 2024

