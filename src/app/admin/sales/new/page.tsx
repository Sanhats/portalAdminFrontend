"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, X, ArrowLeft, Save, ShoppingCart, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api-client";
import Notification from "@/components/Notification";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

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

type Step = 1 | 2 | 3;

export default function NewSalePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'mercadopago' | 'other'>('cash');
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);

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

  const handleSaveDraft = async () => {
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
        paymentMethod,
        notes: notes.trim() || undefined,
      };

      const sale = await api.createSale(saleData) as { id: string };
      
      setNotification({
        message: "Venta guardada como borrador exitosamente",
        type: "success",
      });

      setTimeout(() => {
        router.push(`/admin/sales/${sale.id}`);
      }, 1500);
    } catch (error: any) {
      console.error("Error al guardar venta:", error);
      setNotification({
        message: error.message || "Error al guardar venta",
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

        {/* Indicador de pasos */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-white' : 'text-white/40'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-500/20 border-2 border-blue-500' : 'bg-white/5 border-2 border-white/20'}`}>
              {step > 1 ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-sm font-semibold">1</span>}
            </div>
            <span className="text-sm font-medium">Agregar Productos</span>
          </div>
          <div className={`h-0.5 flex-1 ${step >= 2 ? 'bg-blue-500/30' : 'bg-white/10'}`} />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-white' : 'text-white/40'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-500/20 border-2 border-blue-500' : 'bg-white/5 border-2 border-white/20'}`}>
              {step > 2 ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-sm font-semibold">2</span>}
            </div>
            <span className="text-sm font-medium">Resumen</span>
          </div>
          <div className={`h-0.5 flex-1 ${step >= 3 ? 'bg-blue-500/30' : 'bg-white/10'}`} />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-white' : 'text-white/40'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-500/20 border-2 border-blue-500' : 'bg-white/5 border-2 border-white/20'}`}>
              <span className="text-sm font-semibold">3</span>
            </div>
            <span className="text-sm font-medium">Guardar</span>
          </div>
        </div>

        {/* Paso 1: Buscar y agregar productos */}
        {step === 1 && (
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

            {/* Items agregados */}
            {saleItems.length > 0 && (
              <div className="neu-elevated border-0 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Productos agregados</h3>
                <div className="space-y-2">
                  {saleItems.map((item, index) => (
                    <div
                      key={`${item.productId}-${item.variantId || 'base'}`}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex-1">
                        <div className="text-white font-medium">{item.productName}</div>
                        {item.variantName && (
                          <div className="text-white/60 text-sm">{item.variantName}</div>
                        )}
                        <div className="text-white/50 text-xs">
                          Stock disponible: {item.stock}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateItemQuantity(index, -1)}
                            className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-white font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateItemQuantity(index, 1)}
                            disabled={item.quantity >= item.stock}
                            className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8 p-0 disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-white font-semibold w-24 text-right">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-white/60">Total:</span>
                  <span className="text-2xl font-bold text-white">{formatCurrency(calculateTotal())}</span>
                </div>
                <Button
                  onClick={() => setStep(2)}
                  disabled={saleItems.length === 0}
                  className="w-full mt-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 disabled:opacity-50"
                >
                  Continuar al Resumen
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Paso 2: Resumen */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="neu-elevated border-0 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Resumen de la Venta</h3>
              
              <div className="space-y-3 mb-6">
                {saleItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div>
                      <div className="text-white font-medium">
                        {item.productName}
                        {item.variantName && ` - ${item.variantName}`}
                      </div>
                      <div className="text-white/60 text-sm">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </div>
                    </div>
                    <div className="text-white font-semibold">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-lg">
                  <span className="text-white/80">Total:</span>
                  <span className="text-2xl font-bold text-white">{formatCurrency(calculateTotal())}</span>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Método de Pago</Label>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                  >
                    <option value="cash">Efectivo</option>
                    <option value="transfer">Transferencia</option>
                    <option value="mercadopago">Mercado Pago</option>
                    <option value="other">Otro</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">Notas (opcional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Agregar notas sobre la venta..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="flex-1 text-white/60 hover:text-white hover:bg-white/10"
                >
                  Volver
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
                >
                  Continuar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Paso 3: Guardar */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="neu-elevated border-0 rounded-2xl p-6">
              <div className="text-center space-y-4">
                <ShoppingCart className="h-16 w-16 text-blue-400 mx-auto" />
                <h3 className="text-xl font-semibold text-white">Confirmar Venta</h3>
                <p className="text-white/60">
                  La venta se guardará como borrador. Podrás confirmarla después para descontar el stock.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-white/80">
                  <span>Total:</span>
                  <span className="text-xl font-bold text-white">{formatCurrency(calculateTotal())}</span>
                </div>
                <div className="flex justify-between text-white/60 text-sm">
                  <span>Método de pago:</span>
                  <span>{paymentMethod === 'cash' ? 'Efectivo' : paymentMethod === 'transfer' ? 'Transferencia' : paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Otro'}</span>
                </div>
                {notes && (
                  <div className="pt-3 border-t border-white/10">
                    <div className="text-white/60 text-sm mb-1">Notas:</div>
                    <div className="text-white/80">{notes}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
                  className="flex-1 text-white/60 hover:text-white hover:bg-white/10"
                >
                  Volver
                </Button>
                <Button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar como Borrador
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
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

