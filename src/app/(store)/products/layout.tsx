import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Productos",
  description: "Explora nuestra amplia selección de productos",
  openGraph: {
    title: "Productos - Mi Tienda",
    description: "Explora nuestra amplia selección de productos",
    type: "website",
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

