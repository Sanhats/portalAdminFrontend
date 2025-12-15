import type { Metadata } from "next";
import { Space_Grotesk, Crimson_Pro } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Mi Tienda",
    template: "%s | Mi Tienda",
  },
  description: "Tu tienda online con los mejores productos",
  keywords: ["tienda", "productos", "compras", "online"],
  authors: [{ name: "Mi Tienda" }],
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Mi Tienda",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${spaceGrotesk.variable} ${crimsonPro.variable}`}>{children}</body>
    </html>
  );
}

