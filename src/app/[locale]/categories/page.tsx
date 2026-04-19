import { Suspense } from "react";
import { Footer, Header, CartDrawer, SectionHeading } from "@/components/giftbox";
import { CategoriesFilters } from "./_components/categories-filters";
import { ProductsGrid } from "./_components/ProductsGrid";
import { ProductsGridSkeleton } from "./_components/ProductsGridSkeleton";
import { getCategoriesAndOccasions } from "./data";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    categories?: string;
    category?: string;
    occasion?: string;
    mood?: string;
    price_min?: string;
    price_max?: string;
    in_stock?: string;
    sort?: "newest" | "price-asc" | "price-desc" | "name-asc";
    view?: "grid" | "list";
    limit?: string;
    byob?: string;
  }>;
};

export default async function CategoriesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const selectedCategoryIds = query.categories
    ? query.categories.split(",").map((value) => value.trim()).filter(Boolean)
    : query.category
      ? [query.category]
      : [];
  const occasion = query.occasion;
  const mood = query.mood;
  const priceMin = query.price_min ? Number(query.price_min) : undefined;
  const priceMax = query.price_max ? Number(query.price_max) : undefined;
  const inStock = query.in_stock === "true";
  const sort = query.sort || "newest";
  const view = query.view || "grid";
  const limit = query.limit ? Number(query.limit) : 12;
  const byob = query.byob === "1";

  const { categories: categoriesData, occasions, moods } = await getCategoriesAndOccasions();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartDrawer />

      <main className="flex-1 py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto w-full">
        <SectionHeading title="Discover Products" subtitle="Curated gifting with advanced filters and instant updates" />

        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-8 mt-8">
          <CategoriesFilters
            categories={categoriesData}
            occasions={occasions}
            moods={moods}
            initialValues={{ categories: selectedCategoryIds, occasion, mood, priceMin, priceMax, inStock, sort, view, limit, byob }}
          />

          <Suspense key={`${selectedCategoryIds.join(".") || "all"}-${occasion ?? "all"}-${mood ?? "all"}-${priceMin ?? ""}-${priceMax ?? ""}-${inStock}-${sort}-${view}-${limit}-${byob}`} fallback={<ProductsGridSkeleton />}>
            <ProductsGrid
              filters={{ categories: selectedCategoryIds, occasion, mood, priceMin, priceMax, inStock, sort, view, limit, byob }}
              categoriesMeta={categoriesData}
            />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
