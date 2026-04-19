import { Header, Footer, Hero, ProductCard, PremiumBoxCard, CategoryCard, OccasionCard, CartDrawer, SectionHeading, CategoryGridSkeleton, OccasionGridSkeleton, SectionSkeleton, PromoBanner } from "@/components/giftbox";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { getFeaturedProducts } from "@/data";
import { Sparkles, Truck, Shield, Clock, CreditCard } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Suspense } from "react";
import { Prisma } from "@prisma/client";

const storefrontHasImageWhere: Prisma.ProductWhereInput = {
  NOT: {
    productImages: {
      equals: [],
    },
  },
};

const now = new Date();
const activeDiscountWhere = {
  isActive: true,
  AND: [
    {
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
    },
    {
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
  ],
};

const activeOrNoDiscountWhere = {
  OR: [{ discountId: null }, { discount: { is: activeDiscountWhere } }],
};

type DiscountView = {
  id: string;
  name: string;
  value: number;
  type: "PERCENTAGE" | "FIXED";
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

type HomeProductRecord = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  salePrice?: number | null;
  showInDiscountSection?: boolean;
  stock: number;
  categoryId: string | null;
  productImages: unknown;
  discount?: DiscountView | null;
};

type PremiumBoxRecord = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  productImages: unknown;
  boxItems: Array<{
    itemId: string;
    item: {
      id: string;
      name: string;
    };
  }>;
};

function mapDbProductToCardProduct(product: HomeProductRecord) {
  const images = Array.isArray(product.productImages)
    ? product.productImages
        .map((image) => {
          if (typeof image === "string") return image;
          if (image && typeof image === "object" && "url" in image && typeof (image as { url?: unknown }).url === "string") {
            return (image as { url: string }).url;
          }
          return null;
        })
        .filter((value): value is string => Boolean(value))
    : [];

  const hasDiscount = Boolean(product.discount) && typeof product.salePrice === "number" && product.salePrice < product.price;
  const finalPrice = hasDiscount && product.salePrice !== null && product.salePrice !== undefined ? product.salePrice : product.price;

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
    shortDescription: product.description || "",
    price: finalPrice,
    originalPrice: hasDiscount ? product.price : undefined,
    images,
    categoryId: product.categoryId || "",
    occasionIds: [],
    tags: [],
    rating: 4,
    reviewCount: 0,
    inStock: product.stock > 0,
    colors: product.colors || [],
    colorImages,
    isBestSeller: product.isBestSeller || false,
    isFeatured: false,
    capacityUnits: 5,
  };
}

