import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db, getMoodClient } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const moodClient = getMoodClient();
    const { searchParams } = new URL(req.url);
    const now = new Date();

    const category = searchParams.get("category")?.trim();
    const occasion = searchParams.get("occasion")?.trim();
    const mood = searchParams.get("mood")?.trim();
    const q = searchParams.get("q")?.trim();
    const priceMinParam = searchParams.get("price_min");
    const priceMaxParam = searchParams.get("price_max");

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

    if (category) {
      where.categoryId = category;
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

    if (q) {
      where.name = { contains: q, mode: "insensitive" };
    }

    const priceMin = priceMinParam ? Number(priceMinParam) : undefined;
    const priceMax = priceMaxParam ? Number(priceMaxParam) : undefined;

    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {
        ...(priceMin !== undefined ? { gte: priceMin } : {}),
        ...(priceMax !== undefined ? { lte: priceMax } : {}),
      };
    }

    const products = await db.product.findMany({
      where,
      include: {
        discount: true,
        category: {
          select: { id: true, name: true, slug: true },
        },
        occasions: {
          select: { id: true, name: true, slug: true },
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
