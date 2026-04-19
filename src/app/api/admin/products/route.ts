import { NextResponse } from "next/server";
import { db, getMoodClient } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";

const REQUIRED_FIELD_MESSAGE = "This field is required.";

const productCreateSchema = z.object({
  name: z.string().trim().min(1, REQUIRED_FIELD_MESSAGE),
  sku: z.string().trim().min(1, REQUIRED_FIELD_MESSAGE),
  description: z.string().optional(),
  price: z.coerce.number().positive(REQUIRED_FIELD_MESSAGE),
  stock: z.coerce.number().int().nonnegative(REQUIRED_FIELD_MESSAGE),
  categoryId: z.string().trim().min(1, REQUIRED_FIELD_MESSAGE),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  occasionIds: z.array(z.string().trim().min(1)).optional(),
  recipientIds: z.array(z.string().trim().min(1)).optional(),
  moodIds: z.array(z.string().trim().min(1)).min(1, REQUIRED_FIELD_MESSAGE),
  images: z.array(z.any()).optional(),
  variants: z.array(z.any()).optional(),
  isNewArrival: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  isTopRated: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  showInDiscountSection: z.boolean().optional(),
  isPremiumGiftBox: z.boolean().optional(),
  isSpecialTouch: z.boolean().optional(),
  specialTouchOrder: z.coerce.number().int().min(0).optional(),
  discountId: z.string().trim().optional().nullable(),
  giftBoxItems: z
    .array(
      z.object({
        itemId: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1).default(1),
        sortOrder: z.coerce.number().int().min(0).default(0),
      })
    )
    .optional(),
  salePrice: z.coerce.number().min(0).optional().nullable(),
});

function revalidateHomePaths() {
  revalidatePath("/");
  for (const locale of locales) {
    revalidatePath(`/${locale}`);
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !["SUPER_ADMIN", "STOREFRONT_ADMIN", "ADMIN"].includes(session.user.role as string)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const moodClient = getMoodClient();
    const { searchParams } = new URL(req.url);
    const mood = searchParams.get("mood")?.trim();
    const q = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const occasion = searchParams.get("occasion")?.trim() || "";
    const pageRaw = Number(searchParams.get("page"));
    const pageSizeRaw = Number(searchParams.get("pageSize"));
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
    const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw >= 20 && pageSizeRaw <= 50 ? Math.floor(pageSizeRaw) : 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (mood && moodClient) {
      where.moods = {
        some: {
          mood: {
            slug: mood,
          },
        },
      };
    }

    if (category) {
      where.categoryId = category;
    }

    if (occasion) {
      where.occasions = {
        some: {
          id: occasion,
        },
      };
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { id: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
        { occasions: { some: { name: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const [products, totalCount] = await db.$transaction([
      db.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          categoryId: true,
          category: {
            select: { id: true, name: true },
          },
          occasions: {
            select: { id: true, name: true, slug: true },
          },
          sizes: true,
          colors: true,
          productImages: true,
          productVariants: true,
          isActive: true,
          createdAt: true,
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
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      items: products,
      totalCount,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    });
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !["SUPER_ADMIN", "STOREFRONT_ADMIN", "ADMIN"].includes(session.user.role as string)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const moodClient = getMoodClient();
    const body = await req.json();
    const parsed = productCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    const {
      name,
      description,
      price,
      stock,
      categoryId,
      sizes,
      colors,
      occasionIds,
      recipientIds,
      moodIds,
      images,
      variants,
      isNewArrival,
      isTrending,
      isTopRated,
      isBestSeller,
      showInDiscountSection,
      isPremiumGiftBox,
      isSpecialTouch,
      specialTouchOrder,
      giftBoxItems,
      discountId,
      salePrice,
    } = parsed.data;

    const normalizedGiftBoxItems = Array.from(
      new Map(
        (giftBoxItems ?? []).map((entry, index) => [
          entry.itemId,
          {
            itemId: entry.itemId,
            quantity: Math.max(1, Number(entry.quantity) || 1),
            sortOrder: Number.isInteger(entry.sortOrder) ? entry.sortOrder : index,
          },
        ])
      ).values()
    );

    const newProduct = await db.$transaction(
      async (tx) => {
        return tx.product.create({
          data: {
            name,
            description,
            price,
            stock,
            categoryId,
            sizes: sizes || [],
            colors: colors || [],
            occasions: {
              connect: Array.isArray(occasionIds)
                ? occasionIds.filter((id: unknown): id is string => typeof id === "string" && id.length > 0).map((id: string) => ({ id }))
                : [],
            },
            recipients: {
              connect: Array.isArray(recipientIds)
                ? recipientIds.filter((id: unknown): id is string => typeof id === "string" && id.length > 0).map((id: string) => ({ id }))
                : [],
            },
            ...(moodClient
              ? {
                  moods: {
                    create: Array.isArray(moodIds)
                      ? moodIds
                          .filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
                          .map((id: string) => ({ mood: { connect: { id } } }))
                      : [],
                  },
                }
              : {}),
            productImages: images || [],
            productVariants: variants || [],
            isNewArrival: Boolean(isNewArrival),
            isTrending: Boolean(isTrending),
            isTopRated: Boolean(isTopRated),
            isBestSeller: Boolean(isBestSeller),
            showInDiscountSection: Boolean(showInDiscountSection),
            isPremiumGiftBox: Boolean(isPremiumGiftBox),
            isSpecialTouch: Boolean(isSpecialTouch),
            specialTouchOrder: Number.isFinite(specialTouchOrder) ? Number(specialTouchOrder) : 0,
            discountId: discountId || null,
            salePrice: salePrice ?? null,
            boxItems: normalizedGiftBoxItems.length
              ? {
                  create: normalizedGiftBoxItems.map((entry, index) => ({
                    item: { connect: { id: entry.itemId } },
                    quantity: entry.quantity,
                    sortOrder: entry.sortOrder ?? index,
                  })),
                }
              : undefined,
          },
          include: {
            category: true,
            occasions: {
              select: { id: true, name: true, slug: true },
            },
            discount: true,
            boxItems: {
              include: {
                item: {
                  select: {
                    id: true,
                    name: true,
                    categoryId: true,
                  },
                },
              },
              orderBy: [{ sortOrder: "asc" }, { itemId: "asc" }],
            },
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
        });
      },
      {
        maxWait: 5000,
        timeout: 15000,
      }
    );

    revalidateHomePaths();

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
