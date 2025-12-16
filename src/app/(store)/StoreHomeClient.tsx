"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api-client";
import { ProductGridSkeleton } from "@/components/ProductSkeleton";
import { EmptyProducts } from "@/components/EmptyState";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
  slug: string;
  is_featured?: boolean;
}

export default function StoreHomeClient() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Cargar productos destacados (aumentado a 12) - Solo activos
      const featuredData: any = await api.getProducts({ isFeatured: true, status: "active", limit: 12 });
      const featuredArray = Array.isArray(featuredData)
        ? featuredData
        : featuredData.data || featuredData.products || [];
      setFeaturedProducts(featuredArray);

      // Cargar todos los productos (aumentado a 20) - Solo activos
      const allData: any = await api.getProducts({ status: "active", limit: 20 });
      const allArray = Array.isArray(allData)
        ? allData
        : allData.data || allData.products || [];
      setAllProducts(allArray);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      setError("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const getProductImage = (product: any): string | undefined => {
    if (product.product_images && product.product_images.length > 0) {
      return product.product_images[0].image_url;
    }
    return product.image || product.imageUrl || product.image_url;
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const imageUrl = getProductImage(product);
    
    return (
      <Link
        href={`/products/${product.id}`}
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
      >
        <div className="aspect-square relative bg-gray-200">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Sin imagen
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            ${product.price.toFixed(2)}
          </p>
          {product.stock > 0 ? (
            <p className="text-sm text-gray-500 mt-1">En stock</p>
          ) : (
            <p className="text-sm text-red-500 mt-1">Sin stock</p>
          )}
        </div>
      </Link>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error al cargar productos</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadProducts}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bienvenido a Mi Tienda
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Descubre nuestros mejores productos
          </p>
          <Link
            href="/products"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Ver Todos los Productos
          </Link>
        </div>
      </section>

      {/* Productos Destacados */}
      {featuredProducts.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Productos Destacados
            </h2>
            {loading ? (
              <ProductGridSkeleton count={4} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Todos los Productos */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Nuestros Productos</h2>
            <Link
              href="/products"
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Ver todos →
            </Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : allProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyProducts showAction={false} />
          )}
        </div>
      </section>
    </div>
  );
}

