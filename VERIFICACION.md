# Guía de Verificación - SPRINT 4

## Pasos para Verificar que Todo Funciona Correctamente

### 1. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

El servidor debería iniciar en `http://localhost:3000`

### 2. Verificar Rutas Públicas (Storefront)

#### ✅ Página Principal (Home)
- **URL**: `http://localhost:3000/`
- **Verificar**:
  - [ ] Se muestra el hero section con "Bienvenido a Mi Tienda"
  - [ ] Se cargan productos destacados (si existen)
  - [ ] Se muestra la sección "Nuestros Productos"
  - [ ] El botón WhatsApp flotante aparece en la esquina inferior derecha
  - [ ] El header muestra "Mi Tienda" y el menú de navegación
  - [ ] El footer se muestra al final

#### ✅ Listado de Productos
- **URL**: `http://localhost:3000/products`
- **Verificar**:
  - [ ] Se muestra el título "Productos"
  - [ ] Aparecen los filtros de categorías (botones)
  - [ ] Se cargan los productos en grid
  - [ ] Cada producto muestra: imagen, nombre, precio, stock
  - [ ] La paginación funciona (si hay más de 12 productos)
  - [ ] Al hacer clic en un producto, navega al detalle

#### ✅ Filtro por Categoría
- **URL**: `http://localhost:3000/products`
- **Verificar**:
  - [ ] El botón "Todas" muestra todos los productos
  - [ ] Al hacer clic en una categoría, se filtran los productos
  - [ ] El botón de categoría activa se resalta (azul)
  - [ ] La paginación se reinicia al cambiar de categoría

#### ✅ Detalle de Producto
- **URL**: `http://localhost:3000/products/[id]` (reemplazar [id] con un ID real)
- **Verificar**:
  - [ ] Se muestra la imagen principal del producto
  - [ ] Si hay múltiples imágenes, se muestran thumbnails
  - [ ] Se muestra el nombre, precio y stock
  - [ ] Se muestra la descripción (si existe)
  - [ ] Si hay variantes, se muestran y se pueden seleccionar
  - [ ] El precio se actualiza según la variante seleccionada
  - [ ] El botón "Consultar por WhatsApp" funciona
  - [ ] El botón "← Volver a productos" funciona

#### ✅ Página de Categoría
- **URL**: `http://localhost:3000/categories/[id]` (reemplazar [id] con un ID real)
- **Verificar**:
  - [ ] Se muestra el nombre de la categoría
  - [ ] Se muestran solo los productos de esa categoría
  - [ ] La paginación funciona correctamente

### 3. Verificar Responsive Design

#### ✅ Desktop (pantalla grande)
- [ ] El menú de navegación se muestra horizontalmente
- [ ] El grid de productos muestra 4 columnas en pantallas grandes
- [ ] El header tiene todos los elementos visibles

#### ✅ Tablet
- [ ] El grid de productos muestra 3 columnas
- [ ] El menú sigue siendo horizontal

#### ✅ Móvil
- [ ] El menú hamburguesa aparece
- [ ] Al hacer clic, se despliega el menú móvil
- [ ] El grid de productos muestra 1 columna
- [ ] El botón WhatsApp flotante es accesible
- [ ] Todos los botones son táctiles (tamaño adecuado)

### 4. Verificar Funcionalidades Específicas

#### ✅ Botón WhatsApp
- [ ] El botón flotante aparece en todas las páginas públicas
- [ ] Al hacer clic, abre WhatsApp Web/App
- [ ] El mensaje predeterminado es "Hola, me interesa un producto"
- [ ] En el detalle de producto, el mensaje incluye el nombre del producto
- [ ] Si hay variante seleccionada, el mensaje incluye la variante

#### ✅ Navegación
- [ ] El logo "Mi Tienda" lleva a la home
- [ ] El enlace "Inicio" lleva a la home
- [ ] El enlace "Productos" lleva al listado
- [ ] Los enlaces de categorías en el menú funcionan
- [ ] El enlace "Admin" lleva al panel de administración (requiere login)

#### ✅ Carga de Datos
- [ ] Los productos se cargan desde la API
- [ ] Se muestra un spinner de carga mientras se obtienen los datos
- [ ] Si no hay productos, se muestra un mensaje apropiado
- [ ] Si hay error, no se rompe la aplicación

### 5. Verificar Consola del Navegador

Abre las DevTools (F12) y verifica:
- [ ] No hay errores en la consola
- [ ] Las peticiones a la API se realizan correctamente
- [ ] No hay warnings de React

### 6. Verificar Variables de Entorno

Asegúrate de tener configurado `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://portal-admin-black.vercel.app/api
NEXT_PUBLIC_WHATSAPP_NUMBER=1234567890  # Opcional, por defecto usa 1234567890
```

### 7. Checklist de Funcionalidades Core

- [ ] **Home**: Muestra productos destacados y recientes
- [ ] **Listado**: Muestra todos los productos con paginación
- [ ] **Filtros**: Filtra por categoría correctamente
- [ ] **Detalle**: Muestra toda la información del producto
- [ ] **Variantes**: Permite seleccionar variantes (si existen)
- [ ] **WhatsApp**: Botón funcional en todas las páginas
- [ ] **Responsive**: Funciona en móvil, tablet y desktop
- [ ] **Navegación**: Todos los enlaces funcionan correctamente

## Problemas Comunes y Soluciones

### ❌ "No hay productos disponibles"
- **Causa**: No hay productos en la base de datos o error en la API
- **Solución**: Verifica que el backend esté funcionando y que haya productos creados

### ❌ "Error al cargar categorías"
- **Causa**: Error en la petición a la API
- **Solución**: Verifica la URL de la API en `.env.local` y que el backend esté disponible

### ❌ El botón WhatsApp no funciona
- **Causa**: Número de WhatsApp no configurado o formato incorrecto
- **Solución**: Verifica `NEXT_PUBLIC_WHATSAPP_NUMBER` en `.env.local` (solo números, sin + ni espacios)

### ❌ Las imágenes no se cargan
- **Causa**: URLs de imágenes incorrectas o CORS
- **Solución**: Verifica que las URLs de las imágenes sean accesibles públicamente

### ❌ El menú móvil no se despliega
- **Causa**: Error de JavaScript
- **Solución**: Revisa la consola del navegador para errores

## Pruebas Recomendadas

1. **Prueba de flujo completo**:
   - Ir a home → Ver productos → Filtrar por categoría → Ver detalle → Consultar por WhatsApp

2. **Prueba de navegación**:
   - Navegar entre todas las páginas usando el menú
   - Verificar que el breadcrumb "Volver" funcione

3. **Prueba de responsive**:
   - Redimensionar la ventana del navegador
   - Probar en diferentes dispositivos (o usar DevTools device mode)

4. **Prueba de carga**:
   - Verificar que los estados de carga se muestren correctamente
   - Verificar que los errores se manejen apropiadamente

## Resultado Esperado

✅ **"El comercio ya tiene una tienda online"**

La tienda debe ser completamente funcional, responsive y permitir a los clientes:
- Ver productos
- Filtrar por categoría
- Ver detalles de productos
- Contactar por WhatsApp

