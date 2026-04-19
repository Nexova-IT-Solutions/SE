import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Gift, ReceiptText, WalletCards } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/profile/orders/order-status-badge";
import { OrderTrackingTimeline } from "@/components/profile/orders/order-tracking-timeline";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ProfileOrderDetailsPage({ params }: PageProps) {
  const { locale, id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${locale}/sign-in`);
  }

  const order = await db.order.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      items: true,
      statusHistory: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const shippingAddress = (order.shippingAddress ?? {}) as {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    postalCode?: string;
    contactName?: string;
    phoneNumber?: string;
  };

  const timelineEntries =
    order.statusHistory.length > 0
      ? order.statusHistory.map((entry) => ({
          id: entry.id,
          status: entry.status,
          note: entry.note,
          createdAt: entry.createdAt,
        }))
      : [
          {
            id: `fallback-${order.id}`,
            status: order.orderStatus,
            note: "Order placed",
            createdAt: order.createdAt,
          },
        ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href={`/${locale}/profile/orders`} className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#A7066A]">
            <ArrowLeft className="size-4" />
            Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
        </div>

        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-[#A7066A]">{formatCurrency(order.total)}</p>
          <div className="mt-2 flex items-center justify-end gap-2">
            <OrderStatusBadge status={order.orderStatus} />
            <OrderStatusBadge type="PAYMENT" status={order.paymentStatus} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Order Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTrackingTimeline
                statusHistory={timelineEntries}
                currentStatus={order.orderStatus}
                orderCreatedAt={order.createdAt}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-gray-100">
                    {item.productImage ? (
                      <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No image</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-gray-900">{item.productName}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.subtotal)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <WalletCards className="size-4 text-[#A7066A]" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryRow label="Payment Method" value={formatPaymentMethod(order.paymentMethod)} />
              <SummaryRow label="Payment Status" value={order.paymentStatus.replaceAll("_", " ")} />
              <SummaryRow label="Subtotal" value={formatCurrency(order.subtotal)} />
              <SummaryRow label="Delivery" value={order.deliveryFee === 0 ? "FREE" : formatCurrency(order.deliveryFee)} />
              <SummaryRow label="Gift Wrapping" value={order.giftWrapPrice && order.giftWrapPrice > 0 ? formatCurrency(order.giftWrapPrice) : "Not selected"} />
              <div className="border-t border-gray-100 pt-3">
                <SummaryRow label="Total" value={formatCurrency(order.total)} emphasized />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <ReceiptText className="size-4 text-[#A7066A]" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-600">
              {order.isGift ? (
                <Badge className="inline-flex items-center gap-1 rounded-full bg-pink-100 text-pink-700 hover:bg-pink-100">
                  <Gift className="size-3.5" />
                  Gift Order
                </Badge>
              ) : null}

              <InfoRow label="Recipient" value={order.recipientName || shippingAddress.contactName || order.customerName} />
              <InfoRow label="Phone" value={order.recipientPhone || shippingAddress.phoneNumber || order.customerPhone} />
              <InfoRow
                label="Address"
                value={[
                  shippingAddress.addressLine1,
                  shippingAddress.addressLine2,
                  shippingAddress.city,
                  shippingAddress.postalCode,
                ]
                  .filter(Boolean)
                  .join(", ") || "-"}
              />

              {order.isGift ? (
                <>
                  <InfoRow label="Sender" value={order.senderName || "-"} />
                  <InfoRow label="Sender Phone" value={order.senderPhone || "-"} />
                  <InfoRow label="Gift Wrapping" value={order.giftWrapName || "Not selected"} />
                  {order.giftMessage ? (
                    <div className="rounded-xl border border-gray-100 bg-pink-50/50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-pink-700">Gift Message</p>
                      <p className="mt-1 text-sm text-gray-700">{order.giftMessage}</p>
                    </div>
                  ) : null}
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPaymentMethod(value: string) {
  if (value === "COD") return "Cash on Delivery";
  if (value === "DIRECTPAY") return "DirectPay";
  if (value === "MINTPAY") return "MintPay";
  return value;
}

function SummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className={emphasized ? "text-base font-bold text-[#A7066A]" : "font-medium text-gray-900"}>{value}</span>
    </div>
  );
}
