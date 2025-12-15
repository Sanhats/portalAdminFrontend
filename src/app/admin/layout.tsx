import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk, Crimson_Pro } from "next/font/google"

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

export const metadata: Metadata = {
  title: "Commerce Studio",
  description: "Editorial commerce dashboard with refined aesthetics",
  generator: "v0.app",
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className={`${spaceGrotesk.variable} ${crimsonPro.variable} font-sans antialiased`}>
      {children}
    </div>
  )
}
