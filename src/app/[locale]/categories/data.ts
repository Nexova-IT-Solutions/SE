import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { db, getMoodClient } from "@/lib/db";

export type CategoriesFilters = {
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

export const getCategoriesAndOccasions = unstable_cache(
  async () => {
    const moodClient = getMoodClient();

    const [categories, occasions, moods] = await Promise.all([
      db.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, parentId: true },
        orderBy: { name: "asc" },
      }),
      db.occasion.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      }),
      moodClient
        ? moodClient.findMany({
            where: { isActive: true },
            select: { id: true, name: true, slug: true, icon: true },
            orderBy: { name: "asc" },
          })
        : Promise.resolve([]),
    ]);

    return { categories, occasions, moods };
  },
  ["categories-facets"],
  { revalidate: 300 }
);

export const getFilteredProducts = unstable_cache(
  async (
    categories: string[] = [],
    occasion?: string,
    mood?: string,
    priceMin?: number,
    priceMax?: number,
    inStock?: boolean,
    sort: CategoriesFilters["sort"] = "newest",
    limit = 12
  ) => {
    const moodClient = getMoodClient();
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
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      NOT: {
        productImages: {
          equals: [],
        },
      },
    };
    (where as any).OR = [{ discountId: null }, { discount: { is: activeDiscountWhere } }];

    if (categories.length > 0) {
      const categoryTree = await db.category.findMany({
        where: { isActive: true },
        select: { id: true, parentId: true },
      });

      const collectDescendantIds = (selectedId: string, depth = 0): string[] => {
        if (depth > 5) return [];

        const directChildren = categoryTree
          .filter((category) => category.parentId === selectedId)
          .map((category) => category.id);

        const nested = directChildren.flatMap((childId) => collectDescendantIds(childId, depth + 1));
        return [selectedId, ...directChildren, ...nested];
      };

      const allCategoryIds = categories.flatMap((categoryId) => collectDescendantIds(categoryId));
      const uniqueIds = [...new Set(allCategoryIds)];

      where.categoryId = { in: uniqueIds };
    }

    if (occasion) {
      where.occasions = { some: { slug: occasion } };
    }

    if (mood && moodClient) {
      (where as any).moods = {
        some: {
          mood: {
            slug: mood,
          },
        },
      };
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {
        ...(priceMin !== undefined ? { gte: priceMin } : {}),
        ...(priceMax !== undefined ? { lte: priceMax } : {}),
      };
    }

    if (inStock) {
      where.stock = { gt: 0 };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "price-asc"
        ? { price: "asc" }
        : sort === "price-desc"
          ? { price: "desc" }
          : sort === "name-asc"
            ? { name: "asc" }
            : { createdAt: "desc" };

    const [total, items] = await db.$transaction([
      db.product.count({ where }),
      db.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          salePrice: true,
          showInDiscountSection: true,
          isNewArrival: true,
          isTrending: true,
          stock: true,
          productImages: true,
          colors: true,
          discount: true,
          category: { select: { id: true, name: true } },
          occasions: { select: { id: true, name: true, slug: true } },
          ...(moodClient
            ? {
                moods: {
                  select: {
                    mood: {
                      select: { id: true, name: true, slug: true, icon: true },
                    },
                  },
                },
              }
            : {}),
        },
        orderBy,
        take: limit,
      }),
    ]);

    return { total, items };
  },
  ["categories-products"],
  { revalidate: 60 }
);
