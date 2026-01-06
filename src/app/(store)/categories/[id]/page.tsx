"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api-client";
import { ProductGridSkeleton } from "@/components/ProductSkeleton";
import { EmptyCategory } from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { isValidImageUrl } from "@/lib/image-utils";
import ErrorPage from "@/components/ErrorPage";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
}

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 12;

  const loadCategory = useCallback(async () => {
    try {
      const data: any = await api.getCategory(categoryId);
      setCategory({ id: data.id, name: data.name });
    } catch (error) {
      console.error("Error al cargar categoría:", error);
    }
  }, [categoryId]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      // Usar categoryId para filtrar (el backend ahora lo soporta)
      const params: any = { 
        categoryId: categoryId,
        page, 
        limit 
      };
      const data: any = await api.getProducts(params);
      
      let productsArray: any[] = [];
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data && Array.isArray(data.data)) {
        productsArray = data.data;
      } else if (data && Array.isArray(data.products)) {
        productsArray = data.products;
      }
      
      const normalizedProducts: Product[] = productsArray.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        slug: product.slug,
        image:
          product.product_images && product.product_images.length > 0
            ? product.product_images[0].image_url
            : product.image || product.imageUrl || product.image_url,
      }));
      
      setProducts(normalizedProducts);
      
      if (data && typeof (data as any).totalPages === 'number') {
        setTotalPages((data as any).totalPages);
      } else if (data && typeof (data as any).total === 'number') {
        setTotalPages(Math.ceil((data as any).total / limit));
      } else {
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, page, limit]);

  useEffect(() => {
    loadCategory();
  }, [loadCategory]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const ProductCard = ({ product }: { product: Product }) => {
    const imageUrl = isValidImageUrl(product.image) ? product.image : undefined;
    
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/products" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        ← Volver a productos
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {category ? category.name : loading ? "Cargando..." : "Categoría no encontrada"}
      </h1>
      
      {!loading && !category && (
        <div className="mb-8">
          <ErrorPage statusCode={404} message="La categoría que buscas no existe" />
        </div>
      )}

      {loading ? (
        <ProductGridSkeleton count={12} />
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2 flex-wrap">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-gray-700 flex items-center">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyCategory />
      )}
    </div>
  );
}

