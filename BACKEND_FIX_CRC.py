"""
CÓDIGO EXACTO PARA BACKEND - CORRECCIÓN DE CRC

El backend está calculando CRC: 423E
El CRC correcto debe ser: 8680

Este código calcula el CRC correctamente según estándar EMV.
"""

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


# Ejemplo de uso:
payload_sin_crc = "00020101021226490002AR012201103432300343175379290213SALE-A7FA937452045492530303254064800005802AR5912Toludev shop6009Argentina62170513SALE-A7FA9374"

# Calcular CRC
data_para_crc = payload_sin_crc + "6304"
crc = calculate_crc16_ccitt(data_para_crc)
crc_hex = f"{crc:04X}"

print(f"CRC calculado: {crc_hex}")  # Debe ser: 8680
print(f"Payload completo: {payload_sin_crc}6304{crc_hex}")

# Verificación
assert crc_hex == "8680", f"CRC incorrecto: esperado 8680, obtenido {crc_hex}"

