# 🔧 Requerimientos Backend - QR Interoperable

## ❌ Problema Actual

Las billeteras digitales (Mercado Pago, Naranja X, etc.) **NO pueden leer el QR** que se está generando, mostrando el mensaje:

> "Por el momento, no podemos leer este QR. Estamos trabajando para que puedas pagar con este tipo de códigos."

### 🔍 Problema Detectado en Logs

Según los logs del backend, el QR se está generando correctamente:
```
[generateInteroperableQR] QR interoperable generado: {
  reference: 'SALE-EE06E5F0',
  amount: 11800,
  provider: 'interoperable_qr'
}
```

**PERO** el backend **NO está devolviendo** `qr_code` ni `qr_payload` en `gateway_metadata` en la respuesta al frontend.

---

## 🎯 Causa del Problema

1. **El QR se genera** pero **NO se devuelve** en `gateway_metadata.qr_code`
2. El QR generado **NO sigue el estándar interoperable** requerido por las billeteras digitales argentinas
3. Falta `qr_payload` EMV válido en la respuesta

### Estándares Requeridos

Para que un QR sea escaneable por Mercado Pago, Naranja X, Ualá, etc., debe seguir:

1. **EMVCo QR Code Standard** (Estándar internacional)
2. **Formato específico de Argentina** (según regulaciones del BCRA)

---

## ✅ Solución: QR Interoperable Válido

### Estructura Requerida del QR

El QR debe contener un **payload EMV** con la siguiente estructura:

```
00020101021243...
```

Donde:
- `00` = Payload Format Indicator (debe ser "01")
- `02` = Point of Initiation Method
- `01` = Merchant Account Information
- `52` = Merchant Category Code
- `53` = Transaction Currency (ARS = 032)
- `54` = Transaction Amount
- `58` = Country Code (AR = 058)
- `59` = Merchant Name
- `60` = Merchant City
- `62` = Additional Data Field Template (para referencia)
```

### Ejemplo de Payload EMV Válido

```
00020101021243650016COM.MERCADOLIVRE02008XXXXXXXX0414123456780105123456702AR5913MERCADO PAGO6009BUENOS AIRES62070503***6304ABCD
```

**Estructura decodificada:**
- `00` `02` `01` = Payload Format Indicator: "01"
- `01` `12` = Merchant Account Information (12 caracteres)
- `52` `04` `0000` = Merchant Category Code: "0000"
- `53` `03` `032` = Currency: ARS
- `54` `06` `100.00` = Amount: 100.00
- `58` `02` `AR` = Country: Argentina
- `59` `13` `MERCADO PAGO` = Merchant Name
- `60` `09` `BUENOS AIRES` = City
- `62` `07` `0503***` = Additional Data (reference)
- `63` `04` `ABCD` = CRC (checksum)

---

## 🔧 Solución Inmediata: Devolver QR en la Respuesta

### ⚠️ Problema Crítico Detectado

El backend está generando el QR pero **NO lo está devolviendo** en `gateway_metadata`:

```javascript
// ❌ ACTUAL (incorrecto)
{
  reference: 'SALE-EE06E5F0',
  amount: 11800,
  provider: 'interoperable_qr'
  // ❌ Falta qr_code
  // ❌ Falta qr_payload
}

// ✅ REQUERIDO (correcto)
{
  gateway_metadata: {
    qr_code: "data:image/png;base64,iVBORw0KGgo...",  // ← REQUERIDO
    qr_payload: "000201010212...",                    // ← REQUERIDO
    reference: "SALE-EE06E5F0",                       // ← REQUERIDO
    provider: "interoperable_qr",                     // ← REQUERIDO
    expires_at: "2024-12-23T12:00:00Z"               // ← Opcional
  }
}
```

### ✅ Código de Ejemplo para Backend

```javascript
// Después de generar el QR interoperable
const qrResult = await generateInteroperableQR({
  amount: paymentData.amount,
  reference: reference,
  // ... otros parámetros
});

// ✅ IMPORTANTE: Devolver en gateway_metadata
payment.gateway_metadata = {
  qr_code: qrResult.qr_code_base64,      // Base64 de la imagen QR
  qr_payload: qrResult.qr_payload,        // Payload EMV
  reference: qrResult.reference,
  provider: 'interoperable_qr',
  expires_at: qrResult.expires_at
};

