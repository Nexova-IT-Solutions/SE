"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Copy, Eye, Grid3X3, Layers, Megaphone, Package, Pencil, Plus, Search, TableProperties, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProductData = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  occasions: { id: string; name: string }[];
  sizes: string[];
  colors: string[];
  productImages: any;
  productVariants: any;
  isActive: boolean;
  createdAt: Date;
};

type FilterOption = {
  id: string;
  name: string;
};

type InitialFilters = {
  q: string;
  category: string;
  occasion: string;
};

type ViewMode = "table" | "grid";

const VIEW_STORAGE_KEY = "admin-products-view-mode";
const GRID_COLUMNS_STORAGE_KEY = "admin-products-grid-columns";

const GRID_COLUMN_OPTIONS = [2, 3, 4, 6, 8] as const;

function getGridClassName(columns: number) {
  switch (columns) {
    case 2:
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2";
    case 3:
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    case 4:
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
    case 6:
      return "grid-cols-2 md:grid-cols-3 lg:grid-cols-6";
    case 8:
      return "grid-cols-2 md:grid-cols-4 lg:grid-cols-8";
    default:
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  }
}

export function ProductsClient({
  initialProducts,
  initialPage,
  initialPageSize,
  initialTotalCount,
}: {
  initialProducts: ProductData[];
  initialPage: number;
  initialPageSize: number;
  initialTotalCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductData[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductData | null>(null);
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [occasions, setOccasions] = useState<FilterOption[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [occasionFilter, setOccasionFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [gridColumns, setGridColumns] = useState<number>(4);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [promoteTarget, setPromoteTarget] = useState<ProductData | null>(null);
  const hasHydratedPreferences = useRef(false);

  const initialFilters: InitialFilters = useMemo(
    () => ({
      q: searchParams.get("q") || "",
      category: searchParams.get("category") || "",
      occasion: searchParams.get("occasion") || "",
    }),
    [searchParams]
  );

  const hasActiveFilters = Boolean(initialFilters.q || initialFilters.category || initialFilters.occasion);
  const totalPages = Math.max(1, Math.ceil(initialTotalCount / initialPageSize));
  const currentPage = Math.min(Math.max(initialPage, 1), totalPages);

  const pushWithFilters = (overrides?: {
    q?: string;
    category?: string;
    occasion?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const params = new URLSearchParams();

    const nextQ = overrides?.q ?? search.trim();
    const nextCategory = overrides?.category ?? categoryFilter;
    const nextOccasion = overrides?.occasion ?? occasionFilter;
    const nextPage = overrides?.page ?? currentPage;
    const nextPageSize = overrides?.pageSize ?? pageSize;

    if (nextQ) params.set("q", nextQ);
    if (nextCategory) params.set("category", nextCategory);
    if (nextOccasion) params.set("occasion", nextOccasion);
    if (nextPage > 1) params.set("page", String(nextPage));
    if (nextPageSize !== 20) params.set("pageSize", String(nextPageSize));

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  useEffect(() => {
    setProducts(initialProducts);
    setPageSize(initialPageSize);
  }, [initialProducts, initialPageSize]);

  useEffect(() => {
    setSearch(initialFilters.q);
    setCategoryFilter(initialFilters.category);
    setOccasionFilter(initialFilters.occasion);
  }, [initialFilters]);

  useEffect(() => {
    if (hasHydratedPreferences.current || typeof window === "undefined") {
      return;
    }

    const storedView = window.localStorage.getItem(VIEW_STORAGE_KEY);
    const storedColumns = Number(window.localStorage.getItem(GRID_COLUMNS_STORAGE_KEY));

    if (storedView === "table" || storedView === "grid") {
      setViewMode(storedView);
    }

    if (GRID_COLUMN_OPTIONS.includes(storedColumns as (typeof GRID_COLUMN_OPTIONS)[number])) {
      setGridColumns(storedColumns);
    }

    hasHydratedPreferences.current = true;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hasHydratedPreferences.current) {
      return;
    }

    window.localStorage.setItem(VIEW_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasHydratedPreferences.current) {
      return;
    }

    window.localStorage.setItem(GRID_COLUMNS_STORAGE_KEY, String(gridColumns));
  }, [gridColumns]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextQ = search.trim();
      if (nextQ === initialFilters.q) return;
      pushWithFilters({ q: nextQ, page: 1 });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [initialFilters.q, search]);

  useEffect(() => {
    let active = true;

    const loadFilterOptions = async () => {
      try {
        const [categoriesRes, occasionsRes] = await Promise.all([
          fetch("/api/admin/categories", { cache: "no-store" }),
          fetch("/api/admin/occasions", { cache: "no-store" }),
        ]);

        const categoriesJson = categoriesRes.ok ? await categoriesRes.json() : [];
        const occasionsJson = occasionsRes.ok ? await occasionsRes.json() : [];

        if (!active) return;

        setCategories(
          Array.isArray(categoriesJson)
            ? categoriesJson.map((item) => ({ id: item.id, name: item.name })).filter((item) => item.id && item.name)
            : []
        );
        setOccasions(
          Array.isArray(occasionsJson)
            ? occasionsJson.map((item) => ({ id: item.id, name: item.name })).filter((item) => item.id && item.name)
            : []
        );
      } catch {
        if (!active) return;
        setCategories([]);
        setOccasions([]);
      }
    };

    void loadFilterOptions();

    return () => {
      active = false;
    };
  }, []);

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setOccasionFilter("");
    pushWithFilters({ q: "", category: "", occasion: "", page: 1 });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete product");
      }

      setProducts((prev) => prev.filter((product) => product.id !== deleteTarget.id));
      toast({ title: "Product deleted", description: "Product removed from inventory." });
      router.refresh();
      setDeleteTarget(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete product", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1F1720]">Catalogue Inventory</h1>
          <p className="text-[#6B5A64] mt-2">Design and manage your product offerings with precision.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-brand-border bg-white p-1">
            <Button
              type="button"
              size="icon"
              variant={viewMode === "table" ? "default" : "ghost"}
              className={viewMode === "table" ? "bg-[#315243] hover:bg-[#1A3026]" : "hover:bg-[#FDF9E8]"}
              onClick={() => setViewMode("table")}
              aria-label="Table view"
            >
              <TableProperties className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={viewMode === "grid" ? "default" : "ghost"}
              className={viewMode === "grid" ? "bg-[#315243] hover:bg-[#1A3026]" : "hover:bg-[#FDF9E8]"}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>

          {viewMode === "grid" ? (
            <select
              value={gridColumns}
              onChange={(event) => setGridColumns(Number(event.target.value))}
              className="h-10 rounded-xl border border-brand-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#315243]"
            >
              {GRID_COLUMN_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} Columns
                </option>
              ))}
            </select>
          ) : null}

          <Button
            asChild
            className="bg-[#315243] hover:bg-[#1A3026] text-white shrink-0 shadow-lg shadow-[#315243]/20"
          >
            <Link href="/admin/products/new">
              <Plus className="w-5 h-5 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[260px] flex-1">
            <label className="sr-only">Search</label>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by Name, ID, Category or Occasion"
              className="h-11"
            />
            <p className="mt-1 text-[11px] text-[#6B5A64]">Auto-searches after a short pause.</p>
          </div>

          <div className="w-full min-w-[180px] sm:w-[220px]">
            <label className="sr-only">Category</label>
            <select
              value={categoryFilter}
              onChange={(event) => {
                const value = event.target.value;
                setCategoryFilter(value);
                pushWithFilters({ category: value, page: 1 });
              }}
              className="h-11 w-full rounded-xl border border-brand-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#315243]"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full min-w-[180px] sm:w-[220px]">
            <label className="sr-only">Occasion</label>
            <select
              value={occasionFilter}
              onChange={(event) => {
                const value = event.target.value;
                setOccasionFilter(value);
                pushWithFilters({ occasion: value, page: 1 });
              }}
              className="h-11 w-full rounded-xl border border-brand-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#315243]"
            >
              <option value="">All Occasions</option>
              {occasions.map((occasion) => (
                <option key={occasion.id} value={occasion.id}>
                  {occasion.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full min-w-[120px] sm:w-[140px]">
            <label className="sr-only">Per Page</label>
            <select
              value={pageSize}
              onChange={(event) => {
                const nextPageSize = Number(event.target.value);
                setPageSize(nextPageSize);
                pushWithFilters({ pageSize: nextPageSize, page: 1 });
              }}
              className="h-11 w-full rounded-xl border border-brand-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#315243]"
            >
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>

          <Button type="button" variant="outline" onClick={clearFilters} className="h-11 border-brand-border px-5">
            Clear
          </Button>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="bg-white rounded-[2rem] shadow-2xl border border-brand-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="bg-[#FAFAFA] border-b border-brand-border text-[#6B5A64]">
              <tr>
                <th className="px-8 py-6 font-bold uppercase tracking-widest text-[11px]">Identity</th>
                <th className="px-8 py-6 font-bold uppercase tracking-widest text-[11px]">Placement</th>
                <th className="px-8 py-6 font-bold uppercase tracking-widest text-[11px]">Valuation</th>
                <th className="px-8 py-6 font-bold uppercase tracking-widest text-[11px]">Availability</th>
                <th className="px-8 py-6 font-bold uppercase tracking-widest text-[11px]">Attributes</th>
                <th className="px-8 py-6 font-bold uppercase tracking-widest text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {products.map((product) => (
                <tr key={product.id} className="group hover:bg-[#FDF9E8]/10 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="relative w-16 h-16 rounded-2xl border border-brand-border bg-[#FAFAFA] overflow-hidden shadow-inner group-hover:scale-110 transition-transform duration-500">
                          {product.productImages?.[0] ? (
                             <Image src={product.productImages[0].url} alt={product.name} fill className="object-cover" />
                          ) : <Package className="w-full h-full p-4 text-gray-200" />}
                       </div>
                       <div>
                         <div className="font-bold text-[#1F1720] text-lg leading-tight">{product.name}</div>
                         <div className="text-[11px] font-bold text-[#315243] uppercase tracking-tighter mt-1 opacity-70">ID: {product.id.substring(0,8)}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-brand-surface text-[#1F1720] text-xs font-bold border border-brand-border uppercase tracking-tight">
                       {product.category?.name || "Unplaced"}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xl font-black text-[#315243]">
                       <span className="text-sm font-bold mr-1 opacity-50">LKR</span>
                       {product.price.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                       <div className={`text-sm font-extrabold flex items-center gap-2 ${product.stock <= 5 ? "text-red-500" : "text-emerald-500"}`}>
                          <div className={`w-2 h-2 rounded-full ${product.stock <= 5 ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`}></div>
                          {product.stock} units
                       </div>
                       <div className="text-[10px] text-[#6B5A64] font-medium uppercase tracking-widest">Inventory Level</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-1.5">
                      {product.sizes.map(s => <Badge key={s} variant="secondary" className="text-[10px] py-0.5 px-2 bg-gray-50 border-gray-200 font-bold">{s}</Badge>)}
                      {product.colors.map(c => <Badge key={c} className="text-[10px] py-0.5 px-2 bg-[#1F1720] font-bold">{c}</Badge>)}
                      {product.occasions.map((occ) => (
                        <Badge key={occ.id} variant="secondary" className="text-[10px] py-0.5 px-2 bg-[#FDF9E8] text-[#315243] border-0 font-bold">
                          {occ.name}
                        </Badge>
                      ))}
                      {product.sizes.length === 0 && product.colors.length === 0 && <span className="text-[10px] font-bold text-gray-300 italic uppercase">Default Base</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="border-brand-border hover:bg-[#315243] hover:text-white text-[#315243] transition-colors"
                        onClick={() => setPromoteTarget(product)}
                        title="Promote on Social Media"
                      >
                        <Megaphone className="w-4 h-4" />
                      </Button>
                      <Button asChild variant="outline" size="icon" className="border-brand-border hover:bg-[#315243] hover:text-white text-[#1F1720] transition-colors">
                        <Link href={`/products/${product.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Preview ${product.name}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="icon" className="border-brand-border hover:bg-[#315243] hover:text-white text-[#1F1720] transition-colors">
                        <Link href={`/admin/products/${product.id}/edit`} aria-label={`Edit ${product.name}`}>
                          <Pencil className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="hover:bg-red-700 transition-colors"
                        onClick={() => setDeleteTarget(product)}
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    {hasActiveFilters ? (
                      <>
                        <div className="w-20 h-20 bg-brand-surface rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-brand-border">
                          <Search className="w-10 h-10 text-[#315243] opacity-20" />
                        </div>
                        <p className="font-black text-2xl text-[#1F1720] uppercase tracking-tighter">No products found</p>
                        <p className="text-[#6B5A64] mt-2">Try different search criteria or clear the filters.</p>
                        <Button type="button" variant="outline" className="mt-6 border-brand-border" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-brand-surface rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-brand-border">
                           <Layers className="w-10 h-10 text-[#315243] opacity-20" />
                        </div>
                        <p className="font-black text-2xl text-[#1F1720] uppercase tracking-tighter">Your inventory is empty</p>
                        <p className="text-[#6B5A64] mt-2">Begin by registering your first product above.</p>
                      </>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-2xl border border-brand-border p-4 md:p-6">
          {products.length === 0 ? (
            <div className="px-8 py-24 text-center">
              <div className="w-20 h-20 bg-brand-surface rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-brand-border">
                <Search className="w-10 h-10 text-[#315243] opacity-20" />
              </div>
              <p className="font-black text-2xl text-[#1F1720] uppercase tracking-tighter">No products found</p>
              <p className="text-[#6B5A64] mt-2">Try different search criteria or clear the filters.</p>
              <Button type="button" variant="outline" className="mt-6 border-brand-border" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className={`grid gap-4 ${getGridClassName(gridColumns)}`}>
              {products.map((product) => (
                <div key={product.id} className="h-full rounded-2xl border border-brand-border bg-white p-3 shadow-sm transition hover:shadow-md flex flex-col">
                  <div className="relative mb-3 aspect-square overflow-hidden rounded-xl border border-brand-border bg-[#FAFAFA]">
                    {product.productImages?.[0] ? (
                      <Image src={product.productImages[0].url} alt={product.name} fill className="object-cover" />
                    ) : (
                      <Package className="h-full w-full p-6 text-gray-200" />
                    )}
                  </div>

                  <p className="line-clamp-2 min-h-[40px] text-sm font-bold text-[#1F1720]">{product.name}</p>
                  <p className="mt-1 text-xs font-semibold text-[#315243]">LKR {product.price.toLocaleString()}</p>
                  <p className="mt-1 text-[11px] text-[#6B5A64]">Stock: {product.stock}</p>
                  <p className="mt-1 line-clamp-1 text-[11px] text-[#6B5A64]">{product.category?.name || "Unplaced"}</p>

                  <div className="mt-auto pt-3 flex items-center justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 border-brand-border hover:bg-[#315243] hover:text-white text-[#315243] transition-colors"
                      onClick={() => setPromoteTarget(product)}
                      title="Promote on Social Media"
                    >
                      <Megaphone className="w-4 h-4" />
                    </Button>
                    <Button asChild variant="outline" size="icon" className="h-8 w-8 border-brand-border hover:bg-[#315243] hover:text-white text-[#1F1720] transition-colors">
                      <Link href={`/products/${product.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Preview ${product.name}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="icon" className="h-8 w-8 border-brand-border hover:bg-[#315243] hover:text-white text-[#1F1720] transition-colors">
                      <Link href={`/admin/products/${product.id}/edit`} aria-label={`Edit ${product.name}`}>
                        <Pencil className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-700 transition-colors"
                      onClick={() => setDeleteTarget(product)}
                      aria-label={`Delete ${product.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-brand-border bg-white px-4 py-3 sm:flex-row sm:items-center">
        <p className="text-sm text-[#6B5A64]">
          Showing {(currentPage - 1) * initialPageSize + (products.length > 0 ? 1 : 0)}-
          {(currentPage - 1) * initialPageSize + products.length} of {initialTotalCount}
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-brand-border"
            disabled={currentPage <= 1}
            onClick={() => pushWithFilters({ page: currentPage - 1 })}
          >
            Previous
          </Button>
          <span className="text-sm font-semibold text-[#1F1720]">
            Page {currentPage} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            className="border-brand-border"
            disabled={currentPage >= totalPages}
            onClick={() => pushWithFilters({ page: currentPage + 1 })}
          >
            Next
          </Button>
        </div>
      </div>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to delete "${deleteTarget?.name ?? "this product"}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote Dialog */}
      <Dialog open={Boolean(promoteTarget)} onOpenChange={(open) => !open && setPromoteTarget(null)}>
        <DialogContent className="max-w-[95vw] lg:max-w-[1000px] rounded-[2rem] p-0 overflow-hidden border-brand-border bg-white shadow-2xl">
          <div className="bg-[#1A3026] p-8 text-white relative">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-3xl font-extrabold flex items-center gap-4 tracking-tighter uppercase">
                <div className="bg-[#315243] p-2.5 rounded-xl shadow-inner">
                  <Megaphone className="w-8 h-8 text-[#FDF9E8]" />
                </div>
                Social Media Promotion
              </DialogTitle>
              <DialogDescription className="text-white/60 font-medium text-lg">
                High-converting promotional content ready for your digital boutique channels.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 lg:p-12">
            <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 items-start">
              {/* Image Preview */}
              <div className="space-y-4">
                <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-[#FAFAFA] border-2 border-brand-border shadow-2xl group">
                  {promoteTarget?.productImages?.[0] ? (
                    <Image src={promoteTarget.productImages[0].url} alt={promoteTarget.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <Package className="w-full h-full p-16 text-gray-200" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="flex flex-col gap-1 px-2">
                   <p className="text-sm font-bold text-[#1F1720] uppercase tracking-widest opacity-40">Preview Aspect Ratio: 1:1</p>
                </div>
              </div>

              {/* Post Content */}
              <div className="flex flex-col h-full space-y-6">
                <div className="bg-[#FDF9E8]/30 border-2 border-[#315243]/10 rounded-[2rem] p-6 shadow-inner relative">
                  <div className="absolute top-4 right-4 text-[10px] font-black text-[#315243]/20 uppercase tracking-[0.2em]">Generated Copy</div>
                  <div className="font-sans text-base lg:text-lg text-[#1F1720] whitespace-pre-wrap leading-relaxed min-h-[320px]">
                    {`✨ **New Arrival at Skyish & Earthly** ✨\n\nElevate your style with our latest boutique piece: **${promoteTarget?.name}**\n\n💰 Price: ${promoteTarget ? `LKR ${promoteTarget.price.toLocaleString()}` : ""}\n\n${promoteTarget?.description ? `${promoteTarget.description}\n\n` : ""}🛍️ Shop exclusively at:\n${typeof window !== "undefined" ? window.location.origin : ""}/products/${promoteTarget?.id}\n\n#SkyishAndEarthly #LuxuryBoutique #PremiumFashion #SriLanka #NewArrival`}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Button 
                    className="flex-1 h-16 bg-[#315243] hover:bg-[#1A3026] text-white rounded-2xl text-lg font-bold shadow-xl shadow-[#315243]/20 transition-all hover:scale-[1.02] active:scale-95"
                    onClick={() => {
                      if (!promoteTarget) return;
                      const content = `✨ New Arrival at Skyish & Earthly ✨\n\nElevate your style with our latest boutique piece: ${promoteTarget.name}\n\nPrice: LKR ${promoteTarget.price.toLocaleString()}\n\n${promoteTarget.description ? `${promoteTarget.description}\n\n` : ""}Shop exclusively at:\n${window.location.origin}/products/${promoteTarget.id}\n\n#SkyishAndEarthly #LuxuryBoutique #PremiumFashion #SriLanka #NewArrival`;
                      navigator.clipboard.writeText(content);
                      toast({
                        title: "Boutique Copy Captured!",
                        description: "Promotion post has been saved to your clipboard.",
                      });
                    }}
                  >
                    <Copy className="w-5 h-5 mr-3" />
                    Copy Post Content
                  </Button>
                  <Button variant="outline" onClick={() => setPromoteTarget(null)} className="h-16 px-8 rounded-2xl border-brand-border text-[#6B5A64] font-bold">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
