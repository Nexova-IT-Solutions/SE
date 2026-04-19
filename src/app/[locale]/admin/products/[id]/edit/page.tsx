import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db, getMoodClient } from "@/lib/db";
import { ProductForm } from "../../product-form";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function AdminProductEditPage({ params }: PageProps) {
  const { locale, id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !["SUPER_ADMIN", "STOREFRONT_ADMIN", "ADMIN"].includes(session.user.role as string)) {
    redirect("/");
  }

  const moodClient = getMoodClient();

  const safeRead = async <T,>(operation: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await operation();
    } catch {
      return fallback;
    }
  };

  const product = await safeRead(
    () =>
      db.product.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          salePrice: true,
          discountId: true,
          stock: true,
          isNewArrival: true,
          isTrending: true,
          showInDiscountSection: true,
          isPremiumGiftBox: true,
          isSpecialTouch: true,
          specialTouchOrder: true,
          categoryId: true,
          sizes: true,
          colors: true,
          productImages: true,
          productVariants: true,
          boxItems: {
            select: {
              itemId: true,
              quantity: true,
              sortOrder: true,
              item: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: [{ sortOrder: "asc" }, { itemId: "asc" }],
          },
          occasions: {
            select: { id: true, name: true },
          },
          recipients: {
            select: { id: true, name: true, slug: true },
          },
          ...(moodClient
            ? {
                moods: {
                  select: {
                    mood: {
                      select: { id: true, name: true, icon: true },
                    },
                  },
                },
              }
            : {}),
        },
      }),
    null
  );

  const categories = await safeRead(
    () =>
      db.category.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      }),
    []
  );

  const availableGiftItems = await safeRead(
    () =>
      db.product.findMany({
        where: {
          isActive: true,
          id: { not: id },
          OR: [
            { categoryId: null },
            {
              category: {
                is: {
                  slug: {
                    not: {
                      contains: "gift-box",
                    },
                  },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          stock: true,
          price: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { name: "asc" },
      }),
    []
  );

  const occasions = await safeRead(
    () =>
      db.occasion.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    []
  );

  const recipients = await safeRead(
    () =>
      (db as any).recipient.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      }),
    []
  );

  const moods = moodClient
    ? await safeRead(
        () =>
          moodClient.findMany({
            where: { isActive: true },
            select: { id: true, name: true, icon: true },
            orderBy: { name: "asc" },
          }),
        []
      )
    : [];

  const discounts = await safeRead(
    () =>
      (db as any).discount.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          value: true,
          type: true,
          isActive: true,
          startsAt: true,
          endsAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    []
  );

  if (!product) {
    notFound();
  }

  return (
    <div className="w-full bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10">
        <ProductForm
          locale={locale}
          mode="edit"
          product={product}
          categories={categories}
          occasions={occasions}
          recipients={recipients}
          moods={moods}
          discounts={discounts}
          availableGiftItems={availableGiftItems}
        />
      </div>
    </div>
  );
}
