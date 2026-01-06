/**
 * Valida si una URL de imagen es válida y no es una URL de ejemplo
 */
export function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    
    // Filtrar URLs de ejemplo o inválidas
    const invalidHostnames = [
      'example.com',
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
    ];
    
    if (invalidHostnames.includes(parsedUrl.hostname)) {
      return false;
    }
    
    // Filtrar URLs que contengan "example" en el hostname
    if (parsedUrl.hostname.includes('example')) {
      return false;
    }
    
    return true;
  } catch {
    // Si no es una URL válida, retornar false
    return false;
  }
}

/**
 * Obtiene la URL de imagen válida de un producto
 */
export function getProductImageUrl(product: any): string | undefined {
  let imageUrl: string | undefined;
  
  if (product.product_images && product.product_images.length > 0) {
    imageUrl = product.product_images[0].image_url;
  } else {
    imageUrl = product.image || product.imageUrl || product.image_url;
  }
  
  return isValidImageUrl(imageUrl) ? imageUrl : undefined;
}