// Guardar en base de datos
await db.savePayment(payment);

// ✅ Devolver en la respuesta
return payment; // Debe incluir gateway_metadata completo
```

---

## 📋 Implementación en el Backend

### Opción 1: Usar Librería EMV QR Code Generator

#### Python (Ejemplo)

```python
import qrcode
from qrcode.constants import ERROR_CORRECT_L

def generate_interoperable_qr(
    amount: float,
    reference: str,
    merchant_name: str,
    merchant_city: str = "Buenos Aires",
    merchant_account: str = None
) -> dict:
    """
    Genera un QR interoperable siguiendo el estándar EMV
    """
    # Construir payload EMV
    payload = build_emv_payload(
        amount=amount,
        reference=reference,
        merchant_name=merchant_name,
        merchant_city=merchant_city,
        merchant_account=merchant_account
    )
    
    # Generar QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(payload)
    qr.make(fit=True)
    
    # Crear imagen
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convertir a base64
    import io
    import base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return {
        "qr_code": f"data:image/png;base64,{img_base64}",
        "qr_payload": payload,
        "reference": reference,
        "provider": "interoperable_qr",
        "expires_at": None  # O calcular según necesidad
    }

def build_emv_payload(
    amount: float,
    reference: str,
    merchant_name: str,
    merchant_city: str,
    merchant_account: str = None
) -> str:
    """
    Construye el payload EMV según el estándar
    """
    # Payload Format Indicator
    payload = "000201"
    
    # Point of Initiation Method (12 = static QR)
    payload += "010212"
    
    # Merchant Account Information
    if merchant_account:
        account_len = len(merchant_account)
        payload += f"01{account_len:02d}{merchant_account}"
    
    # Merchant Category Code (0000 = sin categoría específica)
    payload += "52040000"
    
    # Transaction Currency (032 = ARS)
    payload += "5303032"
    
    # Transaction Amount
    amount_str = f"{amount:.2f}"
    amount_len = len(amount_str)
    payload += f"54{amount_len:02d}{amount_str}"
    
    # Country Code (AR = Argentina)
    payload += "5802AR"
    
    # Merchant Name
    name_len = len(merchant_name)
    payload += f"59{name_len:02d}{merchant_name}"
    
    # Merchant City
    city_len = len(merchant_city)
    payload += f"60{city_len:02d}{merchant_city}"
    
    # Additional Data Field Template (para referencia)
    ref_len = len(reference)
    payload += f"62{ref_len+3:02d}05{ref_len:02d}{reference}"
    
    # CRC (checksum) - calcular
    crc = calculate_crc16(payload + "6304")
    payload += f"6304{crc:04X}"
    
    return payload

def calculate_crc16(data: str) -> int:
    """
    Calcula CRC16 para el payload EMV
    """
    # Implementación de CRC16 según estándar EMV
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
```

### Opción 2: Usar API de Proveedor de Pagos

#### Mercado Pago QR Code API

```python
import mercadopago

def generate_mercadopago_qr_interoperable(
    amount: float,
    reference: str,
    access_token: str
) -> dict:
    """
    Genera QR interoperable usando API de Mercado Pago
    """
    mp = mercadopago.MP(access_token)
    
    # Crear orden QR interoperable
    order_data = {
        "external_reference": reference,
        "title": f"Pago - {reference}",
        "description": f"Pago de {amount}",
        "total_amount": float(amount),
        "items": [
            {
                "title": "Pago",
                "quantity": 1,
                "unit_price": float(amount)
            }
        ],
        "notification_url": "https://tu-backend.com/webhooks/mercadopago"
    }
    
    # Crear QR usando API In-Store
    response = mp.post(
        "/instore/orders/qr/seller/collectors/{user_id}/pos/{external_pos_id}/qrs",
        order_data
    )
    
    if response["status"] == 201:
        qr_data = response["response"]
        return {
            "qr_code": qr_data.get("qr_code_base64") or qr_data.get("qr_code"),
            "qr_payload": qr_data.get("qr_data"),  # Payload EMV
            "reference": reference,
            "provider": "mercadopago_interoperable",
            "expires_at": qr_data.get("expires_at")
        }
    else:
        raise Exception(f"Error al generar QR: {response}")
