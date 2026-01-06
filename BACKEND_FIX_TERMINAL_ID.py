# ═══════════════════════════════════════════════════════════════════════
# SOLUCIÓN URGENTE: Corregir Terminal ID en Campo 26
# ═══════════════════════════════════════════════════════════════════════

# ❌ CÓDIGO ACTUAL (INCORRECTO):
# ────────────────────────────────────────────────────────────────────────
# En la función que genera el campo 26, probablemente hay algo como:

terminal_id = f"SALE-{reference}"  # ❌ Variable, cambia cada vez

# O algo como:
terminal_id = payment_reference  # ❌ Variable


# ✅ CÓDIGO CORRECTO (SOLUCIÓN):
# ────────────────────────────────────────────────────────────────────────

# Opción 1: Terminal ID fijo simple
terminal_id = "TERMINAL01"  # ✅ Fijo, siempre el mismo

# Opción 2: Terminal ID basado en el ID de la tienda/comercio
terminal_id = f"POS{store_id}"  # ✅ Fijo por tienda

# Opción 3: Usar un ID único del comercio configurado
terminal_id = merchant_config.get('terminal_id', 'TERMINAL01')  # ✅ Fijo


# ═══════════════════════════════════════════════════════════════════════
# FUNCIÓN COMPLETA CORREGIDA
# ═══════════════════════════════════════════════════════════════════════

def generar_campo_26_interoperable(cbu_o_cvu, terminal_id="TERMINAL01"):
    """
    Genera el campo 26 (Merchant Account Information) para QR interoperable Argentina
    
    Args:
        cbu_o_cvu (str): CBU o CVU del comercio (22 dígitos)
        terminal_id (str): ID fijo del terminal/POS (DEBE SER FIJO, NO VARIABLE)
    
    Returns:
        str: Campo 26 completo en formato EMV
        
    Ejemplo:
        >>> generar_campo_26_interoperable("0110343230034317537929", "TERMINAL01")
        "26430002AR01220110343230034317537929020ATERMINAL01"
    """
    # Validar CBU/CVU
    if len(cbu_o_cvu) != 22:
        raise ValueError(f"CBU/CVU debe tener 22 dígitos, tiene {len(cbu_o_cvu)}")
    
    # Subcampo 00: País (Argentina)
    subcampo_pais = "0002AR"
    
    # Subcampo 01: CBU/CVU del comercio
    subcampo_cbu = f"01{len(cbu_o_cvu):02d}{cbu_o_cvu}"
    
    # Subcampo 02: Terminal ID (FIJO - NO usar referencia de pago)
    # ⚠️ IMPORTANTE: Este debe ser un ID FIJO del terminal/POS
    # NO debe cambiar entre transacciones
    subcampo_terminal = f"02{len(terminal_id):02d}{terminal_id}"
    
    # Unir todos los subcampos
    mai_completo = subcampo_pais + subcampo_cbu + subcampo_terminal
    
    # Campo 26 completo con su longitud
    campo_26 = f"26{len(mai_completo):02d}{mai_completo}"
    
    return campo_26


# ═══════════════════════════════════════════════════════════════════════
# EJEMPLO DE USO EN EL CÓDIGO QUE GENERA EL QR
# ═══════════════════════════════════════════════════════════════════════

