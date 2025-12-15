"use client";

import Link from "next/link";

interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  message?: string;
  showHomeButton?: boolean;
}

export default function ErrorPage({
  statusCode = 500,
  title,
  message,
  showHomeButton = true,
}: ErrorPageProps) {
  const errorMessages: Record<number, { title: string; message: string }> = {
    404: {
      title: "Página no encontrada",
      message: "Lo sentimos, la página que buscas no existe.",
    },
    500: {
      title: "Error del servidor",
      message: "Algo salió mal en el servidor. Por favor, intenta más tarde.",
    },
    401: {
      title: "No autorizado",
      message: "No tienes permisos para acceder a esta página.",
    },
    403: {
      title: "Acceso prohibido",
      message: "No tienes permisos para acceder a este recurso.",
    },
  };

  const error = errorMessages[statusCode] || {
    title: title || "Error",
    message: message || "Ocurrió un error inesperado.",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-gray-900 mb-2">
            {statusCode}
          </h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {error.title}
          </h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
        {showHomeButton && (
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Volver al inicio
            </Link>
            <button
              onClick={() => window.history.back()}
              className="block w-full text-gray-600 hover:text-gray-800 mt-4"
            >
              ← Volver atrás
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

