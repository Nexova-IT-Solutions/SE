"use client";

import { Grid3X3, List, X } from "lucide-react";
import { parseAsArrayOf, parseAsBoolean, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProductsTopBarProps = {
  totalCount: number;
  visibleCount: number;
  categories: Array<{ id: string; name: string; parentId?: string | null }>;
};

export function ProductsTopBar({ totalCount, visibleCount, categories }: ProductsTopBarProps) {
  const [queryState, setQueryState] = useQueryStates(
    {
      categories: parseAsArrayOf(parseAsString, ",").withDefault([]),
      occasion: parseAsString,
      mood: parseAsString,
      price_min: parseAsInteger,
      price_max: parseAsInteger,
      in_stock: parseAsBoolean.withDefault(false),
      sort: parseAsStringLiteral(["newest", "price-asc", "price-desc", "name-asc"]).withDefault("newest"),
      view: parseAsStringLiteral(["grid", "list"]).withDefault("grid"),
      limit: parseAsInteger.withDefault(12),
      byob: parseAsString,
    },
    {
      clearOnDefault: true,
      history: "replace",
      shallow: false,
    }
  );

  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const getDepth = (categoryId: string) => {
    let depth = 0;
    let currentId = categoryId;

    while (depth < 5) {
      const current = categoryById.get(currentId);
      if (!current?.parentId) break;
      depth += 1;
      currentId = current.parentId;
    }

    return depth;
  };

  const collectDescendantIds = (parentId: string, depth = 0): string[] => {
    if (depth > 5) return [];
    const directChildren = categories.filter((category) => category.parentId === parentId).map((category) => category.id);
    return [...directChildren, ...directChildren.flatMap((childId) => collectDescendantIds(childId, depth + 1))];
  };

  const activeFilters: Array<{ key: string; label: string; clear: () => void }> = [];

  const categoryChips = [...queryState.categories]
    .sort((a, b) => getDepth(a) - getDepth(b))
    .map((categoryId) => {
      const category = categoryById.get(categoryId);
      const hasChildren = categories.some((item) => item.parentId === categoryId);

      return {
        key: `category-${categoryId}`,
        label: hasChildren ? `${category?.name || categoryId} (includes children)` : category?.name || categoryId,
        clear: () => {
          const descendants = collectDescendantIds(categoryId);
          const removalSet = new Set([categoryId, ...descendants]);
          const next = queryState.categories.filter((id) => !removalSet.has(id));
          void setQueryState({ categories: next.length > 0 ? next : null, limit: 12 });
        },
      };
    });

  activeFilters.push(...categoryChips);

  if (queryState.occasion) {
    activeFilters.push({ key: "occasion", label: `Occasion: ${queryState.occasion}`, clear: () => void setQueryState({ occasion: null, limit: 12 }) });
  }

  if (queryState.mood) {
    activeFilters.push({ key: "mood", label: `Mood: ${queryState.mood}`, clear: () => void setQueryState({ mood: null, limit: 12 }) });
  }

  if (queryState.in_stock) {
    activeFilters.push({ key: "in_stock", label: "In Stock", clear: () => void setQueryState({ in_stock: null, limit: 12 }) });
  }

  if (queryState.price_min !== null || queryState.price_max !== null) {
    const min = queryState.price_min ?? 0;
    const max = queryState.price_max ?? 50000;
    activeFilters.push({
      key: "price",
      label: `Price: LKR ${min.toLocaleString()} - ${max.toLocaleString()}`,
      clear: () => void setQueryState({ price_min: null, price_max: null, limit: 12 }),
    });
  }

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-border bg-white p-3">
        <p className="text-sm text-[#6B5A64]">
          Showing <span className="font-semibold text-[#1F1720]">{visibleCount}</span> of <span className="font-semibold text-[#1F1720]">{totalCount}</span> results
        </p>

        <div className="flex items-center gap-2">
          <Select
            value={queryState.sort}
            onValueChange={(value) =>
              void setQueryState({
                sort: value as "newest" | "price-asc" | "price-desc" | "name-asc",
                limit: 12,
              })
            }
          >
            <SelectTrigger className="h-9 w-[160px] border-brand-border">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A-Z</SelectItem>
            </SelectContent>
          </Select>

          <div className="hidden items-center gap-1 rounded-lg border border-brand-border bg-white p-1 sm:flex">
            <Button
              type="button"
              size="icon"
              variant={queryState.view === "grid" ? "default" : "ghost"}
              className={queryState.view === "grid" ? "h-7 w-7 bg-[#315243] hover:bg-[#1A3026]" : "h-7 w-7 text-[#6B5A64]"}
              onClick={() => void setQueryState({ view: "grid" })}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={queryState.view === "list" ? "default" : "ghost"}
              className={queryState.view === "list" ? "h-7 w-7 bg-[#315243] hover:bg-[#1A3026]" : "h-7 w-7 text-[#6B5A64]"}
              onClick={() => void setQueryState({ view: "list" })}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              className="inline-flex items-center gap-1 rounded-full border border-[#D1E2DB] bg-[#FDF9E8] px-3 py-1 text-xs font-semibold text-[#315243]"
            >
              <span>{chip.label}</span>
              <X className="h-3 w-3" />
            </button>
          ))}
          <Button
            type="button"
            variant="ghost"
            className="h-7 rounded-full px-3 text-xs font-semibold text-[#315243] hover:bg-[#FDF9E8]"
            onClick={() =>
              void setQueryState({
                categories: null,
                occasion: null,
                mood: null,
                price_min: null,
                price_max: null,
                in_stock: null,
                limit: 12,
              })
            }
          >
            Clear All
          </Button>
        </div>
      ) : null}
    </div>
  );
}
