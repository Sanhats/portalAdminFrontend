# 🔧 Solución Temporal: Corrección de CRC en Frontend

## ⚠️ IMPORTANTE

Esta es una **solución temporal** mientras se corrige el cálculo del CRC en el backend.

**La solución correcta es corregir el backend** según `CORRECCION_CRC_BACKEND_URGENTE.md`.

---

## ✅ Qué hace esta solución

1. **Detecta CRC incorrecto**: Valida el CRC del payload que viene del backend
2. **Corrige el payload**: Recalcula el CRC correcto
3. **Regenera el QR**: Genera un nuevo QR con el payload corregido
4. **Muestra el QR corregido**: El usuario ve un QR escaneable

---

## 📦 Instalación Requerida

Para que funcione completamente, necesitas instalar la librería QR:

```bash
npm install qrcode
npm install --save-dev @types/qrcode
```

---

## 🔧 Cómo Funciona

### 1. Función de Corrección (`src/lib/qr-crc-fix.ts`)

- `fixQRPayloadCRC()`: Corrige el CRC del payload
- `generateQRCodeFromPayload()`: Regenera el QR con el payload corregido
- `fixQRCodeImage()`: Función principal que corrige el QR completo

### 2. Componentes Actualizados

- **`PaymentQRDisplay`**: Corrige automáticamente el QR al mostrarlo
- **`PaymentQRModal`**: Corrige automáticamente el QR en el modal

---

## 🎯 Flujo de Corrección

```
Backend envía QR con CRC incorrecto
    ↓
Frontend detecta CRC incorrecto
    ↓
Frontend recalcula CRC correcto
    ↓
Frontend regenera QR con payload corregido
    ↓
Usuario ve QR escaneable ✅
```

---

## ⚠️ Limitaciones

1. **Requiere librería QR**: Necesitas instalar `qrcode`
2. **Solo corrige en frontend**: El backend sigue generando QRs incorrectos
3. **Solución temporal**: Debe corregirse en el backend

---

## ✅ Después de Corregir el Backend

Una vez que el backend calcule el CRC correctamente:

1. El frontend detectará que el CRC ya es correcto
2. No regenerará el QR (usará el del backend)
3. Puedes remover esta solución temporal si quieres

---

## 🧪 Verificación

Ejecuta `validarTodo()` en la consola:

- **Antes**: `❌ CRC INCORRECTO`
- **Después (con esta solución)**: El QR debería ser escaneable aunque el CRC del backend sea incorrecto

---

**Última actualización:** Diciembre 2024  
**Estado:** ⚠️ Solución temporal - Corregir backend es la solución definitiva

