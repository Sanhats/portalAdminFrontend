"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Plus, X, Upload, AlertTriangle, Trash2, Zap, FileText, FileSpreadsheet, CheckCircle2, Loader2 } from "lucide-react";

import { api } from "@/lib/api-client";
import Notification from "@/components/Notification";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { PackageIcon } from "@/components/icons/custom-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type LoadMode = "selector" | "quick" | "full" | "csv" | null;
type ProductStatus = "draft" | "active" | "hidden";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: { id: string; name: string };
  image?: string;
  description?: string;
  isFeatured?: boolean;
  status?: ProductStatus;
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

type TableStatus = "Active" | "Low Stock" | "Out of Stock" | "Borrador" | "Oculto";

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

interface CSVRow {
  name: string;
  price: string;
  stock: string;
  category: string;
  description?: string;
  [key: string]: string | undefined;
}

interface FieldError {
  field: string;
  message: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Todos los productos cuando loadAllProducts está activo
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadAllProducts, setLoadAllProducts] = useState(false); // Modo: cargar todos los productos
  
  // Modo de carga
  const [loadMode, setLoadMode] = useState<LoadMode>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Formulario
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    categoryId: "",
    description: "",
    image: null as File | null,
    imageUrl: "",
    isFeatured: false,
    status: "active" as ProductStatus,
    variants: [] as Variant[],
    slug: "",
  });
  
  // Validaciones
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [saving, setSaving] = useState(false);
  const [continueAdding, setContinueAdding] = useState(false);
  
  // CSV
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVRow[]>([]);
  const [csvLoading, setCsvLoading] = useState(false);

  const limit = 50; // Límite por página (paginación server-side)

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
      const params: any = {};
      
      // Si loadAllProducts está activado, usar limit="all" y resetear a página 1
      if (loadAllProducts) {
        params.limit = "all";
        params.page = 1;
      } else {
        params.page = page;
        params.limit = limit;
      }
      
      if (search) {
        params.search = search;
      }
      const data: any = await api.getProducts(params);
      
      // El backend devuelve: { data: [...], total: number, page: number, limit: number, totalPages: number }
      let productsArray: any[] = [];
      if (Array.isArray(data)) {
        // Si la respuesta es directamente un array (compatibilidad hacia atrás)
        productsArray = data;
      } else if (data && Array.isArray(data.data)) {
        // Formato estándar del backend: { data: [...], total, page, limit, totalPages }
        productsArray = data.data;
      } else if (data && Array.isArray(data.products)) {
        // Formato alternativo: { products: [...] }
        productsArray = data.products;
      }
      
      const normalizedProducts: Product[] = productsArray.map((product: any) => {
        // Debug: ver qué campos tiene el producto
        if (!product.name && (product.nameInternal || product.name_internal)) {
          console.log("⚠️ Producto sin campo 'name', usando nameInternal:", {
            id: product.id,
            name: product.name,
            nameInternal: product.nameInternal || product.name_internal,
            fullProduct: product
          });
        }
        
        let imageUrl: string | undefined = undefined;
        if (product.product_images && Array.isArray(product.product_images) && product.product_images.length > 0) {
          const firstImage = product.product_images[0];
          imageUrl = typeof firstImage === 'string' 
            ? firstImage 
            : firstImage.image_url || firstImage.url || firstImage.imageUrl;
        }
        
        let category: { id: string; name: string } | undefined = undefined;
        if (product.categories) {
          category = {
            id: product.categories.id || product.category_id,
            name: product.categories.name || "",
          };
        } else if (product.category_id) {
          const categoryName = categories.find(c => c.id === product.category_id)?.name;
          if (categoryName) {
            category = {
              id: product.category_id,
              name: categoryName,
            };
          }
        }
        
        // Usar nameInternal como fallback si name no está disponible
        const productName = product.name || product.nameInternal || product.name_internal || "Sin nombre";
        
        return {
          id: product.id,
          name: productName,
          price: product.price,
          stock: product.stock,
          description: product.description,
          isFeatured: product.is_featured || product.isFeatured || false,
          status: product.status || "active",
          variants: product.variants || [],
          image: imageUrl,
          category: category,
        };
      });
      
      if (loadAllProducts) {
        // Si cargamos todos los productos, guardarlos todos y paginar en el frontend
        setAllProducts(normalizedProducts);
        // Calcular totalPages para paginación frontend (50 productos por página)
        setTotalPages(Math.ceil(normalizedProducts.length / limit));
        // Obtener solo los productos de la página actual
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        setProducts(normalizedProducts.slice(startIndex, endIndex));
      } else {
        // Paginación server-side: usar solo los productos recibidos
        setProducts(normalizedProducts);
        setAllProducts([]);
        
        // Calcular totalPages desde la respuesta del backend
        // El backend devuelve: { data: [...], total: number, page: number, limit: number, totalPages: number }
        if (data && typeof data.totalPages === 'number') {
          // Si el backend ya calculó totalPages, usarlo directamente
          setTotalPages(data.totalPages);
        } else if (data && typeof data.total === 'number') {
          // Si solo tenemos total, calcular totalPages
          const currentLimit = (data.limit && typeof data.limit === 'number') ? data.limit : limit;
          setTotalPages(Math.ceil(data.total / currentLimit));
        } else {
          // Si no hay información de paginación, asumir 1 página
          // Pero si tenemos productos, podría haber más páginas
          setTotalPages(productsArray.length >= limit ? 2 : 1);
        }
      }
      
      // Debug: log para verificar la respuesta del backend
      if (process.env.NODE_ENV === 'development') {
        console.log('📦 Respuesta del backend:', {
          modo: loadAllProducts ? 'Todos los productos (frontend pagination)' : 'Paginación server-side',
          productosRecibidos: productsArray.length,
          total: data?.total,
          page: data?.page || page,
          limit: data?.limit || limit,
          totalPages: data?.totalPages || 'calculado',
          totalPagesCalculado: loadAllProducts 
            ? Math.ceil(productsArray.length / limit)
            : (data?.totalPages || (data?.total ? Math.ceil(data.total / (data?.limit || limit)) : 1))
        });
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, limit, categories, loadAllProducts]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Efecto para actualizar productos paginados cuando cambia la página en modo "todos"
  useEffect(() => {
    if (loadAllProducts && allProducts.length > 0) {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      setProducts(allProducts.slice(startIndex, endIndex));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, loadAllProducts, limit]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      stock: "",
      categoryId: "",
      description: "",
      image: null,
      imageUrl: "",
      isFeatured: false,
      status: "active",
      variants: [],
      slug: "",
    });
    setFieldErrors({});
    setContinueAdding(false);
  };

  const openCreateModal = (mode: "quick" | "full" = "full") => {
    setEditingProduct(null);
    resetForm();
    setLoadMode(mode);
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
      status: product.status || "active",
      variants: product.variants || [],
      slug: "",
    });
    setLoadMode("full");
  };

  const validateField = (field: string, value: any): string | null => {
    switch (field) {
      case "name":
        if (!value || value.trim() === "") return "El nombre es requerido";
        if (value.length < 3) return "El nombre debe tener al menos 3 caracteres";
        return null;
      case "price":
        if (!value || value === "") return "El precio es requerido";
        const priceNum = parseFloat(value);
        if (isNaN(priceNum) || priceNum < 0) return "El precio debe ser un número válido mayor o igual a 0";
        return null;
      case "stock":
        if (!value || value === "") return "El stock es requerido";
        const stockNum = parseInt(value);
        if (isNaN(stockNum) || stockNum < 0) return "El stock debe ser un número entero mayor o igual a 0";
        return null;
      case "categoryId":
        if (!value || value.trim() === "") return "Debes seleccionar una categoría";
        return null;
      default:
        return null;
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    const nameError = validateField("name", formData.name);
    if (nameError) errors.name = nameError;
    
    const priceError = validateField("price", formData.price);
    if (priceError) errors.price = priceError;
    
    const stockError = validateField("stock", formData.stock);
    if (stockError) errors.stock = stockError;
    
    const categoryError = validateField("categoryId", formData.categoryId);
    if (categoryError) errors.categoryId = categoryError;
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
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

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const showNotification = (message: string, type: "success" | "error" | "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification("Por favor corrige los errores en el formulario", "error");
      return;
    }
    
    setSaving(true);
    setNotification(null);
    setFieldErrors({});

    try {
      let imageUrl = formData.imageUrl;

      if (formData.image) {
        const uploadResult = await api.uploadImage(formData.image);
        const file = uploadResult.file || {};
        imageUrl = file.url || file.path || file.location || file.imageUrl || file.image_url || 
                   uploadResult.url || uploadResult.imageUrl || uploadResult.image_url || 
                   uploadResult.path || imageUrl;
        
        if (!imageUrl) {
          throw new Error("No se pudo obtener la URL de la imagen subida");
        }
      }

      const slug = formData.slug || generateSlug(formData.name);
      const normalizedCategoryId = formData.categoryId.trim();

      // Generar SKU y nameInternal si no están presentes
      const sku = generateSlug(formData.name).toUpperCase().substring(0, 20);
      const nameInternal = formData.name;

      const productData: any = {
        name: formData.name,
        nameInternal: nameInternal,
        sku: sku,
        slug: slug,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        description: formData.description || "",
        is_featured: formData.isFeatured,
        status: formData.status,
        categoryId: normalizedCategoryId,
        category_id: normalizedCategoryId,
      };

      if (imageUrl) {
        productData.product_images = [
          {
            imageUrl: imageUrl,
          },
        ];
      }

      if (formData.variants && formData.variants.length > 0) {
        productData.variants = formData.variants.filter(
          (v) => v.name && v.value
        );
      }

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productData);
        showNotification("Producto actualizado correctamente", "success");
        setLoadMode(null);
        setTimeout(() => {
          loadProducts();
        }, 500);
      } else {
        await api.createProduct(productData);
        showNotification("Producto creado correctamente", "success");
        
        if (continueAdding) {
          // Limpiar formulario pero mantener el modo
          resetForm();
          // Mantener categoría si es carga rápida
          if (loadMode === "quick") {
            setFormData(prev => ({ ...prev, categoryId: normalizedCategoryId }));
          }
        } else {
          setLoadMode(null);
          setTimeout(() => {
            loadProducts();
          }, 500);
        }
      }
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

  // CSV Handling
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showNotification("Por favor selecciona un archivo CSV", "error");
      return;
    }

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    // Leer el archivo con codificación UTF-8 para evitar problemas con caracteres especiales
    reader.readAsText(file, 'UTF-8');
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      showNotification("El archivo CSV debe tener al menos una fila de encabezados y una fila de datos", "error");
      return;
    }

    // Parsear headers
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'price', 'stock', 'category'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      showNotification(`Faltan columnas requeridas: ${missingHeaders.join(', ')}. Columnas encontradas: ${headers.join(', ')}`, "error");
      return;
    }

    // Parsear filas
    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Saltar líneas vacías
      
      // Parsear valores - manejar comas dentro de valores entre comillas
      const values: string[] = [];
      let currentValue = '';
      let insideQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim()); // Agregar el último valor
      
      // Crear objeto row
      const row: CSVRow = {
        name: '',
        price: '',
        stock: '',
        category: '',
      };
      headers.forEach((header, index) => {
        // Remover comillas de los valores si existen
        let value = (values[index] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        row[header] = value;
      });
      
      // Solo agregar filas que tengan al menos un nombre
      if (row.name && row.name.trim()) {
        rows.push(row);
      }
    }

    if (rows.length === 0) {
      showNotification("No se encontraron filas válidas en el CSV", "error");
      return;
    }

    setCsvPreview(rows);
    showNotification(`CSV cargado: ${rows.length} producto${rows.length === 1 ? "" : "s"} encontrado${rows.length === 1 ? "" : "s"}`, "info");
  };

  const handleCSVImport = async () => {
    if (csvPreview.length === 0) {
      showNotification("No hay datos para importar", "error");
      return;
    }

    setCsvLoading(true);
    setNotification(null);

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < csvPreview.length; i++) {
        const row = csvPreview[i];
        const rowNumber = i + 2; // +2 porque la fila 1 es el header y empezamos desde 0
        
        try {
          // Validar nombre
          if (!row.name || row.name.trim() === "") {
            errors.push(`Fila ${rowNumber}: El nombre es requerido`);
            errorCount++;
            continue;
          }

          // Validar precio
          if (!row.price || row.price.trim() === "") {
            errors.push(`Fila ${rowNumber} (${row.name}): El precio es requerido`);
            errorCount++;
            continue;
          }
          const price = parseFloat(row.price);
          if (isNaN(price) || price < 0) {
            errors.push(`Fila ${rowNumber} (${row.name}): El precio debe ser un número válido mayor o igual a 0`);
            errorCount++;
            continue;
          }

          // Validar stock
          if (!row.stock || row.stock.trim() === "") {
            errors.push(`Fila ${rowNumber} (${row.name}): El stock es requerido`);
            errorCount++;
            continue;
          }
          const stock = parseInt(row.stock);
          if (isNaN(stock) || stock < 0) {
            errors.push(`Fila ${rowNumber} (${row.name}): El stock debe ser un número entero mayor o igual a 0`);
            errorCount++;
            continue;
          }

          // Validar categoría
          if (!row.category || row.category.trim() === "") {
            errors.push(`Fila ${rowNumber} (${row.name}): La categoría es requerida`);
            errorCount++;
            continue;
          }

          // Función para normalizar texto (remover acentos y convertir a minúsculas)
          const normalizeText = (text: string): string => {
            return text
              .toLowerCase()
              .trim()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, ''); // Remover diacríticos (acentos)
          };

          // Buscar categoría por nombre (case insensitive y sin acentos)
          const category = categories.find(c => 
            normalizeText(c.name) === normalizeText(row.category)
          );

          if (!category) {
            errors.push(`Fila ${rowNumber} (${row.name}): Categoría "${row.category}" no encontrada. Categorías disponibles: ${categories.map(c => c.name).join(", ")}`);
            errorCount++;
            continue;
          }

          // Generar SKU automáticamente desde el nombre (puede venir del CSV o generarse)
          const sku = row.sku?.trim() || generateSlug(row.name.trim()).toUpperCase().substring(0, 20);
          const nameInternal = row.nameInternal?.trim() || row.name.trim();

          const productData: any = {
            name: row.name.trim(),
            nameInternal: nameInternal,
            sku: sku,
            slug: generateSlug(row.name.trim()),
            price: price,
            stock: stock,
            description: (row.description || "").trim(),
            status: "active",
            categoryId: category.id,
            category_id: category.id,
          };

          await api.createProduct(productData);
          successCount++;
        } catch (error: any) {
          const errorMessage = error.message || "Error desconocido";
          errors.push(`Fila ${rowNumber} (${row.name || "sin nombre"}): ${errorMessage}`);
          errorCount++;
        }
      }

      // Mostrar resultado
      if (successCount > 0 && errorCount === 0) {
        showNotification(
          `✅ Importación exitosa: ${successCount} producto${successCount === 1 ? "" : "s"} creado${successCount === 1 ? "" : "s"}`,
          "success"
        );
      } else if (successCount > 0 && errorCount > 0) {
        const errorSummary = errors.slice(0, 3).join("; ");
        const moreErrors = errors.length > 3 ? ` y ${errors.length - 3} error${errors.length - 3 === 1 ? "" : "es"} más` : "";
        showNotification(
          `⚠️ Importación parcial: ${successCount} producto${successCount === 1 ? "" : "s"} creado${successCount === 1 ? "" : "s"}, ${errorCount} error${errorCount === 1 ? "" : "es"}. ${errorSummary}${moreErrors}`,
          "error"
        );
        console.error("Errores de importación:", errors);
      } else {
        const errorSummary = errors.slice(0, 3).join("; ");
        const moreErrors = errors.length > 3 ? ` y ${errors.length - 3} error${errors.length - 3 === 1 ? "" : "es"} más` : "";
        showNotification(
          `❌ Importación fallida: ${errorCount} error${errorCount === 1 ? "" : "es"}. ${errorSummary}${moreErrors}`,
          "error"
        );
        console.error("Errores de importación:", errors);
      }

      if (successCount > 0) {
        setCsvFile(null);
        setCsvPreview([]);
        setLoadMode(null);
        setTimeout(() => {
          loadProducts();
        }, 500);
      }
    } catch (error: any) {
      showNotification(error.message || "Error al importar productos", "error");
    } finally {
      setCsvLoading(false);
    }
  };

  // Cuando loadAllProducts está activo, usar allProducts para las estadísticas
  const productsForStats = loadAllProducts ? allProducts : products;
  
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
      if (product.status === "draft") {
        status = "Borrador"
      } else if (product.status === "hidden") {
        status = "Oculto"
      } else if (product.stock === 0) {
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

  // Calcular estadísticas desde todos los productos cargados
  // Si loadAllProducts está activo, usar allProducts; si no, solo los de la página actual
  const totalProducts = loadAllProducts ? allProducts.length : tableData.length
  const activeProducts = productsForStats.filter((p) => {
    if (p.status === "draft") return false;
    if (p.status === "hidden") return false;
    return p.stock > 0;
  }).length
  const lowStockProducts = productsForStats.filter((p) => p.stock > 0 && p.stock < 10).length

  const productColumns = useMemo(
    () => [
      { key: "name", label: "Producto" },
      { key: "category", label: "Categoría" },
      { key: "price", label: "Precio" },
      { key: "stock", label: "Stock" },
      {
        key: "status",
        label: "Estado",
        render: (item: TableProduct) => {
          const statusConfig = {
            "Active": { label: "Activo", className: "bg-green-500/10 text-green-200 border-green-500/40" },
            "Low Stock": { label: "Stock bajo", className: "bg-amber-500/10 text-amber-200 border-amber-500/40" },
            "Out of Stock": { label: "Sin stock", className: "bg-red-500/10 text-red-200 border-red-500/40" },
            "Borrador": { label: "Borrador", className: "bg-gray-500/10 text-gray-200 border-gray-500/40" },
            "Oculto": { label: "Oculto", className: "bg-purple-500/10 text-purple-200 border-purple-500/40" },
          };
          
          const config = statusConfig[item.status] || statusConfig["Active"];
          
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight border ${config.className}`}
            >
              {config.label}
            </span>
          );
        },
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
              onClick={() => setLoadMode("selector")}
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
        <div className="flex gap-4 items-center">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              type="text"
              placeholder="Buscar productos por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-11 bg-white/[0.03] backdrop-blur-xl border-white/[0.08] rounded-xl text-white placeholder:text-white/40 focus:border-white/[0.15] focus:bg-white/[0.05] transition-all"
            />
          </form>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]">
            <label className="text-sm text-white/70 cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={loadAllProducts}
                onChange={(e) => {
                  setLoadAllProducts(e.target.checked);
                  setPage(1); // Resetear a página 1 al cambiar de modo
                }}
                className="h-4 w-4 rounded border-white/20 bg-white/[0.05] checked:bg-white checked:border-white cursor-pointer"
              />
              <span>Cargar todos</span>
            </label>
            {loadAllProducts && allProducts.length > 0 && (
              <span className="text-xs text-white/50">
                ({allProducts.length} productos)
              </span>
            )}
          </div>
        </div>

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

              {/* Mostrar paginación si hay más de una página o si tenemos el límite completo de productos */}
              {(totalPages > 1 || tableData.length >= limit) && (
                <div className="flex items-center justify-between text-white/70 text-sm pt-4">
                  <div>
                    Página <span className="font-medium">{page}</span> de{" "}
                    <span className="font-medium">{totalPages}</span>
                    {tableData.length > 0 && (
                      <span className="ml-2 text-white/50">
                        ({tableData.length} producto{tableData.length === 1 ? "" : "s"} en esta página)
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => {
                        if (page > 1) {
                          setPage(page - 1);
                        }
                      }}
                      className="border-white/20 text-white/80 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => {
                        if (page < totalPages) {
                          setPage(page + 1);
                        }
                      }}
                      className="border-white/20 text-white/80 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Selector de Modo de Carga */}
      {loadMode === "selector" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setLoadMode(null)}
          />
          <div className="relative w-full max-w-3xl rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/[0.12] shadow-[0_32px_80px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-[32px] font-semibold tracking-[-0.02em] text-white leading-tight">
                  Selecciona el modo de carga
                </h2>
                <Button
                  onClick={() => setLoadMode(null)}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl hover:bg-white/[0.08] text-white/60 hover:text-white transition-all"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {/* Carga Rápida */}
                <button
                  onClick={() => openCreateModal("quick")}
                  className="p-6 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                      <Zap className="h-6 w-6 text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-white text-lg">Carga rápida</h3>
                  </div>
                  <p className="text-white/60 text-sm mb-4">
                    Campos esenciales: nombre, precio, stock y categoría. Ideal para cargar productos rápidamente.
                  </p>
                  <ul className="text-white/50 text-xs space-y-1">
                    <li>• Nombre</li>
                    <li>• Precio</li>
                    <li>• Stock inicial</li>
                    <li>• Categoría</li>
                  </ul>
                </button>

                {/* Carga Completa */}
                <button
                  onClick={() => openCreateModal("full")}
                  className="p-6 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                      <FileText className="h-6 w-6 text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-white text-lg">Carga completa</h3>
                  </div>
                  <p className="text-white/60 text-sm mb-4">
                    Todos los campos disponibles: descripción, imágenes, variantes, SEO y más.
                  </p>
                  <ul className="text-white/50 text-xs space-y-1">
                    <li>• Todos los campos</li>
                    <li>• Variantes</li>
                    <li>• Imágenes</li>
                    <li>• SEO / slug</li>
                  </ul>
                </button>

                {/* Importación CSV */}
                <button
                  onClick={() => setLoadMode("csv")}
                  className="p-6 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                      <FileSpreadsheet className="h-6 w-6 text-green-400" />
                    </div>
                    <h3 className="font-semibold text-white text-lg">Importación masiva</h3>
                  </div>
                  <p className="text-white/60 text-sm mb-4">
                    Sube un archivo CSV con múltiples productos para importarlos de una vez.
                  </p>
                  <ul className="text-white/50 text-xs space-y-1">
                    <li>• Upload archivo CSV</li>
                    <li>• Preview de datos</li>
                    <li>• Confirmar importación</li>
                  </ul>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Carga Rápida */}
      {loadMode === "quick" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => !saving && setLoadMode(null)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/[0.12] shadow-[0_32px_80px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-300">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-black/40 backdrop-blur-xl p-6">
              <div>
                <h2 className="font-serif text-[28px] font-semibold tracking-[-0.02em] text-white leading-tight">
                  Carga rápida
                </h2>
                <p className="text-white/50 text-sm mt-1">Campos esenciales para crear productos rápidamente</p>
              </div>
              <Button
                onClick={() => !saving && setLoadMode(null)}
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-white/[0.08] text-white/60 hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                  Nombre <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (fieldErrors.name) {
                      const error = validateField("name", e.target.value);
                      setFieldErrors(prev => ({ ...prev, name: error || "" }));
                    }
                  }}
                  className={`h-11 bg-white/[0.04] backdrop-blur-xl border rounded-xl text-white placeholder:text-white/40 focus:bg-white/[0.06] transition-all ${
                    fieldErrors.name ? "border-red-500/50 focus:border-red-500" : "border-white/[0.1] focus:border-white/[0.2]"
                  }`}
                  placeholder="Ej: iPhone 15 Pro"
                />
                {fieldErrors.name && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* Precio y Stock */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                    Precio <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => {
                      setFormData({ ...formData, price: e.target.value });
                      if (fieldErrors.price) {
                        const error = validateField("price", e.target.value);
                        setFieldErrors(prev => ({ ...prev, price: error || "" }));
                      }
                    }}
                    className={`h-11 bg-white/[0.04] backdrop-blur-xl border rounded-xl text-white placeholder:text-white/40 focus:bg-white/[0.06] transition-all ${
                      fieldErrors.price ? "border-red-500/50 focus:border-red-500" : "border-white/[0.1] focus:border-white/[0.2]"
                    }`}
                    placeholder="0.00"
                  />
                  {fieldErrors.price && (
                    <p className="text-red-400 text-xs flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {fieldErrors.price}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                    Stock inicial <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => {
                      setFormData({ ...formData, stock: e.target.value });
                      if (fieldErrors.stock) {
                        const error = validateField("stock", e.target.value);
                        setFieldErrors(prev => ({ ...prev, stock: error || "" }));
                      }
                    }}
                    className={`h-11 bg-white/[0.04] backdrop-blur-xl border rounded-xl text-white placeholder:text-white/40 focus:bg-white/[0.06] transition-all ${
                      fieldErrors.stock ? "border-red-500/50 focus:border-red-500" : "border-white/[0.1] focus:border-white/[0.2]"
                    }`}
                    placeholder="0"
                  />
                  {fieldErrors.stock && (
                    <p className="text-red-400 text-xs flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {fieldErrors.stock}
                    </p>
                  )}
                </div>
              </div>

              {/* Categoría */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                  Categoría <span className="text-red-400">*</span>
                </Label>
                <select
                  id="category"
                  value={formData.categoryId || ""}
                  onChange={(e) => {
                    setFormData({ ...formData, categoryId: e.target.value });
                    if (fieldErrors.categoryId) {
                      const error = validateField("categoryId", e.target.value);
                      setFieldErrors(prev => ({ ...prev, categoryId: error || "" }));
                    }
                  }}
                  className={`w-full h-11 px-4 bg-white/[0.04] backdrop-blur-xl border rounded-xl text-white transition-all appearance-none cursor-pointer focus:outline-none focus:bg-white/[0.06] ${
                    fieldErrors.categoryId ? "border-red-500/50 focus:border-red-500" : "border-white/[0.1] focus:border-white/[0.2]"
                  }`}
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
                {fieldErrors.categoryId && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {fieldErrors.categoryId}
                  </p>
                )}
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                  Estado
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["draft", "active", "hidden"] as ProductStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormData({ ...formData, status })}
                      className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                        formData.status === status
                          ? "bg-white/[0.12] border-white/[0.3] text-white"
                          : "bg-white/[0.04] border-white/[0.1] text-white/60 hover:bg-white/[0.06]"
                      }`}
                    >
                      {status === "draft" ? "Borrador" : status === "active" ? "Activo" : "Oculto"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.08]">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-11 bg-white/[0.12] hover:bg-white/[0.16] backdrop-blur-md border border-white/[0.15] text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Crear producto
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setContinueAdding(true);
                    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                  }}
                  disabled={saving}
                  className="w-full h-11 bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-md border border-blue-500/30 text-blue-200 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear y seguir cargando
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => !saving && setLoadMode(null)}
                  disabled={saving}
                  variant="outline"
                  className="w-full h-11 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-md border-white/[0.1] text-white/80 hover:text-white rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Carga Completa */}
      {loadMode === "full" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => !saving && setLoadMode(null)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/[0.12] shadow-[0_32px_80px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-300">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-black/40 backdrop-blur-xl p-6">
              <h2 className="font-serif text-[32px] font-semibold tracking-[-0.02em] text-white leading-tight">
                {editingProduct ? "Editar producto" : "Nuevo producto"}
              </h2>
              <Button
                onClick={() => !saving && setLoadMode(null)}
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-white/[0.08] text-white/60 hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name-full" className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                  Nombre <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name-full"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (fieldErrors.name) {
                      const error = validateField("name", e.target.value);
                      setFieldErrors(prev => ({ ...prev, name: error || "" }));
                    }
                  }}
                  className={`h-11 bg-white/[0.04] backdrop-blur-xl border rounded-xl text-white placeholder:text-white/40 focus:bg-white/[0.06] transition-all ${
                    fieldErrors.name ? "border-red-500/50 focus:border-red-500" : "border-white/[0.1] focus:border-white/[0.2]"
                  }`}
                  placeholder="Ej: iPhone 15 Pro"
                />
                {fieldErrors.name && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* Precio y Stock */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price-full" className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                    Precio <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="price-full"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => {
                      setFormData({ ...formData, price: e.target.value });
                      if (fieldErrors.price) {
                        const error = validateField("price", e.target.value);
                        setFieldErrors(prev => ({ ...prev, price: error || "" }));
                      }
                    }}
                    className={`h-11 bg-white/[0.04] backdrop-blur-xl border rounded-xl text-white placeholder:text-white/40 focus:bg-white/[0.06] transition-all ${
                      fieldErrors.price ? "border-red-500/50 focus:border-red-500" : "border-white/[0.1] focus:border-white/[0.2]"
                    }`}
                    placeholder="0.00"
                  />
                  {fieldErrors.price && (
                    <p className="text-red-400 text-xs flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {fieldErrors.price}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock-full" className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                    Stock <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="stock-full"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => {
                      setFormData({ ...formData, stock: e.target.value });
                      if (fieldErrors.stock) {
                        const error = validateField("stock", e.target.value);
                        setFieldErrors(prev => ({ ...prev, stock: error || "" }));
                      }
                    }}
                    className={`h-11 bg-white/[0.04] backdrop-blur-xl border rounded-xl text-white placeholder:text-white/40 focus:bg-white/[0.06] transition-all ${
                      fieldErrors.stock ? "border-red-500/50 focus:border-red-500" : "border-white/[0.1] focus:border-white/[0.2]"
                    }`}
                    placeholder="0"
                  />
                  {fieldErrors.stock && (
                    <p className="text-red-400 text-xs flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {fieldErrors.stock}
                    </p>
                  )}
                </div>
              </div>

              {/* Categoría */}
              <div className="space-y-2">
                <Label htmlFor="category-full" className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                  Categoría <span className="text-red-400">*</span>
                </Label>
                <select
                  id="category-full"
                  value={formData.categoryId || ""}
                  onChange={(e) => {
                    setFormData({ ...formData, categoryId: e.target.value });
                    if (fieldErrors.categoryId) {
                      const error = validateField("categoryId", e.target.value);
                      setFieldErrors(prev => ({ ...prev, categoryId: error || "" }));
                    }
                  }}
                  className={`w-full h-11 px-4 bg-white/[0.04] backdrop-blur-xl border rounded-xl text-white transition-all appearance-none cursor-pointer focus:outline-none focus:bg-white/[0.06] ${
                    fieldErrors.categoryId ? "border-red-500/50 focus:border-red-500" : "border-white/[0.1] focus:border-white/[0.2]"
                  }`}
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
                {fieldErrors.categoryId && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {fieldErrors.categoryId}
                  </p>
                )}
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                  Estado
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["draft", "active", "hidden"] as ProductStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormData({ ...formData, status })}
                      className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                        formData.status === status
                          ? "bg-white/[0.12] border-white/[0.3] text-white"
                          : "bg-white/[0.04] border-white/[0.1] text-white/60 hover:bg-white/[0.06]"
                      }`}
                    >
                      {status === "draft" ? "Borrador" : status === "active" ? "Activo" : "Oculto"}
                    </button>
                  ))}
                </div>
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

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                  Slug (SEO)
                </Label>
                <Input
                  id="slug"
                  value={formData.slug || generateSlug(formData.name)}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="h-11 bg-white/[0.04] backdrop-blur-xl border-white/[0.1] rounded-xl text-white placeholder:text-white/40 focus:border-white/[0.2] focus:bg-white/[0.06] transition-all"
                  placeholder="Se genera automáticamente desde el nombre"
                />
                <p className="text-white/40 text-xs">URL amigable para SEO. Se genera automáticamente si se deja vacío.</p>
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
                      placeholder="https://ejemplo.com/imagen.jpg"
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
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : editingProduct ? (
                    "Actualizar"
                  ) : (
                    "Crear"
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => !saving && setLoadMode(null)}
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

      {/* Modal de Importación CSV */}
      {loadMode === "csv" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => !csvLoading && setLoadMode(null)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/[0.12] shadow-[0_32px_80px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-300">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-black/40 backdrop-blur-xl p-6">
              <div>
                <h2 className="font-serif text-[32px] font-semibold tracking-[-0.02em] text-white leading-tight">
                  Importación masiva (CSV)
                </h2>
                <p className="text-white/50 text-sm mt-1">Sube un archivo CSV con múltiples productos</p>
              </div>
              <Button
                onClick={() => !csvLoading && setLoadMode(null)}
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-white/[0.08] text-white/60 hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Upload */}
              {!csvFile && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-white/[0.2] rounded-xl p-12 text-center hover:border-white/[0.3] transition-colors">
                    <FileSpreadsheet className="h-12 w-12 text-white/40 mx-auto mb-4" />
                    <Label htmlFor="csv-upload" className="cursor-pointer">
                      <div className="space-y-2">
                        <p className="text-white font-medium">Haz clic para seleccionar un archivo CSV</p>
                        <p className="text-white/50 text-sm">o arrastra y suelta el archivo aquí</p>
                      </div>
                      <input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        className="hidden"
                      />
                    </Label>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <p className="text-white/70 text-sm font-medium mb-2">Formato requerido del CSV:</p>
                    <p className="text-white/50 text-xs font-mono">
                      name,price,stock,category,description
                    </p>
                    <p className="text-white/50 text-xs mt-2">
                      Ejemplo: iPhone 15 Pro,25000,10,Electrónicos,El último iPhone de Apple
                    </p>
                  </div>
                </div>
              )}

              {/* Preview */}
              {csvPreview.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-lg">Vista previa</h3>
                      <p className="text-white/50 text-sm">{csvPreview.length} productos listos para importar</p>
                    </div>
                    <Button
                      onClick={() => {
                        setCsvFile(null);
                        setCsvPreview([]);
                      }}
                      variant="outline"
                      size="sm"
                      className="bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.1] text-white/80 hover:text-white"
                    >
                      Cambiar archivo
                    </Button>
                  </div>

                  <div className="border border-white/[0.1] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-[400px]">
                      <table className="w-full text-sm">
                        <thead className="bg-white/[0.05] sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-white/70 font-medium">Nombre</th>
                            <th className="px-4 py-3 text-left text-white/70 font-medium">Precio</th>
                            <th className="px-4 py-3 text-left text-white/70 font-medium">Stock</th>
                            <th className="px-4 py-3 text-left text-white/70 font-medium">Categoría</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                          {csvPreview.slice(0, 10).map((row, index) => (
                            <tr key={index} className="hover:bg-white/[0.02]">
                              <td className="px-4 py-3 text-white/80">{row.name}</td>
                              <td className="px-4 py-3 text-white/80">${row.price}</td>
                              <td className="px-4 py-3 text-white/80">{row.stock}</td>
                              <td className="px-4 py-3 text-white/80">{row.category}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {csvPreview.length > 10 && (
                      <div className="px-4 py-3 bg-white/[0.03] text-center text-white/50 text-sm">
                        ... y {csvPreview.length - 10} productos más
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-white/[0.08]">
                    <Button
                      onClick={handleCSVImport}
                      disabled={csvLoading}
                      className="flex-1 h-11 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-md border border-green-500/30 text-green-200 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {csvLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Confirmar importación
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setCsvFile(null);
                        setCsvPreview([]);
                        setLoadMode(null);
                      }}
                      disabled={csvLoading}
                      variant="outline"
                      className="flex-1 h-11 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-md border-white/[0.1] text-white/80 hover:text-white rounded-xl font-medium transition-all disabled:opacity-50"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