def generar_qr_interoperable(amount, cbu, reference, merchant_name, city):
    """
    Genera un QR interoperable completo
    """
    # ═══════════════════════════════════════════════════════════════
    # ⚠️ CAMBIO CRÍTICO AQUÍ:
    # ═══════════════════════════════════════════════════════════════
    
    # ❌ ANTES (INCORRECTO):
    # campo_26 = generar_campo_26_interoperable(cbu, f"SALE-{reference}")
    
    # ✅ AHORA (CORRECTO):
    # Usar un Terminal ID fijo
    terminal_id_fijo = "TERMINAL01"  # O cualquier ID fijo que uses
    campo_26 = generar_campo_26_interoperable(cbu, terminal_id_fijo)
    
    # ═══════════════════════════════════════════════════════════════
    
    # Construir payload EMV
    payload = ""
    
    # 00 - Payload Format Indicator
    payload += "000201"
    
    # 01 - Point of Initiation Method
    payload += "010212"
    
    # 26 - Merchant Account Information (con Terminal ID FIJO)
    payload += campo_26
    
    # 52 - Merchant Category Code
    payload += "52045492"
    
    # 53 - Transaction Currency (ARS = 032)
    payload += "5303032"
    
    # 54 - Transaction Amount (en centavos, sin decimales)
    amount_str = str(int(amount * 100))
    payload += f"54{len(amount_str):02d}{amount_str}"
    
    # 58 - Country Code
    payload += "5802AR"
    
    # 59 - Merchant Name
    payload += f"59{len(merchant_name):02d}{merchant_name}"
    
    # 60 - Merchant City
    payload += f"60{len(city):02d}{city}"
    
    # 62 - Additional Data Field Template
    # ⚠️ IMPORTANTE: La referencia variable va AQUÍ, no en el campo 26
    reference_field = f"05{len(reference):02d}{reference}"
    payload += f"62{len(reference_field):02d}{reference_field}"
    
    # 63 - CRC (calculado al final)
    payload += "6304"
    
    # Calcular CRC16-CCITT
    crc = calcular_crc16_ccitt(payload)
    payload += f"{crc:04X}"
    
    return payload


def calcular_crc16_ccitt(data):
    """
    Calcula CRC16-CCITT para EMVCo QR Code
    
    Args:
        data (str): String sin el CRC (debe terminar en "6304")
    
    Returns:
        int: CRC calculado como entero
    """
    crc = 0xFFFF
    poly = 0x1021
    
    for byte in data.encode('utf-8'):
        crc ^= (byte << 8)
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ poly
            else:
                crc = crc << 1
            crc &= 0xFFFF
    
    return crc


# ═══════════════════════════════════════════════════════════════════════
# EJEMPLO COMPLETO
# ═══════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Datos de ejemplo
    cbu = "0110343230034317537929"  # 22 dígitos
    terminal_id = "TERMINAL01"       # ID fijo
    amount = 150.00                  # 150 ARS
    reference = "SALE-EC08FEBC"      # Referencia variable
    merchant_name = "Toludev shop"
    city = "Argentina"
    
    # Generar QR
    payload = generar_qr_interoperable(
        amount=amount,
        cbu=cbu,
        reference=reference,
        merchant_name=merchant_name,
        city=city
    )
    
    print("Payload EMV generado:")
    print(payload)
    print(f"\nLongitud: {len(payload)} caracteres")
    
    # Verificar campo 26
    campo_26_match = payload[payload.find("26"):payload.find("26") + 50]
    print(f"\nCampo 26: {campo_26_match}")
    print(f"✅ Contiene Terminal ID fijo: TERMINAL01")
    
    # Verificar campo 62
    campo_62_match = payload[payload.find("62"):payload.find("63")]
    print(f"\nCampo 62: {campo_62_match}")
    print(f"✅ Contiene referencia variable: {reference}")


# ═══════════════════════════════════════════════════════════════════════
# RESUMEN DE CAMBIOS
# ═══════════════════════════════════════════════════════════════════════
"""
✅ CAMBIO NECESARIO:

1. En el campo 26, subcampo 02: Usar Terminal ID FIJO
   ❌ Antes: f"SALE-{reference}"  (variable)
   ✅ Ahora: "TERMINAL01"          (fijo)

2. La referencia de pago sigue en el campo 62 (correcto)

⏱️  Tiempo: ~10 minutos
🎯 Prioridad: MÁXIMA
📊 Impacto: Soluciona el problema de escaneo en TODAS las billeteras
"""