```

---

## 📝 Estructura de Respuesta Requerida

### Cuando se crea un pago QR, el backend debe devolver:

```json
{
  "id": "payment-id",
  "status": "pending",
  "amount": 1000,
  "gateway": "interoperable_qr",
  "gateway_metadata": {
    "qr_code": "data:image/png;base64,iVBORw0KGgo...",
    "qr_payload": "00020101021243650016COM.MERCADOLIVRE...",
    "reference": "SALE-8F3A",
    "provider": "interoperable_qr",
    "expires_at": "2024-12-23T12:00:00Z"
  }
}
```

### Campos Críticos

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| `gateway_metadata.qr_code` | ✅ Sí | Base64 data URL de la imagen QR |
| `gateway_metadata.qr_payload` | ⚠️ Recomendado | Payload EMV del QR (para debugging) |
| `gateway_metadata.reference` | ✅ Sí | Referencia de pago (CLAVE) |
| `gateway_metadata.provider` | ✅ Sí | Debe ser `"interoperable_qr"` |
| `gateway` | ✅ Sí | Debe ser `"interoperable_qr"` |

---

## 🧪 Cómo Verificar que el QR es Válido

### 1. Verificar Payload EMV

El payload debe:
- ✅ Empezar con `000201`
- ✅ Contener código de país `AR`
- ✅ Contener moneda `032` (ARS)
- ✅ Contener monto válido
- ✅ Terminar con CRC válido (`6304XXXX`)

### 2. Analizar Payload EMV Detalladamente

Usar el script `scripts/analizar-payload-emv.js` para decodificar y analizar el payload:

```javascript
// En la consola del navegador
analizarPayloadEMV("00020101021126920002AR...")
```

Este script:
- ✅ Decodifica todos los campos EMV
- ✅ Verifica campos requeridos
- ✅ Valida formato para Argentina
- ✅ Muestra problemas específicos

### 2. Probar Escaneo

1. Generar QR desde el backend
2. Escanear con app de Mercado Pago
3. **Debe reconocer** el QR y mostrar monto
4. Si dice "no podemos leer este QR" → **QR inválido**

### 3. Usar Script de Diagnóstico

Ejecutar en consola del navegador:
```javascript
// Ver scripts/diagnostico-qr-interoperable.js
```

---

## 🔍 Debugging

### Si el QR no es escaneable:

1. **Verificar payload EMV**
   ```python
   payload = payment.gateway_metadata.qr_payload
   assert payload.startswith('000201'), "Payload debe empezar con 000201"
   ```

2. **Verificar que la imagen QR contiene el payload**
   - Decodificar QR image
   - Extraer texto del QR
   - Comparar con `qr_payload`

3. **Verificar formato de imagen**
   - Debe ser PNG válido
   - Tamaño mínimo: 256x256px
   - Contraste suficiente (negro sobre blanco)

---

## 📚 Referencias

- [EMVCo QR Code Specification](https://www.emvco.com/emv-technologies/qrcodes/)
- [Mercado Pago QR Code API](https://www.mercadopago.com.ar/developers/es/docs/instore-integration/qr-code/qr-code-generation)
- [BCRA - Transferencias Instantáneas](https://www.bcra.gob.ar/)

---

## ✅ Checklist de Implementación

### Backend
- [ ] Generar QR siguiendo estándar EMV
- [ ] Incluir código de país (AR)
- [ ] Incluir moneda (ARS = 032)
- [ ] Incluir monto correctamente formateado
- [ ] Incluir referencia en Additional Data Field
- [ ] Calcular CRC correctamente
- [ ] Devolver `qr_code` como base64
- [ ] Devolver `qr_payload` para debugging
- [ ] Probar escaneo con Mercado Pago
- [ ] Probar escaneo con Naranja X
- [ ] Probar escaneo con Ualá

### Frontend
- [x] Mostrar QR correctamente
- [x] Mostrar referencia destacada
- [x] Script de diagnóstico
- [x] Documentación

---

**Última actualización:** Diciembre 2024

