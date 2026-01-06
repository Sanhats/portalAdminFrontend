# 🔴 SOLUCIÓN URGENTE: QR No Escaneable

## 🚨 Problema Identificado

El QR NO es escaneable porque el **campo 26 (Merchant Account Information) tiene el Terminal ID variable** en lugar de uno fijo.

### Campo 26 Actual (INCORRECTO):

```
0002AR012201103432300343175379290213SALE-EC08FEBC
│     │                           │  │  │
│     │                           │  │  └─ SALE-EC08FEBC (REFERENCIA VARIABLE ❌)
│     │                           │  └──── Longitud: 13
│     │                           └─────── Subcampo 02 (Terminal ID)
│     └─────────────────────────────────── Subcampo 01 (CBU/CVU)
└───────────────────────────────────────── Subcampo 00 (País: AR)
```

**PROBLEMA:** El subcampo 02 usa `SALE-EC08FEBC` (la referencia de pago), que **cambia en cada transacción**.

Las billeteras esperan un **Terminal ID fijo** que identifique al punto de venta, NO la referencia de la transacción.

## ✅ Solución (Backend)

### Cambio Necesario:

El campo 26 debe usar un **Terminal ID fijo**:

```
0002AR01220110343230034317537929020bTERMINAL01
│     │                           │  │  │
│     │                           │  │  └─ TERMINAL01 (ID FIJO ✅)
│     │                           │  └──── Longitud: 10 (0b en hex = 11 en dec)
│     │                           └─────── Subcampo 02 (Terminal ID)
│     └─────────────────────────────────── Subcampo 01 (CBU/CVU)
└───────────────────────────────────────── Subcampo 00 (País: AR)
```

### Código Python (Backend):

```python
# En la función que genera el campo 26

# ❌ INCORRECTO (actual):
terminal_id = f"SALE-{sale_reference}"  # Variable, cambia cada vez

# ✅ CORRECTO (debe ser):
terminal_id = "TERMINAL01"  # Fijo, siempre el mismo
# O usar el ID del comercio/tienda:
terminal_id = f"POS{store_id}"  # Fijo por tienda

# Construir subcampo 02
terminal_id_field = f"02{len(terminal_id):02d}{terminal_id}"

# Ejemplo:
# terminal_id = "TERMINAL01" (10 caracteres)
# terminal_id_field = "020ATERMINAL01" (usando 0A en hex = 10 en dec)
# O si len() devuelve int:
# terminal_id_field = "0210TERMINAL01"
```

### Formato Completo del Campo 26:

```python
def generar_campo_26(cbu_o_cvu, terminal_id="TERMINAL01"):
    """
    Genera el campo 26 (Merchant Account Information) para Argentina
    
    Args:
        cbu_o_cvu: CBU o CVU del comercio (22 dígitos)
        terminal_id: ID fijo del terminal/POS
    
    Returns:
        str: Campo 26 completo en formato EMV
    """
    # Subcampo 00: País
    pais = "0002AR"
    
    # Subcampo 01: CBU/CVU
    cbu_field = f"01{len(cbu_o_cvu):02d}{cbu_o_cvu}"
    
    # Subcampo 02: Terminal ID (FIJO)
    terminal_field = f"02{len(terminal_id):02d}{terminal_id}"
    
    # Unir todos los subcampos
    mai_value = pais + cbu_field + terminal_field
    
    # Campo 26 completo con longitud
    campo_26 = f"26{len(mai_value):02d}{mai_value}"
    
    return campo_26

# Ejemplo de uso:
cbu = "0110343230034317537929"  # 22 dígitos
terminal_id = "TERMINAL01"       # ID fijo
campo_26 = generar_campo_26(cbu, terminal_id)
# Resultado: "26430002AR012201103432300343175379290210TERMINAL01"
```

## 📋 Dónde está la Referencia de Pago

La referencia de pago `SALE-XXXXX` **SÍ debe estar en el QR**, pero en el **campo 62** (Additional Data), NO en el campo 26:

```
Campo 62: 0513SALE-EC08FEBC
          │  │  │
          │  │  └─ Referencia de pago (CORRECTO ✅)
          │  └──── Longitud: 13
          └─────── Subcampo 05 (Reference Label)
```

Esto está **correcto** en el QR actual.

## 🔧 Pasos para Aplicar la Solución

### 1. En el Backend:

Buscar donde se genera el campo 26 y cambiar:

```python
# Buscar algo como:
terminal_id = f"SALE-{reference}"

# Cambiar a:
terminal_id = "TERMINAL01"  # O el ID fijo que uses
```

### 2. Verificar:

Después del cambio, el payload debería verse así:

```
ANTES:
00020101021226490002AR012201103432300343175379290213SALE-EC08FEBC5204...

DESPUÉS:
00020101021226430002AR01220110343230034317537929 0210TERMINAL01 5204...
                                                  └─────────────┘
                                                  Terminal ID fijo
```

### 3. Probar:

1. Generar un nuevo QR
2. Escanear con Mercado Pago o Naranja X
3. ✅ Debería funcionar

## ⏱️ Tiempo Estimado

- **Cambio en código:** 5 minutos
- **Testing:** 5 minutos
- **Total:** ~10 minutos

## 🎯 Prioridad

**MÁXIMA** - Este es el problema que impide que las billeteras escaneen el QR.

## 📝 Notas Adicionales

- El CRC está correcto ✅
- El formato EMV es válido ✅
- Todos los demás campos son correctos ✅
- Solo el Terminal ID está mal ❌

Una vez corregido el Terminal ID, el QR debería ser escaneable por todas las billeteras compatibles con QR interoperables en Argentina.

