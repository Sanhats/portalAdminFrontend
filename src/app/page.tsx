// En Next.js, los grupos de rutas (carpetas entre paréntesis) no afectan la URL
// Por lo tanto, (store)/page.tsx ya está disponible en la ruta raíz "/"
// Este archivo puede eliminarse o redirigir, pero para evitar conflictos lo dejamos vacío
// y la ruta real está en (store)/page.tsx
export { default } from "./(store)/page";
