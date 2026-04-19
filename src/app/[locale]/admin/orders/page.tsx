import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildAdminOrderWhere, ADMIN_ORDERS_PAGE_SIZE } from "@/lib/admin-orders";
import { ordersSearchParamsCache } from "./search-params";
import { OrdersMetrics } from "./orders-metrics";
import { OrdersTable } from "./orders-table";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOrdersPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !["SUPER_ADMIN", "ADMIN", "STOREFRONT_ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const query = await searchParams;
  const { q, status, payment, page } = ordersSearchParamsCache.parse(query);
  const currentPage = Math.max(page, 1);
  const where = buildAdminOrderWhere({ q, status, payment });

  const [orders, totalCount, metrics] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * ADMIN_ORDERS_PAGE_SIZE,
      take: ADMIN_ORDERS_PAGE_SIZE,
      include: { _count: { select: { items: true } } },
    }),
    db.order.count({ where }),
    Promise.all([
      db.order.count(),
      db.order.count({ where: { orderStatus: "PENDING" } }),
      db.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { total: true },
      }),
      db.order.count({
        where: {
          createdAt: {
            gte: startOfToday(),
          },
        },
      }),
    ]),
  ]);

  const [totalOrders, pendingOrders, revenueAggregate, todaysOrders] = metrics;

  const normalizedOrders = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    total: order.total,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    itemsCount: order._count.items,
  }));

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 md:px-8 lg:px-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#1F1720]">Orders Management</h1>
          <p className="text-sm text-[#6B5A64]">Search, filter, and monitor order flow from one operational dashboard.</p>
        </div>

        <OrdersMetrics
          totalOrders={totalOrders}
          pendingOrders={pendingOrders}
          totalRevenue={revenueAggregate._sum.total ?? 0}
          todaysOrders={todaysOrders}
        />

        <OrdersTable locale={locale} orders={normalizedOrders} totalCount={totalCount} />
      </div>
    </div>
  );
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}
