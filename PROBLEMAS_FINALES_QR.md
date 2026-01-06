# ❌ PROBLEMAS FINALES: QR No Escaneable

## 🔴 Problemas Detectados

1. **CRC INCORRECTO**
   - CRC en payload: `24A6`
   - CRC correcto: `CE45`
   - **Impacto:** Las billeteras rechazan el QR inmediatamente

2. **QR MUY PEQUEÑO**
   - Tamaño actual: 300x300px
   - Tamaño necesario: 400x400px mínimo
   - **Impacto:** Problemas de escaneo

---

## ✅ SOLUCIÓN 1: CORREGIR CRC

### Código Correcto para Backend:

```python
def calculate_crc16_ccitt(data: str) -> int:
    """
    Calcula CRC16-CCITT (polynomial 0x1021) según estándar EMV.
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
payload_sin_crc = payload  # Sin campo 63
data_para_crc = payload_sin_crc + "6304"  # Agregar "6304"
crc = calculate_crc16_ccitt(data_para_crc)
crc_hex = f"{crc:04X}"  # Formato hexadecimal de 4 dígitos

# Agregar CRC al payload
payload += f"6304{crc_hex}"
```

### Verificación:

Para el payload actual:
```
00020101021226490002AR012201103432300343175379290213SALE-E3173AB8520454925303032540720000005802AR5912Toludev shop6009Argentina62170513SALE-E3173AB8
```

El CRC correcto debe ser: `CE45`  
El backend está calculando: `24A6` ❌

---

## ✅ SOLUCIÓN 2: AUMENTAR TAMAÑO QR

### Código para Backend:

```python
# Generar imagen QR
img = qr.make_image(fill_color="black", back_color="white")

# ⚠️ AGREGAR ESTA LÍNEA:
img = img.resize((400, 400), Image.Resampling.LANCZOS)  # 400x400px mínimo

# Convertir a base64
buffer = io.BytesIO()
img.save(buffer, format='PNG', optimize=False)  # Sin compresión
img_base64 = base64.b64encode(buffer.getvalue()).decode()
```

---

## 🧪 Verificar Correcciones

Después de aplicar ambas correcciones, ejecutar:

```javascript
validarTodo()
```

**Resultado esperado:**
```
✅ CRC CORRECTO
✅ Tamaño correcto
✅ TODO CORRECTO
El QR debería ser escaneable.
```

---

## 📋 Checklist Backend

- [ ] Corregir cálculo CRC (usar función correcta arriba)
- [ ] Agregar `img.resize((400, 400), Image.Resampling.LANCZOS)`
- [ ] Verificar que CRC sea `CE45` para este payload
- [ ] Verificar que QR sea 400x400px

---

**ESTOS SON LOS ÚNICOS PROBLEMAS RESTANTES** - Una vez corregidos, el QR debería ser escaneable.