export default async function HomePage() {
  const t = await getTranslations("HomePage");
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartDrawer />
      
      <main className="flex-1">
        {/* 1. Hero Section */}
        <Hero />

        {/* 2. Suggested For You - Only if authenticated */}
        {session && (
          <Suspense fallback={<div className="py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto"><SectionSkeleton /></div>}>
            <SuggestedForYouSection userId={session.user?.id} />
          </Suspense>
        )}


        {/* 4. Trending Now */}
        <Suspense fallback={<div className="py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto"><SectionSkeleton /></div>}>
          <TrendingNowSection />
        </Suspense>

        {/* 5. Promotional Banner 1 */}
        <Suspense fallback={null}>
          <PromoBanner bannerKey="promo_1" />
        </Suspense>

        {/* 6. Trending Categories */}
        <Suspense fallback={<div className="py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto"><CategoryGridSkeleton /></div>}>
          <TrendingCategoriesSection />
        </Suspense>

        {/* 7. Trending Occasions */}
        <Suspense fallback={<div className="py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto"><OccasionGridSkeleton /></div>}>
          <TrendingOccasionsSection />
        </Suspense>


        {/* 9. Premium Gift Boxes */}
        <Suspense fallback={<div className="py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto"><SectionSkeleton /></div>}>
          <PremiumGiftBoxesSection />
        </Suspense>

        {/* 10. Accessories */}
        <Suspense fallback={<div className="py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto"><SectionSkeleton /></div>}>
          <AccessoriesSection />
        </Suspense>

        {/* 11. Promotional Banner 2 */}
        <Suspense fallback={null}>
          <PromoBanner bannerKey="promo_2" />
        </Suspense>

        {/* 12. Discounted Items */}
        <Suspense fallback={<div className="py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto"><SectionSkeleton /></div>}>
          <DiscountedItemsSection />
        </Suspense>

        {/* 13. Footwear */}
        <Suspense fallback={<div className="py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto"><SectionSkeleton /></div>}>
          <FootwearSection />
        </Suspense>

        {/* Trust Badges */}
        <section className="py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#F4FAF8]/30">
              <div className="w-12 h-12 rounded-full bg-[#315243]/10 flex items-center justify-center mb-3">
                <Truck className="w-6 h-6 text-[#315243]" />
              </div>
              <h3 className="font-semibold text-[#1F1720]">Island-wide Delivery</h3>
              <p className="text-sm text-[#6B5A64] mt-1">Fast delivery across Sri Lanka</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#F4FAF8]/30">
              <div className="w-12 h-12 rounded-full bg-[#315243]/10 flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-[#315243]" />
              </div>
              <h3 className="font-semibold text-[#1F1720]">Quality Guaranteed</h3>
              <p className="text-sm text-[#6B5A64] mt-1">Only premium products</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#F4FAF8]/30">
              <div className="w-12 h-12 rounded-full bg-[#315243]/10 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-[#315243]" />
              </div>
              <h3 className="font-semibold text-[#1F1720]">Same Day Delivery</h3>
              <p className="text-sm text-[#6B5A64] mt-1">Order before 2 PM in Colombo</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#F4FAF8]/30">
              <div className="w-12 h-12 rounded-full bg-[#315243]/10 flex items-center justify-center mb-3">
                <CreditCard className="w-6 h-6 text-[#315243]" />
              </div>
              <h3 className="font-semibold text-[#1F1720]">Secure Payment</h3>
              <p className="text-sm text-[#6B5A64] mt-1">Multiple payment options</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// ========== Async Components for Data-Heavy Sections ==========

async function SuggestedForYouSection({ userId }: { userId?: string }) {
  const t = await getTranslations("HomePage");
  if (!userId) return null;

  // Fetch actual products from the database for recommendations
  const suggestedProducts = await (db.product as any).findMany({
    where: { isActive: true, ...activeOrNoDiscountWhere, ...storefrontHasImageWhere },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      salePrice: true,
      showInDiscountSection: true,
      stock: true,
      categoryId: true,
      productImages: true,
      colors: true,
      discount: true,
    },
  });

  if (suggestedProducts.length === 0) return null;

  return (
    <section className="py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto">
      <SectionHeading
        title="Suggested For You"
        subtitle="Personalized recommendations based on your interests"
        showViewAll
        viewAllLink="/categories"
      />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        {suggestedProducts.map((product: HomeProductRecord) => (
          <ProductCard key={product.id} product={mapDbProductToCardProduct(product)} />
        ))}
      </div>
    </section>
  );
}


async function TrendingNowSection() {
  const t = await getTranslations("HomePage");
  const trendingProducts = await (db.product as any).findMany({
    where: { isActive: true, isTrending: true, ...activeOrNoDiscountWhere, ...storefrontHasImageWhere },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      salePrice: true,
      showInDiscountSection: true,
      stock: true,
      categoryId: true,
      productImages: true,
      colors: true,
      discount: true,
    },
  });

  if (trendingProducts.length === 0) return null;

  return (
    <section className="py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto">
      <SectionHeading
        title="Trending Styles"
        subtitle="Our most popular pieces right now"
        showViewAll
        viewAllLink="/categories"
      />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        {trendingProducts.map((product) => (
          <ProductCard key={product.id} product={mapDbProductToCardProduct(product)} />
        ))}
      </div>
    </section>
  );
}

async function TrendingCategoriesSection() {
  const t = await getTranslations("HomePage");
  const trendingCategories = await db.category.findMany({
    where: { parentId: null, isActive: true, isPopular: true },
    orderBy: { name: "asc" },
    take: 5,
  });

  if (trendingCategories.length === 0) return null;

  return (
    <section className="py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto">
      <SectionHeading
        title="Trending Categories"
        subtitle="Shop by trending categories"
        showViewAll
        viewAllLink="/categories"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {trendingCategories.map((category) => (
          <CategoryCard key={category.id} category={category as any} />
        ))}
      </div>
    </section>
  );
}

async function TrendingOccasionsSection() {
  const t = await getTranslations("HomePage");
  const trendingOccasions = await db.occasion.findMany({
    where: { isActive: true, isPopular: true },
    orderBy: { name: "asc" },
    take: 5,
  });

  if (trendingOccasions.length === 0) return null;

  return (
    <section className="py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto">
      <SectionHeading
        title="Styles for Occasions"
        subtitle="Find the perfect look for every occasion"
      />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {trendingOccasions.map((occasion) => (
          <OccasionCard key={occasion.id} occasion={occasion as any} />
        ))}
      </div>
    </section>
  );
}

