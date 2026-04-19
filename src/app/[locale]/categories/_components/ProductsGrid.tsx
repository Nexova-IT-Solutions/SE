import { ProductCard } from "@/components/giftbox/ProductCard";
import { getFilteredProducts, type CategoriesFilters } from "../data";
import { ProductsTopBar } from "./ProductsTopBar";
import { LoadMoreButton } from "./LoadMoreButton";

type CategoryMeta = {
  id: string;
  name: string;
  parentId?: string | null;
};

type ProductImage = {
  url: string;
  isMain: boolean;
};

function parseProductImages(value: unknown): ProductImage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const image = item as { url?: unknown; isMain?: unknown };
      if (typeof image.url !== "string" || !image.url) return null;
      return { url: image.url, isMain: typeof image.isMain === "boolean" ? image.isMain : false };
    })
    .filter((item): item is ProductImage => Boolean(item));
}

export async function ProductsGrid({ filters, categoriesMeta }: { filters: CategoriesFilters; categoriesMeta: CategoryMeta[] }) {
  const result = await getFilteredProducts(
    filters.categories,
    filters.occasion,
    filters.mood,
    filters.priceMin,
    filters.priceMax,
    filters.inStock,
    filters.sort,
    filters.limit
  );

  const products = result.items.map((product) => {
    const resultImages = parseProductImages(product.productImages);
    const mainImage = resultImages.find((image) => image.isMain)?.url || resultImages[0]?.url || "/logo/logo.png";
    const allImageUrls = resultImages.map(img => img.url);

    const hasDiscount = Boolean(product.discount && typeof product.salePrice === "number" && product.salePrice < product.price);

    const colorImages: Record<string, string> = {};
    if (Array.isArray(product.productImages)) {
      product.productImages.forEach((image: any) => {
        if (image && typeof image === "object" && image.url && image.color) {
          colorImages[image.color.toLowerCase()] = image.url;
        }
      });
    }

    return {
      id: product.id,
      name: product.name,
      slug: product.name.toLowerCase().replace(/\s+/g, "-"),
      description: product.description || "",
      shortDescription: product.description || product.category?.name || "Curated gifting product",
      price: hasDiscount && product.salePrice ? product.salePrice : product.price,
      originalPrice: hasDiscount ? product.price : undefined,
      salePrice: product.salePrice ?? undefined,
      images: allImageUrls.length > 0 ? allImageUrls : [mainImage],
      categoryId: product.category?.id || "",
      occasionIds: product.occasions.map((occasion) => occasion.id),
      tags: [],
      inStock: product.stock > 0,
      isNewArrival: Boolean(product.isNewArrival),
      isTrending: Boolean(product.isTrending),
      rating: undefined,
      reviewCount: undefined,
      colors: product.colors || [],
      colorImages,
      capacityUnits: 1,
    };
  });

  const limit = filters.limit || 12;
  const hasMore = result.total > products.length;
  const isListView = (filters.view || "grid") === "list";
  const ctaMode = filters.byob ? "byob" : "default";

  return (
    <section className="relative min-h-[420px]">
      <ProductsTopBar totalCount={result.total} visibleCount={products.length} categories={categoriesMeta} />

      {products.length === 0 ? (
        <div className="bg-white border border-brand-border rounded-2xl p-10 text-center text-[#6B5A64]">
          No products found for the selected filters.
        </div>
      ) : (
        <>
          <div className={isListView ? "grid grid-cols-1 gap-4" : "grid grid-cols-2 lg:grid-cols-3 gap-6"}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product as any}
                variant={isListView ? "horizontal" : "default"}
                ctaMode={ctaMode}
              />
            ))}
          </div>
          {hasMore ? <LoadMoreButton currentLimit={limit} /> : null}
        </>
      )}
    </section>
  );
}
