class ApiClient {
  private baseUrl: string;
  private useProxy: boolean;

  constructor(baseUrl: string, useProxy: boolean = true) {
    this.baseUrl = baseUrl;
    // Usar proxy solo en el cliente (navegador) para evitar CORS
    this.useProxy = useProxy && typeof window !== "undefined";
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  }

  private getProxyUrl(endpoint: string): string {
    // Remover el / inicial del endpoint
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
    // Separar el path de los query params
    const [path, queryString] = cleanEndpoint.split("?");
    // Construir la URL del proxy con query params si existen
    return queryString ? `/api/proxy/${path}?${queryString}` : `/api/proxy/${path}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Usar proxy en el cliente para evitar CORS
    const url = this.useProxy
      ? this.getProxyUrl(endpoint)
      : `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: "Error en la solicitud" };
      }

      // El backend ahora devuelve errores consistentes con formato:
      // { error: "...", details: [...], code: "...", hint: "..." }
      const errorMessage = errorData.error || "Error en la solicitud";
      
      // Construir mensaje de error más descriptivo si hay detalles de validación
      let fullErrorMessage = errorMessage;
      if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
        const validationErrors = errorData.details
          .map((detail: any) => {
            if (typeof detail === "string") return detail;
            if (detail.path && detail.message) {
              return `${detail.path.join(".")}: ${detail.message}`;
            }
            return detail.message || JSON.stringify(detail);
          })
          .join("; ");
        fullErrorMessage = `${errorMessage}. ${validationErrors}`;
      }

      if (response.status === 401) {
        // Solo remover el token si ya existe (no en login)
        const token = this.getToken();
        if (token && typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          // Redirigir a login si estamos en una ruta protegida
          if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
            window.location.href = "/login";
          }
        }
        // El backend ahora devuelve mensajes claros de autenticación
        throw new Error(errorMessage);
      }

      if (response.status === 400) {
        // Error de validación - el backend ahora incluye detalles útiles
        throw new Error(fullErrorMessage);
      }

      if (response.status === 404) {
        // El backend ahora devuelve mensajes claros de "no encontrado"
        throw new Error(errorMessage);
      }

      if (response.status >= 500) {
        // Error del servidor - el backend ahora incluye detalles en desarrollo
        throw new Error(errorMessage);
      }

      throw new Error(fullErrorMessage);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{
      success: boolean;
      user: any;
      session: { access_token: string };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", data.session.access_token);
    }
    return data;
  }

  // Products
  async getProducts(params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    categorySlug?: string;
    isFeatured?: boolean;
    search?: string;
    status?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, value.toString());
        }
      });
    }
    const url = `/products?${query.toString()}`;
    return this.request(url);
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`);
  }

  async createProduct(product: any) {
    return this.request("/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, updates: any) {
    return this.request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, { method: "DELETE" });
  }

  // Stock Management
  async adjustStock(productId: string, adjustment: { quantity: number; reason?: string }) {
    return this.request(`/products/${productId}/stock`, {
      method: "POST",
      body: JSON.stringify(adjustment),
    });
  }

  async getStockHistory(productId: string) {
    return this.request(`/products/${productId}/stock/history`);
  }

  // Product Ordering
  async updateProductsOrder(products: Array<{ id: string; position: number }>) {
    return this.request("/products/order", {
      method: "PUT",
      body: JSON.stringify({ products }),
    });
  }

  // Toggle Featured
  async toggleFeatured(productId: string, isFeatured: boolean) {
    return this.request(`/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify({ is_featured: isFeatured }),
    });
  }

  // Product Images
  async addProductImage(productId: string, imageData: { image_url: string }) {
    // Intentar diferentes endpoints posibles
    try {
      return await this.request(`/products/${productId}/images`, {
        method: "POST",
        body: JSON.stringify(imageData),
      });
    } catch {
      // Si no existe ese endpoint, intentar crear directamente en product_images
      return await this.request("/product-images", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          image_url: imageData.image_url,
        }),
      });
    }
  }

  // Categories
  async getCategories() {
    return this.request("/categories");
  }

  async getCategory(id: string) {
    return this.request(`/categories/${id}`);
  }

  async createCategory(category: any) {
    return this.request("/categories", {
      method: "POST",
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: string, updates: any) {
    return this.request(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteCategory(id: string) {
    return this.request(`/categories/${id}`, { method: "DELETE" });
  }

  // Upload
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const token = this.getToken();

    if (!token) {
      throw new Error("No hay token de autenticación");
    }

    // Usar proxy para upload también
    const url = this.useProxy ? "/api/upload" : `${this.baseUrl}/upload`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al subir imagen");
    }

    return response.json();
  }

  // Sales
  async getSales(params?: {
    page?: number;
    limit?: number;
    status?: 'draft' | 'confirmed' | 'cancelled' | 'paid';
    tenantId?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, value.toString());
        }
      });
    }
    const url = `/sales?${query.toString()}`;
    return this.request(url);
  }

  async getSale(id: string) {
    return this.request(`/sales/${id}`);
  }

  async createSale(sale: {
    tenantId?: string;
    items: Array<{
      productId: string;
      variantId?: string | null;
      quantity: number;
      unitPrice: number | string;
    }>;
    paymentMethod?: 'cash' | 'transfer' | 'mercadopago' | 'other';
    notes?: string;
  }) {
    return this.request("/sales", {
      method: "POST",
      body: JSON.stringify(sale),
    });
  }

  async updateSale(id: string, updates: {
    items?: Array<{
      productId: string;
      variantId?: string | null;
      quantity: number;
      unitPrice: number | string;
    }>;
    paymentMethod?: 'cash' | 'transfer' | 'mercadopago' | 'other';
    notes?: string;
  }) {
    return this.request(`/sales/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async confirmSale(id: string) {
    return this.request(`/sales/${id}/confirm`, {
      method: "POST",
    });
  }

  async cancelSale(id: string) {
    return this.request(`/sales/${id}/cancel`, {
      method: "POST",
    });
  }
}

export const api = new ApiClient(process.env.NEXT_PUBLIC_API_URL!);

