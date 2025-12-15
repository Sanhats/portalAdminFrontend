"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Plus, Filter, X, Upload, AlertTriangle, Trash2 } from "lucide-react";

import { api } from "@/lib/api-client";
import Notification from "@/components/Notification";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { PackageIcon } from "@/components/icons/custom-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: { id: string; name: string };
  image?: string;
  description?: string;
  isFeatured?: boolean;
  variants?: Variant[];
}

interface Variant {
  id?: string;
  name: string;
  value: string;
  price?: number;
  stock?: number;
}

interface NotificationState {
  message: string;
  type: "success" | "error" | "info";
}

interface Category {
  id: string;
  name: string;
}

type TableStatus = "Active" | "Low Stock" | "Out of Stock";

interface TableProduct {
  id: string;
  sku?: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: TableStatus;
  raw: Product;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    categoryId: "",
    description: "",
    image: null as File | null,
    imageUrl: "",
    isFeatured: false,
    variants: [] as Variant[],
  });
  const [notification, setNotification] = useState<NotificationState | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  const limit = 10;

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
      };
      if (search) {
        params.search = search;
      }
      const data: any = await api.getProducts(params);
      
      // Asegurar que products sea siempre un array
      let productsArray: any[] = [];
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data && Array.isArray(data.products)) {
        productsArray = data.products;
      } else if (data && Array.isArray(data.data)) {
        productsArray = data.data;
      }
      
      
      // Normalizar los productos para asegurar estructura consistente
      const normalizedProducts: Product[] = productsArray.map((product: any) => {
        // Obtener imagen del array product_images
        // La estructura real es: { id, image_url }
        let imageUrl: string | undefined = undefined;
        if (product.product_images && Array.isArray(product.product_images) && product.product_images.length > 0) {
          // El primer elemento del array es un objeto con image_url
          const firstImage = product.product_images[0];
          imageUrl = typeof firstImage === 'string' 
            ? firstImage 
            : firstImage.image_url || firstImage.url || firstImage.imageUrl;
        }
        
        // Obtener categoría (el backend usa 'categories' en lugar de 'category')
        let category: { id: string; name: string } | undefined = undefined;
        if (product.categories) {
          category = {
            id: product.categories.id || product.category_id,
            name: product.categories.name || "",
          };
        } else if (product.category_id) {
          // Si solo tenemos el ID, buscar el nombre en las categorías cargadas
          const categoryName = categories.find(c => c.id === product.category_id)?.name;
          if (categoryName) {
            category = {
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
          description: product.description,
          isFeatured: product.is_featured || product.isFeatured || false,
          variants: product.variants || [],
          image: imageUrl,
          category: category,
        };
      });
      
      const finalProducts: Product[] = normalizedProducts;
      
      setProducts(finalProducts);
      
      // Calcular totalPages
      if (data && typeof data.totalPages === 'number') {
        setTotalPages(data.totalPages);
      } else if (data && typeof data.total === 'number') {
        setTotalPages(Math.ceil(data.total / limit));
      } else {
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, limit, categories]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      price: "",
      stock: "",
      categoryId: "",
      description: "",
      image: null,
      imageUrl: "",
      isFeatured: false,
      variants: [],
    });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      categoryId: product.category?.id || "",
      description: product.description || "",
      image: null,
      imageUrl: product.image || "",
      isFeatured: product.isFeatured || false,
      variants: product.variants || [],
    });
    setShowModal(true);
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        { name: "", value: "", price: undefined, stock: undefined },
      ],
    });
  };

  const removeVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const updated = [...formData.variants];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, variants: updated });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  // Función para generar slug a partir del nombre
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remover caracteres especiales
      .replace(/[\s_-]+/g, "-") // Reemplazar espacios y guiones con un solo guion
      .replace(/^-+|-+$/g, ""); // Remover guiones al inicio y final
  };

  const showNotification = (message: string, type: "success" | "error" | "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    try {
      // Validar que la categoría esté seleccionada
      if (!formData.categoryId || formData.categoryId.trim() === "") {
        showNotification("Debes seleccionar una categoría para el producto", "error");
        setSaving(false);
        return;
      }

      let imageUrl = formData.imageUrl;

      // Subir imagen si hay una nueva
      if (formData.image) {
        const uploadResult = await api.uploadImage(formData.image);
        
        // El backend devuelve {success: true, file: {...}}
        // La URL está en file.url
        const file = uploadResult.file || {};
        imageUrl = file.url || file.path || file.location || file.imageUrl || file.image_url || 
                   uploadResult.url || uploadResult.imageUrl || uploadResult.image_url || 
                   uploadResult.path || imageUrl;
        
        if (!imageUrl) {
          throw new Error("No se pudo obtener la URL de la imagen subida");
        }
      }

      // Generar slug a partir del nombre
      const slug = generateSlug(formData.name);

      const normalizedCategoryId = formData.categoryId.trim();

      const productData: any = {
        name: formData.name,
        slug: slug,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        description: formData.description,
        is_featured: formData.isFeatured, // El backend usa snake_case
        // Enviar ambos formatos para máxima compatibilidad
        categoryId: normalizedCategoryId,   // lo que espera el backend en el schema
        category_id: normalizedCategoryId,  // lo que se guarda en la tabla (snake_case)
      };

      console.log("🔍 categoryId del formulario:", formData.categoryId);
      console.log("🔍 categoryId que se enviará:", productData.categoryId);
      console.log("🔍 category_id que se enviará:", productData.category_id);

      // El backend procesa product_images automáticamente
      // Acepta: product_images o images, con imageUrl (camelCase)
      if (imageUrl) {
        productData.product_images = [
          {
            imageUrl: imageUrl, // El backend espera imageUrl (camelCase)
          },
        ];
      }

      // Agregar variantes si existen
      if (formData.variants && formData.variants.length > 0) {
        productData.variants = formData.variants.filter(
          (v) => v.name && v.value
        );
      }

      console.log("Datos completos del producto a enviar:", JSON.stringify(productData, null, 2));

      let productId: string;
      if (editingProduct) {
        console.log("Actualizando producto:", editingProduct.id);
        // El backend procesa product_images automáticamente en el update también
        const result = await api.updateProduct(editingProduct.id, productData);
        console.log("Resultado de actualización:", result);
        productId = editingProduct.id;
        showNotification("Producto actualizado correctamente", "success");
      } else {
        console.log("Creando nuevo producto con product_images...");
        // El backend ahora procesa product_images automáticamente cuando se envía en el body
        const result = await api.createProduct(productData);
        console.log("Resultado de creación completo:", JSON.stringify(result, null, 2));
        // Obtener el ID del producto creado
        const resultData: any = result;
        productId = resultData.id || resultData.data?.id || resultData.product?.id || resultData.data?.product?.id;
        console.log("ID del producto creado:", productId);
        
        if (!productId) {
          throw new Error("No se pudo obtener el ID del producto creado");
        }
        
        showNotification("Producto creado correctamente", "success");
        
        showNotification("Producto creado correctamente", "success");
      }

      setShowModal(false);
      // Esperar un momento antes de recargar para que el backend procese
      setTimeout(() => {
        loadProducts();
      }, 500);
    } catch (error: any) {
      console.error("Error completo:", error);
      showNotification(error.message || "Error al guardar producto", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar el producto "${name}"?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setNotification(null);
    try {
      await api.deleteProduct(id);
      showNotification("Producto eliminado correctamente", "success");
      loadProducts();
    } catch (error: any) {
      showNotification(error.message || "Error al eliminar producto", "error");
    }
  };

  const tableData: TableProduct[] = useMemo(() => {
    if (!Array.isArray(products)) return []

    return products.map((product) => {
      const categoryName = product.category?.name || "Sin categoría"
      const basePrice = Number(product.price ?? 0)
      const priceFormatted = isNaN(basePrice)
        ? "-"
        : new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
            maximumFractionDigits: 0,
          }).format(basePrice)

      let status: TableStatus = "Active"
      if (product.stock === 0) {
        status = "Out of Stock"
      } else if (product.stock < 10) {
        status = "Low Stock"
      }

      return {
        id: product.id,
        name: product.name,
        category: categoryName,
        price: priceFormatted,
        stock: product.stock,
        status,
        raw: product,
      }
    })
  }, [products])

  const totalProducts = tableData.length
  const activeProducts = tableData.filter((p) => p.status === "Active").length
  const lowStockProducts = tableData.filter((p) => p.status === "Low Stock").length

  const productColumns = useMemo(
    () => [
      { key: "name", label: "Producto" },
      { key: "category", label: "Categoría" },
      { key: "price", label: "Precio" },
      { key: "stock", label: "Stock" },
      {
        key: "status",
        label: "Estado",
        render: (item: TableProduct) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight border ${
              item.status === "Active"
                ? "bg-white/[0.1] text-white/80 border-white/[0.15]"
                : item.status === "Low Stock"
                  ? "bg-amber-500/10 text-amber-200 border-amber-500/40"
                  : "bg-red-500/10 text-red-200 border-red-500/40"
            }`}
          >
            {item.status === "Active"
              ? "Activo"
              : item.status === "Low Stock"
                ? "Stock bajo"
                : "Sin stock"}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <h1 className="font-serif text-[28px] sm:text-[36px] lg:text-[44px] font-semibold tracking-[-0.03em] text-white leading-[1.1]">
                Catálogo de productos
              </h1>
              <div className="ornamental-divider w-24" />
              <p className="text-[15px] font-light text-white/45 leading-relaxed tracking-[-0.005em] max-w-xl">
                Gestiona tu inventario con el mismo estilo que ves en la tienda pública.
              </p>
            </div>
            <Button
              onClick={openCreateModal}
              className="bg-white/[0.12] hover:bg-white/[0.16] backdrop-blur-md border border-white/[0.15] text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] rounded-xl px-5 py-2.5 h-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo producto
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 transition-all duration-300 hover:shadow-[0_24px_72px_rgba(0,0,0,0.6)] hover:border-white/[0.1]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/[0.06] backdrop-blur-md icon-container">
                <PackageIcon className="h-6 w-6 text-white/80" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-white/50 tracking-[-0.005em]">Total productos</p>
                <p className="font-serif text-[32px] font-semibold text-white tracking-[-0.02em] leading-none mt-1">
                  {totalProducts}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 transition-all duration-300 hover:shadow-[0_24px_72px_rgba(0,0,0,0.6)] hover:border-white/[0.1]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/[0.06] backdrop-blur-md icon-container">
                <PackageIcon className="h-6 w-6 text-white/80" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-white/50 tracking-[-0.005em]">Productos activos</p>
                <p className="font-serif text-[32px] font-semibold text-white tracking-[-0.02em] leading-none mt-1">
                  {activeProducts}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 transition-all duration-300 hover:shadow-[0_24px_72px_rgba(0,0,0,0.6)] hover:border-white/[0.1]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/[0.06] backdrop-blur-md icon-container">
                <PackageIcon className="h-6 w-6 text-white/80" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-white/50 tracking-[-0.005em]">Stock bajo</p>
                <p className="font-serif text-[32px] font-semibold text-white tracking-[-0.02em] leading-none mt-1">
                  {lowStockProducts}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              type="text"
              placeholder="Buscar productos por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-11 bg-white/[0.03] backdrop-blur-xl border-white/[0.08] rounded-xl text-white placeholder:text-white/40 focus:border-white/[0.15] focus:bg-white/[0.05] transition-all"
            />
          </div>
          
        </form>

        {/* Products Table */}
        <div className="space-y-5">
          <div>
            <h2 className="font-serif text-[22px] sm:text-[26px] lg:text-[28px] font-semibold text-white tracking-[-0.02em] leading-tight">
              Todos los productos
            </h2>
            <p className="mt-2 text-[14px] font-light text-white/45 tracking-[-0.005em]">
              {loading
                ? "Cargando productos..."
                : `${tableData.length} producto${tableData.length === 1 ? "" : "s"} encontrados`}
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-white/60">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white/70"></div>
              <p className="mt-2 text-sm">Cargando productos...</p>
            </div>
          ) : tableData.length === 0 ? (
            <div className="p-8 text-center text-white/60 bg-white/[0.03] border border-white/[0.06] rounded-2xl backdrop-blur-xl">
              No hay productos disponibles.
            </div>
          ) : (
            <>
              <DataTable<TableProduct>
                data={tableData}
                columns={productColumns}
                onView={(item) => openEditModal(item.raw)}
                onEdit={(item) => openEditModal(item.raw)}
                onDelete={(item) => handleDelete(item.id, item.name)}
              />

              {totalPages > 1 && (
                <div className="flex items-center justify-between text-white/70 text-sm pt-2">
                  <div>
                    Página <span className="font-medium">{page}</span> de{" "}
                    <span className="font-medium">{totalPages}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(Math.max(1, page - 1))}
                      className="border-white/20 text-white/80 hover:text-white"
                    >
                      Anterior
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      className="border-white/20 text-white/80 hover:text-white"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de crear/editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => !saving && setShowModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/[0.12] shadow-[0_32px_80px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-black/40 backdrop-blur-xl p-6">
              <h2 className="font-serif text-[32px] font-semibold tracking-[-0.02em] text-white leading-tight">
                {editingProduct ? "Editar producto" : "Nuevo producto"}
              </h2>
              <Button
                onClick={() => !saving && setShowModal(false)}
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-white/[0.08] text-white/60 hover:text-white transition-all"
                type="button"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-11 bg-white/[0.04] backdrop-blur-xl border-white/[0.1] rounded-xl text-white placeholder:text-white/40 focus:border-white/[0.2] focus:bg-white/[0.06] transition-all"
                  placeholder="Ej: iPhone 15 Pro"
                  required
                />
              </div>

              {/* Precio y Stock */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                    Precio
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="h-11 bg-white/[0.04] backdrop-blur-xl border-white/[0.1] rounded-xl text-white placeholder:text-white/40 focus:border-white/[0.2] focus:bg-white/[0.06] transition-all"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                    Stock
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="h-11 bg-white/[0.04] backdrop-blur-xl border-white/[0.1] rounded-xl text-white placeholder:text-white/40 focus:border-white/[0.2] focus:bg-white/[0.06] transition-all"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Categoría */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                  Categoría <span className="text-white/50">*</span>
                </Label>
                <select
                  id="category"
                  value={formData.categoryId || ""}
                  onChange={(e) => {
                    const selectedCategoryId = e.target.value;
                    console.log("🔄 Categoría seleccionada:", selectedCategoryId);
                    setFormData({ ...formData, categoryId: selectedCategoryId });
                  }}
                  required
                  className="w-full h-11 px-4 bg-white/[0.04] backdrop-blur-xl border rounded-xl text-white transition-all appearance-none cursor-pointer border-white/[0.1] focus:border-white/[0.2] focus:bg-white/[0.06] focus:outline-none"
                >
                  <option value="" className="bg-black text-white/60">
                    Seleccionar categoría
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-black text-white">
                      {cat.name}
                    </option>
                  ))}
                </select>
                {!formData.categoryId && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <p className="text-[12px] text-red-300 tracking-[-0.005em]">
                      Debes seleccionar una categoría para que el producto se guarde correctamente
                    </p>
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-[100px] bg-white/[0.04] backdrop-blur-xl border-white/[0.1] rounded-xl text-white placeholder:text-white/40 focus:border-white/[0.2] focus:bg-white/[0.06] transition-all resize-none"
                  placeholder="Describe el producto..."
                  rows={3}
                />
              </div>

              {/* Imagen */}
              <div className="space-y-2">
                <Label htmlFor="image" className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                  Imagen
                </Label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3 items-center">
                    <Input
                      id="image-url"
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="h-11 bg-white/[0.04] backdrop-blur-xl border-white/[0.1] rounded-xl text-white placeholder:text-white/40 focus:border-white/[0.2] focus:bg-white/[0.06] transition-all"
                      placeholder="https://ejemplo.com/imagen.jpg (opcional si subes archivo)"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-xl border-white/[0.1] text-white rounded-xl px-4 transition-all"
                      asChild
                    >
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Upload className="h-4 w-4" />
                        <span className="text-xs">Subir archivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </Button>
                  </div>
                  {formData.imageUrl && !formData.image && (
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="mt-1 h-24 w-24 object-cover rounded"
                    />
                  )}
                </div>
              </div>

              {/* Producto destacado */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="h-5 w-5 rounded-md border-white/[0.2] bg-white/[0.05] checked:bg-white checked:border-white cursor-pointer"
                />
                <Label
                  htmlFor="featured"
                  className="text-[14px] font-medium text-white/80 tracking-[-0.005em] cursor-pointer"
                >
                  Producto destacado
                </Label>
              </div>

              {/* Variantes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                    Variantes (Color, Talle, etc.)
                  </Label>
                  <Button
                    type="button"
                    onClick={addVariant}
                    size="sm"
                    variant="ghost"
                    className="h-8 bg-white/[0.06] hover:bg-white/[0.1] text-white/80 hover:text-white rounded-lg px-3 text-[12px] transition-all"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Agregar variante
                  </Button>
                </div>

                {formData.variants.length > 0 && (
                  <div className="space-y-3">
                    {formData.variants.map((variant, index) => (
                      <div key={index} className="flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            value={variant.name}
                            onChange={(e) => updateVariant(index, "name", e.target.value)}
                            className="h-10 bg-white/[0.04] backdrop-blur-xl border-white/[0.1] rounded-lg text-white placeholder:text-white/40 focus:border-white/[0.2] text-[13px]"
                            placeholder="Nombre (ej: Color)"
                          />
                          <Input
                            value={variant.value}
                            onChange={(e) => updateVariant(index, "value", e.target.value)}
                            className="h-10 bg-white/[0.04] backdrop-blur-xl border-white/[0.1] rounded-lg text-white placeholder:text-white/40 focus:border-white/[0.2] text-[13px]"
                            placeholder="Valor (ej: Rojo)"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Precio adicional"
                            value={variant.price || ""}
                            onChange={(e) =>
                              updateVariant(
                                index,
                                "price",
                                e.target.value ? parseFloat(e.target.value) : undefined,
                              )
                            }
                            className="h-10 bg-white/[0.04] backdrop-blur-xl border-white/[0.1] rounded-lg text-white placeholder:text-white/40 focus:border-white/[0.2] text-[13px]"
                          />
                          <Input
                            type="number"
                            placeholder="Stock"
                            value={variant.stock || ""}
                            onChange={(e) =>
                              updateVariant(
                                index,
                                "stock",
                                e.target.value ? parseInt(e.target.value) : undefined,
                              )
                            }
                            className="h-10 bg-white/[0.04] backdrop-blur-xl border-white/[0.1] rounded-lg text-white placeholder:text-white/40 focus:border-white/[0.2] text-[13px]"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            onClick={() => removeVariant(index)}
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-lg hover:bg-white/[0.08] text-white/60 hover:text-white transition-all flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/[0.08]">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-11 bg-white/[0.12] hover:bg-white/[0.16] backdrop-blur-md border border-white/[0.15] text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving
                    ? "Guardando..."
                    : editingProduct
                      ? "Actualizar"
                      : "Crear"}
                </Button>
                <Button
                  type="button"
                  onClick={() => !saving && setShowModal(false)}
                  disabled={saving}
                  variant="outline"
                  className="flex-1 h-11 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-md border-white/[0.1] text-white/80 hover:text-white rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
