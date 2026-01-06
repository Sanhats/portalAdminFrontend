# 📋 Contrato QR Interoperable - Frontend

## 🎯 Principios del Frontend

### ✅ Lo que el Frontend HACE:
- ✅ **Muestra el QR** (base64 o URL)
- ✅ **Muestra la referencia** (CLAVE para matching automático)
- ✅ **Escucha el estado** (polling cada 5s)
- ✅ **Muestra instrucciones claras** de cómo pagar
- ✅ **Confirma asistida** solo si backend lo sugiere

### ❌ Lo que el Frontend NO hace:
- ❌ **NO interpreta el QR** (no lee el payload)
- ❌ **NO confirma desde frontend** (solo si backend lo sugiere)
- ❌ **NO depende de billetera específica** (funciona con todas)
- ❌ **NO usa librerías QR** (solo muestra la imagen)

---

## 📦 Contrato del Backend

### Estructura de Respuesta Esperada

```json
{
  "id": "payment-id",
  "status": "pending",
  "amount": 1000,
  "gateway": "interoperable_qr",
  "gateway_metadata": {
    "qr_code": "data:image/png;base64,iVBORw0KGgo...",
    "qr_payload": "000201010212...",
    "reference": "SALE-8F3A",
    "provider": "interoperable_qr",
    "expires_at": "2024-12-23T12:00:00Z",
    "confidence": 0.78,
    "suggested_transfer": { ... }
  }
}
```

### Campos Importantes

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `gateway_metadata.qr_code` | string | Base64 data URL o URL de imagen | ✅ Sí |
| `gateway_metadata.reference` | string | Referencia de pago (CLAVE) | ✅ Sí |
| `gateway_metadata.provider` | string | Proveedor usado | ⚠️ Opcional |
| `gateway_metadata.expires_at` | string | ISO date string | ⚠️ Opcional |
| `gateway_metadata.confidence` | number | 0-1, para confirmación asistida | ⚠️ Opcional |
| `gateway_metadata.suggested_transfer` | object | Datos de transferencia sugerida | ⚠️ Opcional |

---

## 🧱 Componentes Implementados

### 1️⃣ PaymentQRModal (Vista Principal)

**Responsabilidades:**
- ✅ Renderizar QR (base64)
- ✅ Mostrar referencia prominentemente
- ✅ Explicar cómo pagar (instrucciones claras)
- ✅ Mostrar estado en tiempo real (polling)
- ✅ Confirmación asistida si backend lo sugiere

**Estructura UI:**
```
<Card>
  <Header con estado visual />
  <Monto destacado />
  <QRCodeImage />
  <PaymentReference destacada />
  <PaymentInstructions />
  <PaymentStatus />
  <Confirmación asistida (si aplica) />
</Card>
```

### 2️⃣ PaymentQRDisplay (Componente Reutilizable)

**Responsabilidades:**
- ✅ Renderizar QR
- ✅ Mostrar referencia (opcional)
- ✅ Manejar expiración

**Uso:**
```tsx
<PaymentQRDisplay 
  payment={payment} 
  showExpiration={true}
  showReference={true}
/>
```

---

## 🔄 Flujo Completo

### 1. Crear Pago QR
```
Usuario → Selecciona método QR → Ingresa monto → Crea pago
```

### 2. Backend Genera QR Interoperable
```
Backend → Genera QR → Devuelve gateway_metadata con qr_code y reference
```

### 3. Frontend Renderiza QR + Referencia
```
Frontend → Muestra QR base64 → Muestra referencia destacada → Instrucciones claras
```

### 4. Cliente Paga con Billetera
```
Cliente → Escanea QR → Paga monto → Usa referencia
```

### 5. Backend Detecta Transferencia
```
Backend → Detecta transferencia → Matching por referencia → Actualiza status
```

### 6. Frontend Se Actualiza Automáticamente
```
Polling (5s) → Status cambia a "confirmed" → UI se actualiza
```

---

## 📊 Estados Visuales

### Pending (Esperando Pago)
```tsx
<Badge variant="warning">
  <Loader2 className="animate-spin" />
  Esperando pago
</Badge>
```

### Confirmado
```tsx
<Badge variant="success">
  <CheckCircle />
  Confirmado ✅
</Badge>
```

### Sugerido (Confirmación Asistida)
```tsx
<Badge variant="info">
  <AlertCircle />
  Transferencia detectada – confirmar
</Badge>
<Button onClick={confirmPayment}>
  Confirmar pago detectado
</Button>
```

---

## 🎨 Referencia de Pago (CLAVE)

### Visualización Prominente

La referencia se muestra en un card destacado:

