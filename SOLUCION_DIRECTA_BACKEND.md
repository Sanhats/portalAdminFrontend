# 🔧 SOLUCIÓN DIRECTA PARA BACKEND

## ❌ PROBLEMA: QR NO ESCANEABLE

### Causas Identificadas:

1. **QR muy pequeño:** 300x300px → debe ser 400x400px mínimo
2. **CRC puede estar incorrecto:** Requiere validación

---

## ✅ SOLUCIÓN 1: AUMENTAR TAMAÑO QR

```python
# ANTES (incorrecto)
img = qr.make_image(fill_color="black", back_color="white")
# QR generado a ~300x300px

# AHORA (correcto)
img = qr.make_image(fill_color="black", back_color="white")
img = img.resize((400, 400), Image.Resampling.LANCZOS)  # 400x400px mínimo
```

**Cambios necesarios:**
- Agregar `resize((400, 400))` después de `make_image()`
- Usar `Image.Resampling.LANCZOS` para mejor calidad

---

## ✅ SOLUCIÓN 2: VALIDAR Y CORREGIR CRC

### Código para Validar CRC:

```python
def calculate_crc16_ccitt(data: str) -> int:
    """Calcula CRC16-CCITT según estándar EMV"""
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
payload_sin_crc = payload  # Sin campo 63
data_para_crc = payload_sin_crc + "6304"  # Agregar "6304"
crc = calculate_crc16_ccitt(data_para_crc)
crc_hex = f"{crc:04X}"  # 4 dígitos hexadecimales

# Agregar al payload
payload += f"6304{crc_hex}"
```

---

## ✅ SOLUCIÓN 3: MEJORAR CALIDAD QR

```python
qr = qrcode.QRCode(
    version=None,
    error_correction=qrcode.constants.ERROR_CORRECT_M,  # Nivel M
    box_size=10,  # 10 píxeles por módulo
    border=4,
)

# Generar imagen
img = qr.make_image(fill_color="black", back_color="white")
img = img.resize((400, 400), Image.Resampling.LANCZOS)

# Sin compresión
buffer = io.BytesIO()
img.save(buffer, format='PNG', optimize=False)  # Sin optimización
```

---

## 🧪 VALIDAR CRC DESDE FRONTEND

Ejecutar en consola:
```javascript
validarCRC()
```

Si muestra `❌ CRC INCORRECTO` → Corregir cálculo en backend
Si muestra `✅ CRC CORRECTO` → El problema es el tamaño del QR

