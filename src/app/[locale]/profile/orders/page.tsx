import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { CustomerOrdersClient } from "@/components/profile/orders/customer-orders-client";

export default async function OrdersPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${locale}/sign-in`);
  }

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        select: {
          id: true,
          productName: true,
          productImage: true,
          quantity: true,
          unitPrice: true,
          salePrice: true,
          subtotal: true,
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
  });

  const serializedOrders = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    total: order.total,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      productImage: item.productImage,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      salePrice: item.salePrice,
      subtotal: item.subtotal,
    })),
    _count: {
      items: order._count.items,
    },
  }));

  return (
    <CustomerOrdersClient locale={locale} orders={serializedOrders} />
  );
}
