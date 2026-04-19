import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  FileText,
  Gift,
  Mail,
  MapPin,
  PackageSearch,
  Phone,
  ReceiptText,
  UserRound,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { formatCurrency } from "@/lib/admin-orders";
import { cn } from "@/lib/utils";
import { OrderManagementPanel } from "../order-management-panel";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function AdminOrderDetailsPage({ params }: PageProps) {
  const { locale, id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !["SUPER_ADMIN", "ADMIN", "STOREFRONT_ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          note: true,
          changedByUserId: true,
          changedByName: true,
          createdAt: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const customerOrderCount = await db.order.count({
    where: { customerEmail: order.customerEmail },
  });

  const address = order.shippingAddress as any;
  const formattedAddress = [
    address?.addressLine1,
    address?.addressLine2,
    address?.city,
    address?.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
  const formatDate = (value: Date) =>
    new Intl.DateTimeFormat("en-LK", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(value);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8 lg:px-10">
        <Link href={`/${locale}/admin/orders`} className="mb-6 inline-flex items-center gap-2 text-sm text-[#6B5A64] hover:text-[#315243]">
          <ArrowLeft className="size-4" />
          Back to Orders
        </Link>

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1F1720]">Order Details</h1>
            <p className="mt-1 text-sm text-[#6B5A64]">Order Number: <span className="font-mono font-semibold text-[#1F1720]">{order.orderNumber}</span></p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {order.isGift ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                <Gift className="size-3.5" />
                Gift Order
              </span>
            ) : null}
            <OrderStatusBadge status={order.orderStatus} type="ORDER" />
            <OrderStatusBadge status={order.paymentStatus} type="PAYMENT" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="rounded-2xl border border-brand-border bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-[#1F1720]">Financial Breakdown</CardTitle>
                <span className="rounded-full bg-[#FDF9E8] px-3 py-1 text-xs font-semibold text-[#315243]">Operational Overview</span>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatBox label="Subtotal" value={formatCurrency(order.subtotal)} />
                <StatBox label="Discount Savings" value={formatCurrency(getDiscountSavings(order.items))} />
                <StatBox label="Delivery Fee" value={order.deliveryFee === 0 ? "FREE" : formatCurrency(order.deliveryFee)} />
                <StatBox label="Final Total" value={formatCurrency(order.total)} emphasized />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-brand-border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#1F1720]">Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-slate-100">
                              {item.productImage ? (
                                <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No image</div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium text-[#1F1720]">{item.productName}</p>
                              <p className="text-xs text-[#6B5A64]">Line item</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[#6B5A64]">{item.quantity}</TableCell>
                        <TableCell className="font-mono text-xs text-[#6B5A64]">{item.productId || "-"}</TableCell>
                        <TableCell className="text-[#6B5A64]">{formatCurrency(item.salePrice || item.unitPrice)}</TableCell>
                        <TableCell className="text-[#6B5A64]">
                          {item.discountName ? (
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium text-emerald-700">{item.discountName}</p>
                              <p className="text-xs text-emerald-700">{item.discountValue ? `${item.discountValue}%` : "Applied"}</p>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-[#1F1720]">{formatCurrency(item.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-brand-border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#1F1720]">Delivery & Customer</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <InfoBlock icon={MapPin} label="Shipping Address" value={formattedAddress || "-"} />
                <InfoBlock icon={Phone} label="Contact Phone" value={order.customerPhone} />
                <InfoBlock icon={ReceiptText} label="Customer Name" value={order.customerName} />
                <InfoBlock icon={Mail} label="Customer Email" value={order.customerEmail || "-"} />
              </CardContent>
            </Card>

            {order.isGift ? (
              <Card className="rounded-2xl border border-brand-border bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#1F1720]">Gift Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-700">Handwritten Note</p>
                    <p className="text-sm italic text-[#6B5A64]">{order.giftMessage || "-"}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoBlock icon={Gift} label="Sender" value={`${order.senderName || "-"} (${order.senderPhone || "-"})`} />
                    <InfoBlock icon={Gift} label="Recipient" value={`${order.recipientName || "-"} (${order.recipientPhone || "-"})`} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoBlock icon={Gift} label="Wrapping" value={order.giftWrapName ? `${order.giftWrapName} (${formatCurrency(order.giftWrapPrice || 0)})` : "No wrapping selected"} />
                    <InfoBlock icon={ReceiptText} label="Invoice Preference" value={order.suppressInvoice ? "Do not include invoice" : "Include invoice"} />
                  </div>

                  <InfoBlock icon={Gift} label="Sender Reveal" value={order.revealSender ? "Visible to recipient" : "Anonymous sender"} />

                  {order.suppressInvoice ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                      DO NOT INCLUDE PRICE INVOICE
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <Card className="rounded-2xl border border-brand-border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1F1720]">
                  <FileText className="size-4 text-[#315243]" />
                  Status Audit Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative ml-3 border-l-2 border-slate-200 pl-6">
                  <div className="space-y-6">
                    {order.statusHistory.length > 0 ? (
                      order.statusHistory.map((entry) => (
                        <div key={entry.id} className="relative">
                          <span className="absolute -left-[35px] top-0 inline-flex size-5 items-center justify-center rounded-full bg-white">
                            <span className="size-3 rounded-full bg-[#315243]" />
                          </span>
                          <div className="space-y-1 pb-1">
                            <p className="text-sm font-semibold text-[#1F1720]">Order marked as {entry.status.replaceAll("_", " ")}</p>
                            <p className="text-xs text-[#6B5A64]">
                              {formatDate(entry.createdAt)}
                              {entry.changedByName ? ` by ${entry.changedByName}` : ""}
                              {entry.changedByUserId ? ` (${entry.changedByUserId})` : ""}
                            </p>
                            {entry.note ? <p className="text-sm text-[#6B5A64]">{entry.note}</p> : null}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        No audit log entries yet.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <OrderManagementPanel
              order={{
                id: order.id,
                orderStatus: order.orderStatus,
                paymentStatus: order.paymentStatus,
                internalNotes: order.internalNotes,
                customerName: order.customerName,
                customerEmail: order.customerEmail,
                customerPhone: order.customerPhone,
                userId: order.userId,
                total: order.total,
                subtotal: order.subtotal,
                deliveryFee: order.deliveryFee,
                giftWrapPrice: order.giftWrapPrice,
                giftWrapName: order.giftWrapName,
                suppressInvoice: order.suppressInvoice,
                isGift: order.isGift,
              }}
              customerOrderCount={customerOrderCount}
              customerProfileUrl={`/${locale}/admin/users/${order.userId}`}
            />

            <Card className="rounded-2xl border border-brand-border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#1F1720]">Customer Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InsightRow icon={UserRound} label="Customer" value={order.user?.name || order.customerName} href={`/${locale}/admin/users/${order.userId}`} />
                <InsightRow icon={Mail} label="Email" value={order.customerEmail || "-"} />
                <InsightRow icon={Phone} label="Phone" value={order.customerPhone || "-"} />
                <InsightRow icon={PackageSearch} label="Repeat Customer" value={customerOrderCount > 1 ? "Yes" : "No"} />
                <InsightRow icon={Clock3} label="Customer Since" value={order.user?.createdAt ? formatDate(order.user.createdAt) : formatDate(order.createdAt)} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-border bg-slate-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1F1720]">
        <Icon className="size-4 text-[#315243]" />
        {label}
      </div>
      <p className="text-sm text-[#6B5A64]">{value}</p>
    </div>
  );
}

function StatBox({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border p-4", emphasized ? "border-[#315243]/20 bg-[#FDF9E8]" : "border-slate-200 bg-slate-50")}>
      <p className="text-xs uppercase tracking-wide text-[#6B5A64]">{label}</p>
      <p className={cn("mt-2 text-lg font-bold", emphasized ? "text-[#315243]" : "text-[#1F1720]")}>{value}</p>
    </div>
  );
}

function InsightRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-slate-50 p-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-[#315243]" />
        <span className="text-[#6B5A64]">{label}</span>
      </div>
      <span className="max-w-[55%] truncate font-semibold text-[#1F1720]">{value}</span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

function getDiscountSavings(items: Array<{ unitPrice: number; salePrice?: number | null; quantity: number }>) {
  return items.reduce((total, item) => {
    const unitPrice = item.unitPrice || 0;
    const salePrice = item.salePrice ?? unitPrice;
    const savings = Math.max(unitPrice - salePrice, 0) * item.quantity;
    return total + savings;
  }, 0);
}
