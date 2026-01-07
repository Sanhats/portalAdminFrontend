"use client";

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Space_Grotesk, Crimson_Pro } from "next/font/google"
import { isAuthenticated } from "@/lib/auth"
import LoadingSpinner from "@/components/LoadingSpinner"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
})

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson",
  weight: ["300", "400", "500", "600", "700"],
})

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Verificar autenticación
    if (!isAuthenticated()) {
      // Guardar la ruta actual para redirigir después del login
      const returnUrl = pathname !== "/login" ? pathname : "/admin"
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
      return
    }
    
    setIsChecking(false)
  }, [router, pathname])

  // Mostrar spinner mientras se verifica la autenticación
  if (isChecking) {
    return (
      <div className={`${spaceGrotesk.variable} ${crimsonPro.variable} font-sans antialiased min-h-screen flex items-center justify-center`}>
        <LoadingSpinner />
      </div>
    )
  }

  // Si está autenticado, mostrar el contenido
  return (
    <div className={`${spaceGrotesk.variable} ${crimsonPro.variable} font-sans antialiased`}>
      {children}
    </div>
  )
}
