import { Metadata } from "next";
import StoreHomeClient from "./StoreHomeClient";

export const metadata: Metadata = {
  title: "Mi Tienda - Inicio",
  description: "Descubre nuestros mejores productos y ofertas especiales",
  openGraph: {
    title: "Mi Tienda - Inicio",
    description: "Descubre nuestros mejores productos y ofertas especiales",
    type: "website",
  },
};

export default function StoreHome() {
  return <StoreHomeClient />;
}
