"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, SlidersHorizontal } from "lucide-react";
import { parseAsArrayOf, parseAsBoolean, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type FilterItem = { id: string; name: string; slug: string; icon?: string | null; parentId?: string | null };

type CategoriesFiltersProps = {
  categories: FilterItem[];
  occasions: FilterItem[];
  moods: FilterItem[];
  initialValues: {
    categories?: string[];
    occasion?: string;
    mood?: string;
    priceMin?: number;
    priceMax?: number;
    inStock?: boolean;
    sort?: "newest" | "price-asc" | "price-desc" | "name-asc";
    view?: "grid" | "list";
    limit?: number;
    byob?: boolean;
  };
};

const PRICE_MIN = 0;
const PRICE_MAX = 50000;

export function CategoriesFilters({ categories, occasions, moods }: CategoriesFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const [priceRange, setPriceRange] = useState<[number, number]>([
    queryState.price_min ?? PRICE_MIN,
    queryState.price_max ?? PRICE_MAX,
  ]);

  useEffect(() => {
    setPriceRange([queryState.price_min ?? PRICE_MIN, queryState.price_max ?? PRICE_MAX]);
  }, [queryState.price_min, queryState.price_max]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void setQueryState({
        price_min: priceRange[0] <= PRICE_MIN ? null : priceRange[0],
        price_max: priceRange[1] >= PRICE_MAX ? null : priceRange[1],
        limit: 12,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [priceRange, setQueryState]);

  const activeCount = useMemo(() => {
    let count = 0;
    if (queryState.categories.length > 0) count += 1;
    if (queryState.occasion) count += 1;
    if (queryState.mood) count += 1;
    if (queryState.in_stock) count += 1;
    if (queryState.price_min !== null || queryState.price_max !== null) count += 1;
    return count;
  }, [queryState]);

  const toggleCategory = (categoryId: string) => {
    const exists = queryState.categories.includes(categoryId);
    const next = exists
      ? queryState.categories.filter((id) => id !== categoryId)
      : [...queryState.categories, categoryId];

    void setQueryState({ categories: next.length > 0 ? next : null, limit: 12 });
  };

  const setOccasion = (value: string | null) => void setQueryState({ occasion: value, limit: 12 });
  const setMood = (value: string | null) => void setQueryState({ mood: value, limit: 12 });
  const setInStock = (value: boolean) => void setQueryState({ in_stock: value ? true : null, limit: 12 });

  // Build explicit tree from flat categories array.
  const rootCategories = useMemo(() => categories.filter((category) => !category.parentId), [categories]);
  const getChildren = useMemo(
    () => (parentId: string) => categories.filter((category) => category.parentId === parentId),
    [categories]
  );

  const renderFilterPanel = () => (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#6B5A64]">Categories</h3>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void setQueryState({ categories: null, limit: 12 })}
            className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
              queryState.categories.length === 0
                ? "border-[#9B854A] bg-[#FDF9E8] text-[#9B854A]"
                : "border-brand-border bg-white text-[#3A2B35] hover:border-[#9B854A]/40"
            }`}
          >
            All Categories
          </button>
          {rootCategories.map((rootCategory) => {
            const children = getChildren(rootCategory.id);
            const hasChildren = children.length > 0;
            const isRootActive = queryState.categories.includes(rootCategory.id);
            const hasActiveChild = children.some((child) => queryState.categories.includes(child.id));

            if (!hasChildren) {
              return (
                <button
                  key={rootCategory.id}
                  type="button"
                  onClick={() => toggleCategory(rootCategory.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    isRootActive
                      ? "border-[#315243] bg-[#FDF9E8] text-[#315243]"
                      : "border-brand-border bg-white text-[#3A2B35] hover:border-[#315243]/40"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input type="checkbox" readOnly checked={isRootActive} className="accent-[#9B854A]" />
                    <span>{rootCategory.name}</span>
                  </span>
                </button>
              );
            }

            return (
              <Collapsible key={rootCategory.id} defaultOpen={hasActiveChild || isRootActive}>
                <div className="rounded-lg border border-brand-border bg-white">
                  <div className="flex items-center gap-2 px-2 py-2">
                    <button
                      type="button"
                      onClick={() => toggleCategory(rootCategory.id)}
                      className={`flex-1 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                        isRootActive
                          ? "bg-[#FDF9E8] text-[#9B854A]"
                          : "text-[#3A2B35] hover:bg-[#FDF9E8]/50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input type="checkbox" readOnly checked={isRootActive} className="accent-[#9B854A]" />
                        <span>{rootCategory.name}</span>
                      </span>
                    </button>
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="rounded-md px-2 py-1 text-xs font-semibold text-[#6B5A64] hover:bg-[#FDF9E8] hover:text-[#9B854A]"
                      >
                        {children.length}
                      </button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent>
                    <div className="mx-3 mb-3 space-y-2 border-l border-[#D1E2DB] pl-4">
                      {children.map((childCategory) => {
                        const isChildActive = queryState.categories.includes(childCategory.id);

                        return (
                          <button
                            key={childCategory.id}
                            type="button"
                            onClick={() => toggleCategory(childCategory.id)}
                            className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                              isChildActive
                                ? "border-[#9B854A] bg-[#FDF9E8] text-[#9B854A]"
                                : "border-brand-border bg-white text-[#3A2B35] hover:border-[#9B854A]/40"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <input type="checkbox" readOnly checked={isChildActive} className="accent-[#315243]" />
                              <span>{childCategory.name}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </section>

      <section className="space-y-3 border-t border-brand-border pt-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#6B5A64]">Occasions</h3>
        <div className="space-y-2">
            <button
              type="button"
              onClick={() => setOccasion(null)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                !queryState.occasion
                  ? "border-[#9B854A] bg-[#FDF9E8] text-[#9B854A]"
                  : "border-brand-border bg-white text-[#3A2B35] hover:border-[#9B854A]/40"
              }`}
            >
              All Occasions
            </button>
            {occasions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setOccasion(item.slug)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  queryState.occasion === item.slug
                    ? "border-[#9B854A] bg-[#FDF9E8] text-[#9B854A]"
                    : "border-brand-border bg-white text-[#3A2B35] hover:border-[#9B854A]/40"
                }`}
              >
                {item.name}
              </button>
            ))}
        </div>
      </section>

      <section className="space-y-3 border-t border-brand-border pt-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#6B5A64]">Moods</h3>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setMood(null)}
            className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
              !queryState.mood
                ? "border-[#9B854A] bg-[#FDF9E8] text-[#9B854A]"
                : "border-brand-border bg-white text-[#3A2B35] hover:border-[#9B854A]/40"
            }`}
          >
            All Moods
          </button>
          {moods.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMood(item.slug)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                queryState.mood === item.slug
                  ? "border-[#9B854A] bg-[#FDF9E8] text-[#9B854A]"
                  : "border-brand-border bg-white text-[#3A2B35] hover:border-[#9B854A]/40"
              }`}
            >
              <span className="mr-2">{item.icon || "✨"}</span>
              {item.name}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 border-t border-brand-border pt-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#6B5A64]">Price</h3>
          <span className="text-xs text-[#6B5A64]">
            LKR {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()}
          </span>
        </div>
        <Slider
          value={priceRange}
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={250}
          onValueChange={(value) => setPriceRange([value[0] ?? PRICE_MIN, value[1] ?? PRICE_MAX])}
          className="py-2"
        />
      </section>

      <section className="space-y-3 border-t border-brand-border pt-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#6B5A64]">Availability</h3>
        <div className="flex items-center justify-between rounded-lg border border-brand-border px-3 py-2">
          <span className="text-sm text-[#1F1720]">In Stock Only</span>
          <Switch checked={Boolean(queryState.in_stock)} onCheckedChange={setInStock} />
        </div>
      </section>
    </div>
  );

  return (
    <>
      <aside className="relative hidden max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-brand-border bg-white p-5 xl:sticky xl:top-24 xl:block">
        {renderFilterPanel()}
      </aside>

      <div className="xl:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              className="fixed bottom-6 left-1/2 z-40 h-11 -translate-x-1/2 rounded-full bg-[#315243] px-5 text-white shadow-lg shadow-[#315243]/30 hover:bg-[#1A3026]"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Sort & Filter
              {activeCount > 0 ? (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-[#315243]">
                  {activeCount}
                </span>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl pb-8">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-[#1F1720]">
                <Filter className="h-4 w-4 text-[#315243]" />
                Refine Products
              </SheetTitle>
              <SheetDescription>Adjust filters and see results update instantly.</SheetDescription>
            </SheetHeader>
            <div className="px-4">{renderFilterPanel()}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
