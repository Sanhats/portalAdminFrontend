import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, "PUT");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, "DELETE");
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  if (!API_URL) {
    return NextResponse.json(
      { error: "API_URL no configurada" },
      { status: 500 }
    );
  }

  // Construir el path desde los segmentos
  let path = pathSegments.join("/");
  
  // Asegurar que API_URL no termine con / y path no empiece con /
  const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  // Si el path contiene "?", separar el path de los query params
  if (path.includes("?")) {
    const [pathPart, queryPart] = path.split("?");
    const cleanPathPart = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
    const url = new URL(request.url);
    // Combinar query params del path con los de la URL
    const existingQuery = url.searchParams.toString();
    const pathQuery = new URLSearchParams(queryPart);
    const combinedQuery = new URLSearchParams(existingQuery);
    pathQuery.forEach((value, key) => {
      combinedQuery.set(key, value);
    });
    const queryString = combinedQuery.toString();
    const targetUrl = `${baseUrl}${cleanPathPart}${queryString ? `?${queryString}` : ""}`;
    return makeRequest(request, targetUrl, method);
  }

  const url = new URL(request.url);
  const queryString = url.search;
  const targetUrl = `${baseUrl}${cleanPath}${queryString}`;
  
  return makeRequest(request, targetUrl, method);
}

async function makeRequest(
  request: NextRequest,
  targetUrl: string,
  method: string
) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (method !== "GET" && method !== "DELETE") {
    const body = await request.text();
    if (body) {
      options.body = body;
    }
  }

  try {
    const response = await fetch(targetUrl, options);
    
    // Leer el cuerpo de la respuesta una sola vez
    const contentType = response.headers.get("content-type");
    let data: any;
    
    if (contentType && contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch {
        data = { error: "Error al parsear respuesta del servidor" };
      }
    } else {
      const text = await response.text();
      try {
        // Intentar parsear como JSON si es texto
        data = JSON.parse(text);
      } catch {
        data = text ? { error: text } : { error: "Error en la solicitud" };
      }
    }

    // El backend ahora devuelve errores consistentes con formato estándar
    // Simplemente propagamos la respuesta tal cual
    if (!response.ok) {
      return NextResponse.json(data, { 
        status: response.status,
        // El backend ya incluye headers CORS, pero los mantenemos por seguridad
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error en la solicitud" },
      { status: 500 }
    );
  }
}

