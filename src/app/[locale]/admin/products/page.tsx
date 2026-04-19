import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { ProductsClient } from "./products-client";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    occasion?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const category = typeof params.category === "string" ? params.category : "";
  const occasion = typeof params.occasion === "string" ? params.occasion : "";
  const pageRaw = Number(params.page);
  const pageSizeRaw = Number(params.pageSize);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw >= 20 && pageSizeRaw <= 50 ? Math.floor(pageSizeRaw) : 20;

  if (!session || !["SUPER_ADMIN", "STOREFRONT_ADMIN", "ADMIN"].includes(session.user.role as string)) {
    redirect("/"); // unauthorized
  }

  const where: any = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { id: { contains: q, mode: "insensitive" } },
      { category: { name: { contains: q, mode: "insensitive" } } },
      { occasions: { some: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  if (category) {
    where.categoryId = category;
  }

  if (occasion) {
    where.occasions = { some: { id: occasion } };
  }

  const skip = (page - 1) * pageSize;

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
          select: { id: true, name: true },
        },
        sizes: true,
        colors: true,
        productImages: true,
        productVariants: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.product.count({ where }),
  ]);

  return (
    <div className="w-full bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10">
        <ProductsClient
          initialProducts={products}
          initialPage={page}
          initialPageSize={pageSize}
          initialTotalCount={totalCount}
        />
      </div>
    </div>
  );
}
