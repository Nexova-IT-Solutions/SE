import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db, getMoodClient } from "@/lib/db";
import { ProductForm } from "../product-form";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminProductCreatePage({ params }: PageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !["SUPER_ADMIN", "STOREFRONT_ADMIN", "ADMIN"].includes(session.user.role as string)) {
    redirect("/");
  }

  const moodClient = getMoodClient();

  const [categories, occasions, recipients, moods, discounts, availableGiftItems] = await Promise.all([
    db.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    db.occasion.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    (db as any).recipient.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    moodClient
      ? moodClient.findMany({
          where: { isActive: true },
          select: { id: true, name: true, icon: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
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
    db.product.findMany({
      where: {
        isActive: true,
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
  ]);

  return (
    <div className="w-full bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10">
        <ProductForm
          locale={locale}
          mode="create"
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
