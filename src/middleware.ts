import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // El middleware no puede acceder a localStorage
  // La protección real se hace en el layout del admin
  // Este middleware solo redirige la raíz
  if (pathname === "/") {
    // Permitir que el componente cliente maneje la redirección
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/login"],
};

