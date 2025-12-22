"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api-client";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorPage from "@/components/ErrorPage";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
  slug: string;
  categories?: { id: string; name: string };
  product_images?: Array<{ id: string; image_url: string }>;
  variants?: Array<{ id: string; name: string; value: string; price?: number; stock?: number }>;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const data: any = await api.getProduct(productId);
      
      // Normalizar producto
      const normalizedProduct: Product = {
        id: data.id,
        name: data.name,
        price: data.price,
        stock: data.stock,
        description: data.description,
        slug: data.slug,
        categories: data.categories
          ? {
              id: data.categories.id || data.category_id,
              name: data.categories.name || "",
            }
          : undefined,
        product_images: data.product_images || [],
        variants: data.variants || [],
      };
      
      setProduct(normalizedProduct);
      
      // Establecer imagen principal
      if (normalizedProduct.product_images && normalizedProduct.product_images.length > 0) {
        setSelectedImage(normalizedProduct.product_images[0].image_url);
      }
    } catch (error: any) {
      console.error("Error al cargar producto:", error);
      if (error.message?.includes("404") || error.message?.includes("not found")) {
        setError("404");
      } else {
        setError("error");
      }
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPrice = () => {
    if (selectedVariant && selectedVariant.price) {
      return product!.price + selectedVariant.price;
    }
    return product?.price || 0;
  };

  const getCurrentStock = () => {
    if (selectedVariant && selectedVariant.stock !== undefined) {
      return selectedVariant.stock;
    }
    return product?.stock || 0;
  };

  const getWhatsAppMessage = () => {
    const message = `Hola, me interesa el producto: ${product?.name}`;
    if (selectedVariant) {
      return `${message} - Variante: ${selectedVariant.name} ${selectedVariant.value}`;
    }
    return message;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error === "404" || !product) {
    return <ErrorPage statusCode={404} showHomeButton={true} />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorPage statusCode={500} message="Error al cargar el producto. Por favor, intenta más tarde." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/products"
        className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
      >
        ← Volver a productos
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        {/* Imágenes */}
        <div>
          {product.product_images && product.product_images.length > 0 ? (
            <>
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4 relative">
                <Image
                  src={selectedImage || product.product_images[0].image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
              {product.product_images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.product_images.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img.image_url)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 relative ${
                        selectedImage === img.image_url
                          ? "border-blue-600"
                          : "border-gray-200"
                      }`}
                    >
                      <Image
                        src={img.image_url}
                        alt={`${product.name} - Imagen ${img.id}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 25vw, 12.5vw"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
              Sin imagen
            </div>
          )}
        </div>

        {/* Información */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          
          {product.categories && (
            <Link
              href={`/categories/${product.categories.id}`}
              className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
            >
              {product.categories.name}
            </Link>
          )}

          <div className="mb-6">
            <p className="text-4xl font-bold text-blue-600 mb-2">
              ${getCurrentPrice().toFixed(2)}
            </p>
            {getCurrentStock() > 0 ? (
              <p className="text-green-600 font-medium">En stock ({getCurrentStock()} disponibles)</p>
            ) : (
              <p className="text-red-600 font-medium">Sin stock</p>
            )}
          </div>

          {product.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Descripción</h2>
              <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {/* Variantes */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Variantes</h2>
              <div className="space-y-4">
                {product.variants.map((variant) => (
                  <div key={variant.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">
                          {variant.name}: {variant.value}
                        </p>
                        {variant.price && (
                          <p className="text-sm text-gray-600">
                            Precio adicional: +${variant.price.toFixed(2)}
                          </p>
                        )}
                        {variant.stock !== undefined && (
                          <p className="text-sm text-gray-600">
                            Stock: {variant.stock}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          selectedVariant?.id === variant.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        Seleccionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón WhatsApp */}
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "1234567890"}?text=${encodeURIComponent(getWhatsAppMessage())}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Consultar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

