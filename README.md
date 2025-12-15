# Portal Admin Frontend

Frontend del panel de administración construido con Next.js, TypeScript y Tailwind CSS.

## Configuración

### Instalación

```bash
npm install
```

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con la siguiente configuración:

```
NEXT_PUBLIC_API_URL=https://portal-admin-black.vercel.app/api
```

**Nota:** El archivo `.env.local` está en `.gitignore` y no se sube al repositorio por seguridad.

### Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Build

```bash
npm run build
npm start
```

## Estructura del Proyecto

- `src/lib/api-client.ts` - Cliente API para comunicación con el backend
- `src/app/` - Páginas y componentes de Next.js App Router

## Tecnologías

- Next.js 14
- TypeScript
- Tailwind CSS
- ESLint
- Prettier

