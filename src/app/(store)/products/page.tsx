"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api-client";
import { ProductGridSkeleton } from "@/components/ProductSkeleton";
import { EmptyProducts, EmptySearch, EmptyCategory } from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { isValidImageUrl } from "@/lib/image-utils";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
  slug: string;
  categories?: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 12;

  const loadCategories = useCallback(async () => {
    try {
      const data = await api.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
        status: "active", // Solo mostrar productos activos en la tienda pública
      };
      
      // Usar categoryId para filtrar (el backend ahora lo soporta)
      if (selectedCategory) {
        params.categoryId = selectedCategory;
      }
      
      const data: any = await api.getProducts(params);
      
      let productsArray: any[] = [];
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data && Array.isArray(data.data)) {
        productsArray = data.data;
      } else if (data && Array.isArray(data.products)) {
        productsArray = data.products;
      }
      
      // Normalizar productos
      const normalizedProducts: Product[] = productsArray.map((product: any) => {
        // Intentar obtener la categoría de diferentes formas
        let categoryInfo: { id: string; name: string } | undefined = undefined;
        
        if (product.categories) {
          // Si viene como objeto categories
          categoryInfo = {
            id: product.categories.id || product.category_id || "",
            name: product.categories.name || "",
          };
        } else if (product.category_id) {
          // Si solo viene el ID, buscar el nombre en las categorías cargadas
          const categoryName = categories.find(c => c.id === product.category_id)?.name;
          if (categoryName) {
            categoryInfo = {
              id: product.category_id,
              name: categoryName,
            };
          }
        }
        
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          slug: product.slug,
          categories: categoryInfo,
          image:
            product.product_images && product.product_images.length > 0
              ? product.product_images[0].image_url
              : product.image || product.imageUrl || product.image_url,
        };
      });
      
      setProducts(normalizedProducts);
      
      // Calcular totalPages desde la respuesta del backend
      if (data && typeof data.totalPages === 'number') {
        setTotalPages(data.totalPages);
      } else if (data && data.pagination && typeof data.pagination.totalPages === 'number') {
        setTotalPages(data.pagination.totalPages);
      } else if (data && typeof data.total === 'number') {
        setTotalPages(Math.ceil(data.total / limit));
      } else if (data && data.pagination && typeof data.pagination.total === 'number') {
        setTotalPages(Math.ceil(data.pagination.total / limit));
      } else {
        setTotalPages(1);
      }
      
      // Si no hay productos y hay una categoría seleccionada, mostrar mensaje
      if (normalizedProducts.length === 0 && selectedCategory) {
        console.warn("⚠️ No se encontraron productos para la categoría:", selectedCategory);
        console.warn("📋 Respuesta completa del backend:", JSON.stringify(data, null, 2));
        console.warn("🔍 Verificar que los productos tengan category_id asignado en la base de datos");
      }
    } catch (error) {
      console.error("❌ Error al cargar productos:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, limit, categories]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Productos</h1>

      {/* Filtros */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handleCategoryChange("")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === ""
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Todas
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de productos */}
      {loading ? (
        <ProductGridSkeleton count={12} />
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Paginación */}
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
      ) : selectedCategory ? (
        <EmptyCategory />
      ) : (
        <EmptyProducts />
      )}
    </div>
  );
}

