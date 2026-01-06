# ❌ PROBLEMA ENCONTRADO: CRC INCORRECTO

## 🔴 Problema Crítico

**CRC en payload:** `423E`  
**CRC correcto:** `8680`  
**Diferencia:** El backend está calculando mal el CRC

**Impacto:** Las billeteras rechazan el QR inmediatamente porque el CRC no coincide.

---

## ✅ SOLUCIÓN EXACTA PARA BACKEND

### Código Correcto para Calcular CRC:

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

# USO:
payload_sin_crc = payload  # Sin el campo 63
data_para_crc = payload_sin_crc + "6304"  # Agregar "6304"
crc = calculate_crc16_ccitt(data_para_crc)
crc_hex = f"{crc:04X}"  # Formato hexadecimal de 4 dígitos

# Agregar CRC al payload
payload += f"6304{crc_hex}"
```

### Verificación:

Con el payload actual:
```
00020101021226490002AR012201103432300343175379290213SALE-A7FA937452045492530303254064800005802AR5912Toludev shop6009Argentina62170513SALE-A7FA9374
```

El CRC correcto es: `8680`  
El backend está calculando: `423E` ❌

---

## 🔧 Cambios Necesarios en Backend

1. **Reemplazar función de cálculo CRC** con la función correcta arriba
2. **Verificar que se calcule sobre:** `payload_sin_crc + "6304"`
3. **Verificar formato:** `f"{crc:04X}"` (4 dígitos hexadecimales mayúsculas)

---

## ✅ Después de Corregir CRC

1. Crear nuevo pago QR
2. Ejecutar `validarCRC()` en consola
3. Debe mostrar: `✅ CRC CORRECTO`
4. Probar escaneo con Mercado Pago y Naranja X

---

**ESTE ES EL PROBLEMA PRINCIPAL** - Una vez corregido el CRC, el QR debería ser escaneable.

