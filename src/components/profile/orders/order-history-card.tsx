import Link from "next/link";
import Image from "next/image";
import { Banknote, CreditCard, LocateFixed, PackageCheck, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/profile/orders/order-status-badge";
import { getOrderCategory, type OrderCategoryKey } from "@/lib/orders/categorize-orders";

export type OrderHistoryCardOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  total: number;
  items: Array<{
    id: string;
    productName: string;
    productImage: string | null;
    quantity: number;
  }>;
  _count: { items: number };
};

type OrderHistoryCardProps = {
  locale: string;
  order: OrderHistoryCardOrder;
  context?: OrderCategoryKey | "all";
};

export function OrderHistoryCard({ locale, order, context = "all" }: OrderHistoryCardProps) {
  const paymentMethod = order.paymentMethod?.toUpperCase() || "COD";
  const paymentIcon = paymentMethod === "COD" ? Banknote : CreditCard;
  const PaymentIcon = paymentIcon;
  const orderCategory = context === "all" ? getOrderCategory(order) : context;
  const visibleItems = order.items.slice(0, 2);
  const hiddenCount = Math.max(order._count.items - visibleItems.length, 0);

  return (
    <Card className="rounded-2xl border border-gray-100 shadow-sm">
      <CardHeader className="space-y-3 border-b border-gray-100 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">Order #</p>
            <p className="font-mono text-sm font-semibold text-gray-900">{order.orderNumber}</p>
          </div>
          <OrderStatusBadge status={order.orderStatus} />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span>{formatDate(order.createdAt)}</span>
          <span className="h-1 w-1 rounded-full bg-gray-300" />
          <span className="inline-flex items-center gap-1.5">
            <PaymentIcon className="size-3.5" />
            {formatPaymentMethod(paymentMethod)}
          </span>
          <OrderStatusBadge type="PAYMENT" status={order.paymentStatus} className="text-[10px]" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 py-4">
        <div className="space-y-3">
          {visibleItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-gray-100">
                {item.productImage ? (
                  <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No image</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-gray-900">{item.productName}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>

        {hiddenCount > 0 ? (
          <p className="text-xs font-medium text-[#315243]">+ {hiddenCount} more items</p>
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-lg font-bold text-[#315243]">{formatCurrency(order.total)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">{renderActions(orderCategory, locale, order.id)}</div>
      </CardFooter>
    </Card>
  );
}

function renderActions(category: OrderCategoryKey, locale: string, orderId: string) {
  const viewOrderAction = (
    <Button asChild variant="outline" className="border-gray-300">
      <Link href={`/${locale}/profile/orders/${orderId}`}>View Order</Link>
    </Button>
  );

  if (category === "toPay") {
    return (
      <>
        {viewOrderAction}
        <Button asChild className="bg-[#315243] hover:bg-[#1A3026]">
          <Link href={`/${locale}/checkout/${orderId}/pay`}>Pay Now</Link>
        </Button>
      </>
    );
  }

  if (category === "toShip") {
    return (
      <>
        {viewOrderAction}
        <Button variant="outline" className="border-gray-300">
          Cancel Order
        </Button>
      </>
    );
  }

  if (category === "toReceive") {
    return (
      <>
        {viewOrderAction}
        <Button asChild className="bg-[#315243] hover:bg-[#1A3026]">
          <Link href={`/${locale}/profile/orders/${orderId}`}>
            <LocateFixed className="mr-1.5 size-4" />
            Track
          </Link>
        </Button>
        <Button variant="outline" className="border-gray-300">
          <PackageCheck className="mr-1.5 size-4" />
          Order Received
        </Button>
      </>
    );
  }

  if (category === "toReview") {
    return (
      <>
        {viewOrderAction}
        <Button className="bg-[#315243] hover:bg-[#1A3026]">
          <Star className="mr-1.5 size-4" />
          Write a Review
        </Button>
      </>
    );
  }

  return viewOrderAction;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatPaymentMethod(value: string) {
  if (value === "COD") return "Cash on Delivery";
  if (value === "DIRECTPAY") return "DirectPay";
  if (value === "MINTPAY") return "MintPay";
  return value;
}
