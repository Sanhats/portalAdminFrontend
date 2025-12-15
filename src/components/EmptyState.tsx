"use client";

import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
  icon?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        action.onClick ? (
          <button
            onClick={action.onClick}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {action.label}
          </button>
        ) : (
          <Link
            href={action.href}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {action.label}
          </Link>
        )
      )}
    </div>
  );
}

// Estados vacíos específicos
export function EmptyProducts({ 
  message = "No hay productos disponibles",
  showAction = true 
}: { 
  message?: string;
  showAction?: boolean;
}) {
  return (
    <EmptyState
      title="No hay productos"
      description={message}
      action={
        showAction
          ? {
              label: "Ver todos los productos",
              href: "/products",
            }
          : undefined
      }
      icon={
        <svg
          className="w-16 h-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      }
    />
  );
}

export function EmptySearch({ onClear }: { onClear?: () => void }) {
  return (
    <EmptyState
      title="No se encontraron resultados"
      description="Intenta con otros términos de búsqueda o limpia los filtros"
      action={
        onClear
          ? {
              label: "Limpiar búsqueda",
              href: "#",
            }
          : {
              label: "Ver todos los productos",
              href: "/products",
            }
      }
      icon={
        <svg
          className="w-16 h-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
    />
  );
}

export function EmptyCategory() {
  return (
    <EmptyState
      title="No hay productos en esta categoría"
      description="Esta categoría aún no tiene productos disponibles"
      action={{
        label: "Ver todas las categorías",
        href: "/products",
      }}
      icon={
        <svg
          className="w-16 h-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      }
    />
  );
}

