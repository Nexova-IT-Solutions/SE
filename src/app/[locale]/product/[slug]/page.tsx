import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer, CartDrawer } from "@/components/giftbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { ProductDetailClient } from "./product-detail-client";

const storefrontHasImageWhere: Prisma.ProductWhereInput = {
  NOT: {
    productImages: {
      equals: [],
    },
  },
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // Keep metadata query minimal so it doesn't add avoidable latency.
  const product = await db.product.findUnique({
    where: { id: slug },
    select: {
      name: true,
      description: true,
      productImages: true,
    },
  });

  if (!product) {
    return {
      title: "Product Not Found | Giftbox Lanka",
    };
  }

  const image = parseImages(product.productImages)[0]?.url;

  return {
    title: `${product.name} | Giftbox Lanka`,
    description: product.description?.slice(0, 160) || "Discover curated gifts at Giftbox Lanka.",
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160) || "Discover curated gifts at Giftbox Lanka.",
      images: image ? [image] : undefined,
    },
  };
}

type DbVariant = {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
};

type DbImage = {
  url: string;
  isMain: boolean;
  color?: string;
};

function parseImages(value: unknown): DbImage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const image = item as { url?: unknown; isMain?: unknown; color?: unknown };
      if (typeof image.url !== "string" || !image.url) return null;
      return {
        url: image.url,
        isMain: typeof image.isMain === "boolean" ? image.isMain : false,
        color: typeof image.color === "string" ? image.color : undefined,
      };
    })
    .filter((item): item is DbImage => item !== null);
}

function parseVariants(value: unknown): DbVariant[] {
  if (!Array.isArray(value)) return [];

  const parsed = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const variant = item as { size?: unknown; color?: unknown; price?: unknown; stock?: unknown };
      const size = typeof variant.size === "string" ? variant.size : "";
      const color = typeof variant.color === "string" ? variant.color : "";
      const name = [size, color].filter(Boolean).join(" / ") || "Default";
      const id = `${size || "default"}:${color || "default"}`;
      const price = Number(variant.price);
      const stock = Number(variant.stock);
      return {
        id,
        name,
        price: Number.isFinite(price) ? price : 0,
        inStock: Number.isFinite(stock) ? stock > 0 : true,
      };
    })
    .filter((item): item is DbVariant => Boolean(item));

  const uniqueById = new Map<string, DbVariant>();
  parsed.forEach((item) => {
    if (!uniqueById.has(item.id)) uniqueById.set(item.id, item);
  });
  return Array.from(uniqueById.values());
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  const product = (await (db.product as any).findFirst({
    where: {
      id: slug,
      isActive: true,
      ...storefrontHasImageWhere,
    },
    include: {
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
      occasions: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      boxItems: {
        include: {
          item: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { itemId: "asc" }],
      },
    },
  })) as
    | ({
        id: string;
        name: string;
        description: string | null;
        price: number;
        stock: number;
        sizes: string[];
        colors: string[];
        productImages: unknown;
        productVariants: unknown;
        categoryId: string | null;
        category: { name: string; slug: string } | null;
        occasions: { id: string; name: string; slug: string }[];
        boxItems: { itemId: string; quantity: number; item: { id: string; name: string } }[];
      }
    | null);

  if (!product) {
    notFound();
  }

  const images = parseImages(product.productImages);
  const variants = parseVariants(product.productVariants);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartDrawer />
      <main className="flex-1 py-10 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto w-full">
        <ProductDetailClient
          product={{
            id: product.id,
            name: product.name,
            description: product.description || "",
            price: product.price,
            stock: product.stock,
            sizes: product.sizes,
            colors: product.colors,
            images,
            variants,
            category: product.category,
            occasions: product.occasions,
            boxItems: product.boxItems.map((entry) => ({
              itemId: entry.itemId,
              itemName: entry.item.name,
              quantity: entry.quantity,
            })),
          }}
        />

        <Suspense fallback={<RelatedProductsSkeleton />}>
          <RelatedProductsSection
            currentProductId={product.id}
            categoryId={product.categoryId}
            occasionIds={product.occasions.map((occasion) => occasion.id)}
          />
        </Suspense>

        <Suspense fallback={<ReviewsSkeleton />}>
          <CustomerReviewsSection productId={product.id} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

async function RelatedProductsSection({
  currentProductId,
  categoryId,
  occasionIds,
}: {
  currentProductId: string;
  categoryId: string | null;
  occasionIds: string[];
}) {
  const related = await db.product.findMany({
    where: {
      id: { not: currentProductId },
      isActive: true,
      ...storefrontHasImageWhere,
      OR: [
        ...(categoryId ? [{ categoryId }] : []),
        ...(occasionIds.length > 0 ? [{ occasions: { some: { id: { in: occasionIds } } } }] : []),
      ],
    },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      productImages: true,
      occasions: {
        select: { id: true, name: true },
      },
    },
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  if (related.length === 0) {
    return null;
  }

  return (
    <section className="mt-14 space-y-5 border-t border-brand-border pt-10">
      <h2 className="text-2xl font-bold text-[#1F1720]">Related Products</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {related.map((item) => {
          const image = parseImages(item.productImages).find((img) => img.isMain)?.url || parseImages(item.productImages)[0]?.url || "/logo/logo.png";

          return (
            <article key={item.id} className="rounded-2xl border border-brand-border bg-white overflow-hidden hover:shadow-md transition-shadow">
              <Link href={`/products/${item.id}`}>
                <div className="relative aspect-square bg-[#FCEAF4]">
                  <Image src={image} alt={item.name} fill className="object-cover" />
                </div>
              </Link>
              <div className="p-3">
                <Link href={`/products/${item.id}`} className="line-clamp-1 text-sm font-semibold text-[#1F1720] hover:text-[#A7066A]">
                  {item.name}
                </Link>
                <p className="mt-1 text-sm font-bold text-[#A7066A]">LKR {item.price.toLocaleString()}</p>
                {item.occasions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.occasions.slice(0, 2).map((occasion) => (
                      <Badge key={occasion.id} variant="secondary" className="text-[10px] bg-[#FCEAF4] text-[#A7066A] border-0">
                        {occasion.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

async function CustomerReviewsSection({ productId }: { productId: string }) {
  // Placeholder async boundary for progressive rendering until reviews are persisted in DB.
  await Promise.resolve(productId);

  return (
    <section className="mt-12 space-y-4 border-t border-brand-border pt-10">
      <h2 className="text-2xl font-bold text-[#1F1720]">Customer Reviews</h2>
      <div className="rounded-2xl border border-brand-border bg-white p-6 text-sm text-[#6B5A64]">
        Reviews will appear here once customers submit feedback for this product.
      </div>
    </section>
  );
}

function RelatedProductsSkeleton() {
  return (
    <section className="mt-14 space-y-5 border-t border-brand-border pt-10">
      <Skeleton className="h-8 w-56 bg-[#F3EDF1]" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-brand-border bg-white overflow-hidden">
            <Skeleton className="aspect-square bg-[#F3EDF1]" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-5/6 bg-[#F3EDF1]" />
              <Skeleton className="h-4 w-1/2 bg-[#F3EDF1]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewsSkeleton() {
  return (
    <section className="mt-12 space-y-4 border-t border-brand-border pt-10">
      <Skeleton className="h-8 w-52 bg-[#F3EDF1]" />
      <div className="rounded-2xl border border-brand-border bg-white p-6 space-y-3">
        <Skeleton className="h-4 w-full bg-[#F3EDF1]" />
        <Skeleton className="h-4 w-4/5 bg-[#F3EDF1]" />
      </div>
    </section>
  );
}
