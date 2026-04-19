import { Prisma } from "@prisma/client";

export const ADMIN_ORDER_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "PACKED", label: "Packed" },
  { value: "READY_TO_SHIP", label: "Ready To Ship" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
] as const;

export const ADMIN_PAYMENT_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
] as const;

export const ADMIN_ORDERS_PAGE_SIZE = 10;

export function buildAdminOrderWhere({
  q,
  status,
  payment,
}: {
  q?: string;
  status?: string;
  payment?: string;
}): Prisma.OrderWhereInput {
  const trimmedQuery = q?.trim();

  return {
    ...(trimmedQuery
      ? {
          OR: [
            { orderNumber: { contains: trimmedQuery, mode: "insensitive" } },
            { customerName: { contains: trimmedQuery, mode: "insensitive" } },
            { customerEmail: { contains: trimmedQuery, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status ? { orderStatus: status as any } : {}),
    ...(payment ? { paymentStatus: payment as any } : {}),
  };
}

export function formatOrderStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(amount);
}