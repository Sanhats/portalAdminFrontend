"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Plus, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";

import { api } from "@/lib/api-client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { GridIcon } from "@/components/icons/custom-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al cargar categorías");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
    });
    setShowModal(true);
    setError(null);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setShowModal(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const slug = generateSlug(formData.name);
      const categoryData: any = {
        name: formData.name,
        slug: slug,
      };

      if (formData.description) {
        categoryData.description = formData.description;
      }

      if (editingCategory) {
        await api.updateCategory(editingCategory.id, categoryData);
        setSuccess("Categoría actualizada correctamente");
      } else {
        await api.createCategory(categoryData);
        setSuccess("Categoría creada correctamente");
      }

      setShowModal(false);
      loadCategories();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error al guardar categoría");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar la categoría "${name}"?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      // Volver a usar el cliente de API, que llama al backend real
      await api.deleteCategory(id);
      setSuccess("Categoría eliminada correctamente. Los productos asociados quedaron sin categoría.");
      loadCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error al eliminar categoría");
    }
  };

  const filteredCategories = useMemo(
    () =>
      categories.filter((category) =>
        category.name.toLowerCase().includes(search.toLowerCase())
      ),
    [categories, search]
  );

  const totalCategories = categories.length;

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <h1 className="font-serif text-[28px] sm:text-[36px] lg:text-[44px] font-semibold tracking-[-0.03em] text-white leading-[1.1]">
                Categorías de productos
              </h1>
              <div className="ornamental-divider w-24" />
              <p className="text-[15px] font-light text-white/45 leading-relaxed tracking-[-0.005em] max-w-xl">
                Organiza tu catálogo en categorías claras para facilitar la navegación en la tienda.
              </p>
            </div>
            <Button
              onClick={openCreateModal}
              className="bg-white/[0.12] hover:bg-white/[0.16] backdrop-blur-md border border-white/[0.15] text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] rounded-xl px-5 py-2.5 h-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva categoría
            </Button>
          </div>
        </div>

        {/* Mensajes de éxito y error */}
        {success && (
          <div className="mb-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 backdrop-blur-xl">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100 backdrop-blur-xl">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 transition-all duration-300 hover:shadow-[0_24px_72px_rgba(0,0,0,0.6)] hover:border-white/[0.1]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/[0.06] backdrop-blur-md icon-container">
                <GridIcon className="h-6 w-6 text-white/80" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-white/50 tracking-[-0.005em]">
                  Total categorías
                </p>
                <p className="font-serif text-[32px] font-semibold text-white tracking-[-0.02em] leading-none mt-1">
                  {totalCategories}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 transition-all duration-300 hover:shadow-[0_24px_72px_rgba(0,0,0,0.6)] hover:border-white/[0.1]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/[0.06] backdrop-blur-md icon-container">
                <GridIcon className="h-6 w-6 text-white/80" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-white/50 tracking-[-0.005em]">
                  Categorías activas
                </p>
                <p className="font-serif text-[32px] font-semibold text-white tracking-[-0.02em] leading-none mt-1">
                  {totalCategories}
                </p>
                <p className="mt-1 text-[11px] text-white/40">
                  No hay estadísticas por el momento
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 transition-all duration-300 hover:shadow-[0_24px_72px_rgba(0,0,0,0.6)] hover:border-white/[0.1]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/[0.06] backdrop-blur-md icon-container">
                <GridIcon className="h-6 w-6 text-white/80" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-white/50 tracking-[-0.005em]">
                  Total de productos
                </p>
                <p className="font-serif text-[32px] font-semibold text-white tracking-[-0.02em] leading-none mt-1">
                  -
                </p>
                <p className="mt-1 text-[11px] text-white/40">
                  No hay estadísticas por el momento
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            type="text"
            placeholder="Buscar categorías..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 pl-11 bg-white/[0.03] backdrop-blur-xl border-white/[0.08] rounded-xl text-white placeholder:text-white/40 focus:border-white/[0.15] focus:bg-white/[0.05] transition-all"
          />
        </div>

        {/* Categories Grid */}
        <div className="space-y-5">
          <div>
            <h2 className="font-serif text-[28px] font-semibold text-white tracking-[-0.02em] leading-tight">
              Todas las categorías
            </h2>
            <p className="mt-2 text-[14px] font-light text-white/45 tracking-[-0.005em]">
              {loading
                ? "Cargando categorías..."
                : `${filteredCategories.length} categoría${
                    filteredCategories.length === 1 ? "" : "s"
                  } encontradas`}
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-white/60">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white/70"></div>
              <p className="mt-2 text-sm">Cargando categorías...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-8 text-center text-white/60 bg-white/[0.03] border border-white/[0.06] rounded-2xl backdrop-blur-xl">
              No hay categorías disponibles.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="group overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 transition-all duration-300 hover:shadow-[0_24px_72px_rgba(0,0,0,0.6)] hover:border-white/[0.1] hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/[0.06] backdrop-blur-md icon-container transition-all duration-300 group-hover:bg-white/[0.1]">
                      <GridIcon className="h-6 w-6 text-white/80" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-white/[0.08] hover:backdrop-blur-md text-white/50 hover:text-white/90 transition-all"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="border-white/[0.12] bg-black/90 backdrop-blur-xl text-white shadow-[0_8px_32px_rgba(0,0,0,0.9)] rounded-xl"
                      >
                        <DropdownMenuLabel className="text-white/60 text-[11px] uppercase tracking-wide font-semibold">
                          Acciones
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/[0.08]" />
                        <DropdownMenuItem
                          className="text-white/80 text-[13px] focus:bg-white/[0.08] focus:text-white/95 rounded-lg"
                          onClick={() => openEditModal(category)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-white/80 text-[13px] focus:bg-white/[0.08] focus:text-white/95 rounded-lg"
                          onClick={() => handleDelete(category.id, category.name)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-serif text-[22px] font-semibold text-white tracking-[-0.015em] leading-tight">
                        {category.name}
                      </h3>
                      <p className="mt-1.5 text-[13px] font-light text-white/50 leading-relaxed tracking-[-0.005em]">
                        {category.description || "Sin descripción"}
                      </p>
                    </div>

                    {category.slug && (
                      <p className="text-[11px] text-white/35 mt-1">
                        Slug: <span className="font-mono">{category.slug}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de crear/editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => {
              setShowModal(false);
              setError(null);
            }}
          />

          {/* Modal */}
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/[0.12] shadow-[0_32px_80px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-black/40 backdrop-blur-xl p-6">
              <h2 className="font-serif text-[32px] font-semibold tracking-[-0.02em] text-white leading-tight">
                {editingCategory ? "Editar categoría" : "Nueva categoría"}
              </h2>
              <Button
                onClick={() => {
                  setShowModal(false);
                  setError(null);
                }}
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
              <div className="space-y-2">
                <Label htmlFor="category-name" className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                  Nombre de categoría *
                </Label>
                <Input
                  id="category-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-11 bg-white/[0.04] backdrop-blur-xl border-white/[0.1] rounded-xl text-white placeholder:text-white/40 focus:border-white/[0.2] focus:bg-white/[0.06] transition-all"
                  placeholder="Ej: Electrónicos"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-description" className="text-[13px] font-medium text-white/70 tracking-[-0.005em]">
                  Descripción
                </Label>
                <Textarea
                  id="category-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-[100px] bg-white/[0.04] backdrop-blur-xl border-white/[0.1] rounded-xl text-white placeholder:text-white/40 focus:border-white/[0.2] focus:bg-white/[0.06] transition-all resize-none"
                  placeholder="Describe la categoría..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/[0.08]">
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-white/[0.12] hover:bg-white/[0.16] backdrop-blur-md border border-white/[0.15] text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] rounded-xl font-medium"
                >
                  {editingCategory ? "Actualizar" : "Crear"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError(null);
                  }}
                  variant="outline"
                  className="flex-1 h-11 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-md border-white/[0.1] text-white/80 hover:text-white rounded-xl font-medium transition-all"
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
