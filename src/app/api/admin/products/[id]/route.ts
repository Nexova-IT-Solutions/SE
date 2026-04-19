import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db, getMoodClient } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";

const productUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  categoryId: z.string().trim().optional().nullable(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  occasionIds: z.array(z.string().trim().min(1)).optional(),
  recipientIds: z.array(z.string().trim().min(1)).optional(),
  moodIds: z.array(z.string().trim().min(1)).optional(),
  images: z.array(z.any()).optional(),
  variants: z.array(z.any()).optional(),
  isActive: z.boolean().optional(),
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
  revalidatePath("/products/[id]");
  revalidatePath("/product/[slug]");
  for (const locale of locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/products/[id]`);
    revalidatePath(`/${locale}/product/[slug]`);
  }
}

type RouteProps = {
  params: Promise<{ id: string }>;
};

async function authorize() {
  const session = await getServerSession(authOptions);
  if (!session || !["SUPER_ADMIN", "STOREFRONT_ADMIN", "ADMIN"].includes(session.user.role as string)) {
    return false;
  }
  return true;
}

export async function PATCH(req: Request, props: RouteProps) {
  const { id } = await props.params;

  if (!(await authorize())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const moodClient = getMoodClient();
    const body = await req.json();
    const parsed = productUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    const data = parsed.data;
    const normalizedGiftBoxItems = Array.from(
      new Map(
        (data.giftBoxItems ?? [])
          .filter((entry) => entry.itemId !== id)
          .map((entry, index) => [
            entry.itemId,
            {
              itemId: entry.itemId,
              quantity: Math.max(1, Number(entry.quantity) || 1),
              sortOrder: Number.isInteger(entry.sortOrder) ? entry.sortOrder : index,
            },
          ])
      ).values()
    );

    const updated = await db.$transaction(async (tx) => {
      const productRecord = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          stock: data.stock,
          categoryId: data.categoryId,
          sizes: data.sizes,
          colors: data.colors,
          occasions: data.occasionIds
            ? {
                set: data.occasionIds.map((occasionId) => ({ id: occasionId })),
              }
            : undefined,
          recipients: data.recipientIds
            ? {
                set: data.recipientIds.map((recipientId) => ({ id: recipientId })),
              }
            : undefined,
          ...(moodClient
            ? {
                moods: data.moodIds
                  ? {
                      deleteMany: {},
                      create: data.moodIds.map((moodId) => ({ mood: { connect: { id: moodId } } })),
                    }
                  : undefined,
              }
            : {}),
          productImages: data.images,
          productVariants: data.variants,
          isActive: data.isActive,
          isNewArrival: data.isNewArrival,
          isTrending: data.isTrending,
          isTopRated: data.isTopRated,
          isBestSeller: data.isBestSeller,
          showInDiscountSection: data.showInDiscountSection,
          isPremiumGiftBox: data.isPremiumGiftBox,
          isSpecialTouch: data.isSpecialTouch,
          specialTouchOrder: data.specialTouchOrder,
          discountId: data.discountId,
          salePrice: data.salePrice,
        },
      });

      if (data.giftBoxItems !== undefined) {
        const selectedItemIds = normalizedGiftBoxItems.map((entry) => entry.itemId);
        await (tx as any).giftBoxItem.deleteMany({
          where: {
            boxId: id,
            ...(selectedItemIds.length > 0 ? { itemId: { notIn: selectedItemIds } } : {}),
          },
        });

        if (normalizedGiftBoxItems.length > 0) {
          await (tx as any).giftBoxItem.createMany({
            data: normalizedGiftBoxItems.map((entry, index) => ({
              boxId: id,
              itemId: entry.itemId,
              quantity: entry.quantity,
              sortOrder: entry.sortOrder ?? index,
            })),
            skipDuplicates: true,
          });

          await Promise.all(
            normalizedGiftBoxItems.map((entry, index) =>
              (tx as any).giftBoxItem.update({
                where: { boxId_itemId: { boxId: id, itemId: entry.itemId } },
                data: {
                  quantity: entry.quantity,
                  sortOrder: entry.sortOrder ?? index,
                },
              })
            )
          );
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id: productRecord.id },
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
    }, {
      maxWait: 5000,
      timeout: 15000,
    });

    revalidateHomePaths();

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    console.error("Product update error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, props: RouteProps) {
  const { id } = await props.params;

  if (!(await authorize())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await db.product.delete({
      where: { id },
    });

    revalidateHomePaths();

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    console.error("Product delete error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function PUT(req: Request, props: RouteProps) {
  return PATCH(req, props);
}