```tsx
<div className="bg-blue-500/10 border border-blue-500/30">
  <div className="text-blue-400 font-semibold">
    ⚠️ Referencia de pago
  </div>
  <code className="text-lg font-mono font-bold">
    {payment.gateway_metadata.reference}
  </code>
  <div className="text-blue-300/80 text-xs">
    Usá esta referencia al pagar para que el sistema lo confirme automáticamente
  </div>
  <Button onClick={copyReference}>
    <Copy /> Copiar referencia
  </Button>
</div>
```

### Prioridad de Referencia

1. `gateway_metadata.reference` (prioridad)
2. `payment.reference` (fallback)
3. `payment.external_reference` (fallback)

---

## 📝 Instrucciones de Pago

### Texto Mostrado al Usuario

```
Cómo pagar:

1. Escaneá el QR con cualquier billetera (Mercado Pago, Ualá, etc.)
2. Pagá el monto indicado: $1,000.00
3. Usá la referencia mostrada al realizar el pago
4. El pago se confirmará automáticamente
```

---

## 🔁 Polling de Estado

### Implementación

```tsx
useEffect(() => {
  if (payment.status !== 'pending') return;

  const interval = setInterval(async () => {
    const updated = await fetchPayment(payment.id);
    setPayment(updated);
  }, 5000); // Cada 5 segundos

  return () => clearInterval(interval);
}, [payment.id, payment.status]);
```

### Comportamiento

- ✅ **Cada 5 segundos** mientras está `pending`
- ✅ **Se detiene** cuando status cambia a `confirmed` o `failed`
- ✅ **Backend decide** el estado final
- ✅ **Frontend solo refleja** el estado

---

## ✅ Confirmación Asistida

### Cuándo se Muestra

Si el backend devuelve:
```json
{
  "gateway_metadata": {
    "confidence": 0.78,
    "suggested_transfer": { ... }
  }
}
```

Y `confidence > 0.5`, se muestra:

```tsx
<div className="bg-green-500/10 border border-green-500/30">
  <CheckCircle />
  <div>Transferencia detectada</div>
  <div>Confianza: 78%</div>
  <Button onClick={confirmPayment}>
    Confirmar pago detectado
  </Button>
</div>
```

### Acción

Al hacer click en "Confirmar pago detectado":
```tsx
await api.confirmPayment(payment.id);
```

---

## 🚨 Errores que NO se Cometen

### ❌ NO Interpretar el QR
```tsx
// ❌ MAL
const qrData = decodeQR(qrCode); // NO hacer esto

// ✅ BIEN
<img src={qrCode} alt="QR Code" /> // Solo mostrar
```

### ❌ NO Confirmar desde Frontend
```tsx
// ❌ MAL
if (amountMatches) {
  confirmPayment(); // NO hacer esto automáticamente
}

// ✅ BIEN
if (backendSuggestsConfirmation) {
  showConfirmationButton(); // Solo mostrar botón
}
```

### ❌ NO Depender de Billetera Específica
```tsx
// ❌ MAL
if (isMercadoPago) { ... } // NO hacer esto

// ✅ BIEN
// Funciona con todas las billeteras
```

### ❌ NO UX sin Referencia Visible
```tsx
// ❌ MAL
<div>{payment.reference}</div> // Muy pequeño, no visible

// ✅ BIEN
<div className="bg-blue-500/10 border border-blue-500/30">
  <code className="text-lg font-mono font-bold">
    {payment.gateway_metadata.reference}
  </code>
</div>
```

---

## 🧪 Checklist de Implementación

### Frontend
- [x] Render QR base64
- [x] Mostrar reference claramente
- [x] Polling de estado (5s)
- [x] Estados visuales claros
- [x] CTA solo si backend lo indica
- [x] Mensaje de "esperando pago"
- [x] Instrucciones claras de cómo pagar
- [x] Confirmación asistida si backend sugiere

### Backend (Requerido)
- [ ] Generar QR interoperable
- [ ] Devolver `gateway_metadata.qr_code` (base64)
- [ ] Devolver `gateway_metadata.reference`
- [ ] Detectar transferencias por referencia
- [ ] Actualizar status automáticamente
- [ ] (Opcional) Sugerir confirmación con `confidence`

---

## 📚 Archivos Modificados

### Tipos
- `src/types/payments.ts` - Actualizado con estructura de `gateway_metadata`

### Componentes
- `src/components/PaymentQRModal.tsx` - Vista principal mejorada
- `src/components/PaymentQRDisplay.tsx` - Componente reutilizable mejorado

### Funcionalidades
- ✅ Referencia destacada
- ✅ Instrucciones claras
- ✅ Estados visuales mejorados
- ✅ Confirmación asistida
- ✅ Polling automático

---

## 💡 Notas Importantes

1. **El QR no confirma nada** - Solo es una imagen
2. **El estado manda** - `pending → confirmed` es decisión del backend
3. **El usuario ve qué hacer** - Instrucciones claras reducen tickets
4. **El sistema se actualiza solo** - Polling automático cada 5s

---

**Última actualización:** Diciembre 2024