async function PremiumGiftBoxesSection() {
  // Compatibility-safe path: avoids fields that may not exist on stale Prisma clients.
  const giftBoxCategory = await db.category.findFirst({
    where: {
      isActive: true,
      slug: {
        contains: "gift-box",
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (!giftBoxCategory) {
    return null;
  }

  const premiumBoxes = (await (db.product as any).findMany({
    where: {
      isActive: true,
      categoryId: giftBoxCategory.id,
      ...activeOrNoDiscountWhere,
      ...storefrontHasImageWhere,
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      salePrice: true,
      stock: true,
      showInDiscountSection: true,
      productImages: true,
      colors: true,
      discount: true,
    },
  })) as Array<Omit<PremiumBoxRecord, "boxItems">>;

  const normalizedBoxes: PremiumBoxRecord[] = premiumBoxes.map((box) => ({
    ...box,
    boxItems: [],
  }));

  if (normalizedBoxes.length === 0) return null;

  return (
    <section className="py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto">
      <SectionHeading
        title="Premium Collections"
        subtitle="Our collection of exclusively curated apparel"
        showViewAll
        viewAllLink="/categories"
      />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
        {normalizedBoxes.map((box) => {
          const images = Array.isArray(box.productImages)
            ? box.productImages
                .map((image) => {
                  if (typeof image === "string") return image;
                  if (image && typeof image === "object" && "url" in image && typeof (image as { url?: unknown }).url === "string") {
                    return (image as { url: string }).url;
                  }
                  return null;
                })
                .filter((value): value is string => Boolean(value))
            : [];

          return (
            <PremiumBoxCard
              key={box.id}
              id={box.id}
              name={box.name}
              description={box.description}
              price={box.price}
              images={images}
              inStock={box.stock > 0}
              includedItems={box.boxItems.map((entry) => entry.item.name)}
            />
          );
        })}
      </div>
    </section>
  );
}
async function AccessoriesSection() {
  const products = await (db.product as any).findMany({
    where: { 
      isActive: true, 
      category: {
        slug: {
          contains: "accessories",
          mode: "insensitive",
        },
      },
      ...activeOrNoDiscountWhere, 
      ...storefrontHasImageWhere 
    },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      salePrice: true,
      stock: true,
      showInDiscountSection: true,
      categoryId: true,
      productImages: true,
      colors: true,
      discount: true,
    }
  });

  const displayProducts = products.slice(0, 5);

  return (
    <section className="py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto">
      <SectionHeading
        title="Essential Accessories"
        subtitle="Premium accessories to complete your look"
        showViewAll
        viewAllLink="/categories"
      />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        {displayProducts.length > 0 ? (
          displayProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={mapDbProductToCardProduct(product as HomeProductRecord)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-[#6B5A64]">Accessories collection coming soon</p>
          </div>
        )}
      </div>
    </section>
  );
}

async function DiscountedItemsSection() {
  const t = await getTranslations("HomePage");
  const discountedProducts = await (db.product as any).findMany({
    where: { isActive: true, showInDiscountSection: true, discount: { is: activeDiscountWhere }, ...storefrontHasImageWhere },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      salePrice: true,
      showInDiscountSection: true,
      stock: true,
      categoryId: true,
      productImages: true,
      colors: true,
      discount: true,
    },
  });

  if (discountedProducts.length === 0) return null;

  return (
    <section className="py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto bg-gradient-to-r from-green-50/30 to-transparent rounded-3xl">
      <SectionHeading
        title="Exclusive Offers"
        subtitle="Limited time discounts on selected styles"
        showViewAll
        viewAllLink="/categories"
      />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        {discountedProducts.map((product) => (
          <ProductCard key={product.id} product={mapDbProductToCardProduct(product)} />
        ))}
      </div>
    </section>
  );
}
async function FootwearSection() {
  const products = await (db.product as any).findMany({
    where: { 
      isActive: true,
      category: {
        slug: {
          contains: "shoes",
          mode: "insensitive",
        },
      },
      ...activeOrNoDiscountWhere, 
      ...storefrontHasImageWhere 
    },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      salePrice: true,
      stock: true,
      showInDiscountSection: true,
      categoryId: true,
      productImages: true,
      colors: true,
      discount: true,
    }
  });

  const displayProducts = products.slice(0, 5);

  return (
    <section className="py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto">
      <SectionHeading
        title="Footwear Collection"
        subtitle="Step out in style with our latest footwear"
        showViewAll
        viewAllLink="/categories"
      />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        {displayProducts.length > 0 ? (
          displayProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={mapDbProductToCardProduct(product as HomeProductRecord)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-[#6B5A64]">Footwear collection coming soon</p>
          </div>
        )}
      </div>
    </section>
  );
}
