"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Plus, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";

import { api } from "@/lib/api-client";
import { DashboardLayout } from "@/components/dashboard-layout";
import LoadingSpinner from "@/components/LoadingSpinner";
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

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Mensajes de éxito y error */}
        {success && (
          <div className="mb-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 ">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100 ">
            {error}
          </div>
        )}

        {/* Header Section - Botón centrado */}
        <div className="flex justify-center">
          <Button
            onClick={openCreateModal}
            className="neu-elevated neu-hover neu-active text-foreground transition-all duration-300 rounded-xl px-6 py-3 h-auto text-base font-medium"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nueva categoría
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar categorías..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 pl-11 neu-pressed rounded-xl text-foreground placeholder:text-muted-foreground focus:neu-elevated transition-all"
          />
        </div>

        {/* Categories Grid */}
        <div className="space-y-5">
          {loading ? (
            <LoadingSpinner />
          ) : filteredCategories.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground neu-pressed rounded-2xl">
              No hay categorías disponibles.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="group overflow-hidden rounded-2xl neu-elevated p-6 transition-all duration-300 neu-hover neu-active"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[14px] neu-flat icon-container transition-all duration-300 group-hover:neu-elevated">
                      <GridIcon className="h-6 w-6 text-foreground" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg neu-flat neu-hover neu-active text-muted-foreground hover:text-foreground transition-all"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="neu-elevated text-foreground rounded-xl"
                      >
                        <DropdownMenuLabel className="text-muted-foreground text-[11px] uppercase tracking-wide font-semibold">
                          Acciones
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="neu-pressed" />
                        <DropdownMenuItem
                          className="text-foreground text-[13px] focus:neu-elevated rounded-lg"
                          onClick={() => openEditModal(category)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-foreground text-[13px] focus:neu-elevated rounded-lg"
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
            className="absolute inset-0 bg-background/90"
            onClick={() => {
              setShowModal(false);
              setError(null);
            }}
          />

          {/* Modal */}
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl neu-elevated animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b-0 neu-pressed p-6 rounded-t-2xl">
              <h2 className="font-serif text-[32px] font-semibold tracking-[-0.02em] text-foreground leading-tight">
                {editingCategory ? "Editar categoría" : "Nueva categoría"}
              </h2>
              <Button
                onClick={() => {
                  setShowModal(false);
                  setError(null);
                }}
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl neu-flat neu-hover neu-active text-muted-foreground hover:text-foreground transition-all"
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
                  className="h-11 neu-pressed border-0 rounded-xl text-white placeholder:text-white/40 focus:border-0 focus:neu-elevated transition-all"
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
                  className="min-h-[100px] neu-pressed border-0 rounded-xl text-white placeholder:text-white/40 focus:border-0 focus:neu-elevated transition-all resize-none"
                  placeholder="Describe la categoría..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t-0 neu-pressed pt-4">
                <Button
                  type="submit"
                  className="flex-1 h-11 neu-elevated neu-hover neu-active text-foreground transition-all duration-300 rounded-xl font-medium"
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
                  className="flex-1 h-11 neu-flat neu-hover neu-active text-muted-foreground hover:text-foreground rounded-xl font-medium transition-all"
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
