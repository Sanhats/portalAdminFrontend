"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, X, ArrowLeft, ShoppingCart, CheckCircle2, DollarSign, Building2 } from "lucide-react";
import { api } from "@/lib/api-client";
import Notification from "@/components/Notification";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SimplePaymentScreen } from "@/components/SimplePaymentScreen";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku?: string;
  variants?: Variant[];
}

interface Variant {
  id: string;
  name: string;
  value: string;
  price?: number;
  stock?: number;
}

interface SaleItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  productName: string;
  variantName?: string;
  stock: number;
}

interface NotificationState {
  message: string;
  type: "success" | "error" | "info";
}

export default function NewSalePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [createdSaleId, setCreatedSaleId] = useState<string | null>(null);

  const searchProducts = useCallback(async () => {
    if (!searchQuery.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      const data: any = await api.getProducts({
        search: searchQuery,
        limit: 20,
        status: 'active',
      });

      let productsArray: any[] = [];
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data && Array.isArray(data.data)) {
        productsArray = data.data;
      }

      // Cargar detalles completos de cada producto para obtener variantes
      const productsWithVariants = await Promise.all(
        productsArray.map(async (p: any) => {
          try {
            const fullProduct = await api.getProduct(p.id) as any;
            return {
              id: fullProduct.id,
              name: fullProduct.name || fullProduct.name_internal,
              price: parseFloat(fullProduct.price || 0),
              stock: fullProduct.stock || 0,
              sku: fullProduct.sku,
              variants: fullProduct.variants || [],
            };
          } catch {
            return {
              id: p.id,
              name: p.name || p.name_internal,
              price: parseFloat(p.price || 0),
              stock: p.stock || 0,
              sku: p.sku,
              variants: [],
            };
          }
        })
      );

      setProducts(productsWithVariants);
    } catch (error: any) {
      console.error("Error al buscar productos:", error);
      setNotification({
        message: error.message || "Error al buscar productos",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchProducts]);

  const addProductToSale = (product: Product, variant?: Variant) => {
    const existingItemIndex = saleItems.findIndex(
      (item) => item.productId === product.id && item.variantId === (variant?.id || null)
    );

    const unitPrice = variant?.price || product.price;
    const availableStock = variant?.stock !== undefined ? variant.stock : product.stock;

    if (existingItemIndex >= 0) {
      // Incrementar cantidad si ya existe
      const updatedItems = [...saleItems];
      updatedItems[existingItemIndex].quantity += 1;
      setSaleItems(updatedItems);
    } else {
      // Agregar nuevo item
      const newItem: SaleItem = {
        productId: product.id,
        variantId: variant?.id || null,
        quantity: 1,
        unitPrice,
        productName: product.name,
        variantName: variant ? `${variant.name}: ${variant.value}` : undefined,
        stock: availableStock,
      };
      setSaleItems([...saleItems, newItem]);
    }

    setSearchQuery("");
    setProducts([]);
  };

  const updateItemQuantity = (index: number, delta: number) => {
    const updatedItems = [...saleItems];
    const newQuantity = updatedItems[index].quantity + delta;
    
    if (newQuantity <= 0) {
      updatedItems.splice(index, 1);
    } else {
      updatedItems[index].quantity = newQuantity;
    }
    
    setSaleItems(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = [...saleItems];
    updatedItems.splice(index, 1);
    setSaleItems(updatedItems);
  };

  const calculateTotal = () => {
    return saleItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const handleCreateSale = async () => {
    if (saleItems.length === 0) {
      setNotification({
        message: "Debes agregar al menos un producto",
        type: "error",
      });
      return;
    }

    setSaving(true);
    try {
      const saleData = {
        items: saleItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        notes: notes.trim() || undefined,
      };

      const sale = await api.createSale(saleData) as { id: string };
      setCreatedSaleId(sale.id);
      
      // Confirmar la venta automáticamente
      await api.confirmSale(sale.id);
      
      // Mostrar pantalla de cobro
      setShowPaymentScreen(true);
    } catch (error: any) {
      console.error("Error al crear venta:", error);
      setNotification({
        message: error.message || "Error al crear venta",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/sales')}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Nueva Venta</h1>
            <p className="text-white/60 mt-1">Crear una nueva venta</p>
          </div>
        </div>

        {/* Pantalla de cobro */}
        {showPaymentScreen && createdSaleId ? (
          <SimplePaymentScreen
            saleId={createdSaleId}
            totalAmount={calculateTotal()}
            onComplete={() => {
              router.push(`/admin/sales/${createdSaleId}`);
            }}
            onCancel={() => {
              setShowPaymentScreen(false);
              router.push(`/admin/sales/${createdSaleId}`);
            }}
          />
        ) : (
          <>
            {/* Buscar y agregar productos */}
            <div className="space-y-6">
            <div className="neu-elevated border-0 rounded-2xl p-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    type="text"
                    placeholder="Buscar producto por nombre o SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                {loading && (
                  <div className="text-center py-8 text-white/60">Buscando productos...</div>
                )}

                {!loading && products.length > 0 && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {products.map((product) => (
                      <div key={product.id} className="space-y-2">
                        <div
                          onClick={() => addProductToSale(product)}
                          className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors border border-white/10"
                        >
                          <div className="flex-1">
                            <div className="text-white font-medium">{product.name}</div>
                            <div className="text-white/60 text-sm">
                              {product.sku && `SKU: ${product.sku} • `}
                              Stock: {product.stock} • {formatCurrency(product.price)}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              addProductToSale(product);
                            }}
                            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {product.variants && product.variants.length > 0 && (
                          <div className="ml-4 space-y-1">
                            {product.variants.map((variant) => (
                              <div
                                key={variant.id}
                                onClick={() => addProductToSale(product, variant)}
                                className="flex items-center justify-between p-3 bg-white/3 hover:bg-white/8 rounded-lg cursor-pointer transition-colors border border-white/5"
                              >
                                <div className="flex-1">
                                  <div className="text-white/80 text-sm">
                                    {variant.name}: {variant.value}
                                  </div>
                                  <div className="text-white/50 text-xs">
                                    Stock: {variant.stock !== undefined ? variant.stock : product.stock} • 
                                    {formatCurrency(variant.price || product.price)}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addProductToSale(product, variant);
                                  }}
                                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 h-7 px-2"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!loading && searchQuery && products.length === 0 && (
                  <div className="text-center py-8 text-white/60">No se encontraron productos</div>
                )}
              </div>
            </div>

            {/* Items agregados y total siempre visible */}
            {saleItems.length > 0 && (
              <div className="neu-elevated border-0 rounded-2xl p-6 sticky top-4 z-10">
                <h3 className="text-lg font-semibold text-white mb-4">Carrito</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                  {saleItems.map((item, index) => (
                    <div
                      key={`${item.productId}-${item.variantId || 'base'}`}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{item.productName}</div>
                        {item.variantName && (
                          <div className="text-white/60 text-sm truncate">{item.variantName}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateItemQuantity(index, -1)}
                            className="text-white/60 hover:text-white hover:bg-white/10 h-7 w-7 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-white font-medium w-6 text-center text-sm">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateItemQuantity(index, 1)}
                            disabled={item.quantity >= item.stock}
                            className="text-white/60 hover:text-white hover:bg-white/10 h-7 w-7 p-0 disabled:opacity-50"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-white font-semibold text-right min-w-[80px]">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-semibold text-white">Total:</span>
                    <span className="text-3xl font-bold text-white">{formatCurrency(calculateTotal())}</span>
                  </div>
                  <Button
                    onClick={handleCreateSale}
                    disabled={saving || saleItems.length === 0}
                    className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 active:bg-green-800 text-white border-0 shadow-lg shadow-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-5 w-5 mr-2" />
                        Cobrar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            </div>
          </>
        )}

        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

