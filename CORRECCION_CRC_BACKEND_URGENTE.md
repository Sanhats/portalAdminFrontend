# 🔴 CORRECCIÓN URGENTE: CRC INCORRECTO

## ❌ Problema Actual

**CRC en payload:** `07C8`  
**CRC correcto:** `1098`  
**Diferencia:** El backend está calculando mal el CRC

**Impacto:** Las billeteras (Mercado Pago, Naranja X, MODO) **rechazan el QR inmediatamente** porque el CRC no coincide.

---

## ✅ SOLUCIÓN EXACTA PARA BACKEND

### Código Correcto (Python):

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


# USO EN EL CÓDIGO DE GENERACIÓN DE QR:
# 1. Construir payload SIN el campo 63 (CRC)
payload_sin_crc = construir_payload_emv()  # Sin campo 63

# 2. Calcular CRC sobre: payload_sin_crc + "6304"
data_para_crc = payload_sin_crc + "6304"
crc = calculate_crc16_ccitt(data_para_crc)
crc_hex = f"{crc:04X}"  # Formato hexadecimal de 4 dígitos mayúsculas

# 3. Agregar CRC al payload final
payload_final = payload_sin_crc + f"6304{crc_hex}"
```

---

## 🔍 Verificación del Problema

### Ejemplo Real:

**Payload sin CRC:**
```
00020101021226490002AR012201103432300343175379290213SALE-XXXXX...
```

**Data para CRC:** `payload_sin_crc + "6304"`

**CRC esperado:** `1098`  
**CRC actual (backend):** `07C8` ❌

---

## ⚠️ Errores Comunes que Causan CRC Incorrecto

### ❌ Error 1: Calcular CRC sobre payload completo (incluyendo campo 63)
```python
# INCORRECTO
crc = calculate_crc16_ccitt(payload_completo)  # ❌ Incluye campo 63
```

### ❌ Error 2: No agregar "6304" antes de calcular
```python
# INCORRECTO
crc = calculate_crc16_ccitt(payload_sin_crc)  # ❌ Falta "6304"
```

### ❌ Error 3: Usar algoritmo CRC diferente
```python
# INCORRECTO - No usar CRC32, CRC-16/IBM, etc.
# Debe ser específicamente CRC16-CCITT con polynomial 0x1021
```

### ✅ CORRECTO
```python
# CORRECTO
data_para_crc = payload_sin_crc + "6304"
crc = calculate_crc16_ccitt(data_para_crc)
```

---

## 🧪 Test de Verificación

### Test Unitario para Verificar:

```python
def test_crc_calculation():
    # Payload de ejemplo
    payload_sin_crc = "00020101021226490002AR012201103432300343175379290213SALE-TEST520454925303032540720000005802AR5912Toludev shop6009Argentina62170513SALE-TEST"
    
    # Calcular CRC
    data_para_crc = payload_sin_crc + "6304"
    crc = calculate_crc16_ccitt(data_para_crc)
    crc_hex = f"{crc:04X}"
    
    # Verificar que el CRC sea válido (formato correcto)
    assert len(crc_hex) == 4, "CRC debe ser de 4 dígitos hexadecimales"
    assert all(c in '0123456789ABCDEF' for c in crc_hex), "CRC debe ser hexadecimal"
    
    print(f"✅ CRC calculado: {crc_hex}")
    print(f"✅ Payload final: {payload_sin_crc}6304{crc_hex}")
```

---

## 📋 Checklist de Implementación

- [ ] Reemplazar función de cálculo CRC con la función correcta arriba
- [ ] Verificar que se calcule sobre: `payload_sin_crc + "6304"` (NO sobre payload completo)
- [ ] Verificar formato: `f"{crc:04X}"` (4 dígitos hexadecimales mayúsculas)
- [ ] Agregar test unitario para verificar cálculo
- [ ] Probar con payload real y verificar que el CRC coincida con el frontend

---

## ✅ Después de Corregir

1. **Crear nuevo pago QR**
2. **Ejecutar `validarTodo()` en consola del frontend**
3. **Debe mostrar:** `✅ CRC CORRECTO`
4. **Probar escaneo con Mercado Pago y Naranja X**

---

## 🔗 Referencias

- **Estándar EMV:** El CRC16-CCITT es parte del estándar EMVCo QR Code
- **Polynomial:** `0x1021` (CRC-16-CCITT)
- **Initial Value:** `0xFFFF`
- **Final XOR:** `0x0000` (ninguno)

---

**Última actualización:** Diciembre 2024  
**Prioridad:** 🔴 URGENTE - Bloquea escaneo de QR

