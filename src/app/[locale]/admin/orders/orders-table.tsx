"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Loader2, MoreHorizontal, Search, SearchX, FilterX, PackageSearch } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ADMIN_ORDERS_PAGE_SIZE,
  ADMIN_ORDER_STATUS_OPTIONS,
  ADMIN_PAYMENT_STATUS_OPTIONS,
  formatCurrency,
  formatOrderStatusLabel,
} from "@/lib/admin-orders";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { useToast } from "@/hooks/use-toast";

type OrdersTableProps = {
  locale: string;
  orders: Array<{
    id: string;
    orderNumber: string;
    createdAt: string;
    customerName: string;
    customerEmail: string;
    total: number;
    orderStatus: string;
    paymentStatus: string;
    itemsCount: number;
  }>;
  totalCount: number;
};

export function OrdersTable({ locale, orders, totalCount }: OrdersTableProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [queryState, setQueryState] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      status: parseAsString.withDefault(""),
      payment: parseAsString.withDefault(""),
      page: parseAsInteger.withDefault(1),
    },
    {
      clearOnDefault: true,
      history: "replace",
      shallow: false,
    }
  );

  const [searchInput, setSearchInput] = useState(queryState.q);
  const [updating, setUpdating] = useState<{
    orderId: string;
    type: "orderStatus" | "paymentStatus";
  } | null>(null);

  const quickOrderStatuses = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "PACKED",
    "READY_TO_SHIP",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ] as const;

  const quickPaymentStatuses = ["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED"] as const;

  useEffect(() => {
    setSearchInput(queryState.q);
  }, [queryState.q]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSearch = searchInput.trim();
      if (nextSearch === queryState.q) return;

      void setQueryState({ q: nextSearch || null, page: 1 });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [queryState.q, searchInput, setQueryState]);

  const hasSearch = queryState.q.trim().length > 0;
  const hasFilters = Boolean(queryState.status || queryState.payment);
  const totalPages = Math.max(1, Math.ceil(totalCount / ADMIN_ORDERS_PAGE_SIZE));
  const currentPage = Math.min(Math.max(queryState.page, 1), totalPages);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * ADMIN_ORDERS_PAGE_SIZE + 1;
  const endItem = totalCount === 0 ? 0 : Math.min(currentPage * ADMIN_ORDERS_PAGE_SIZE, totalCount);

  const activeSummary = useMemo(() => {
    const parts: string[] = [];
    if (hasSearch) parts.push(`search: "${queryState.q}"`);
    if (queryState.status) parts.push(`status: ${queryState.status}`);
    if (queryState.payment) parts.push(`payment: ${queryState.payment}`);
    return parts.join(" • ");
  }, [hasSearch, queryState.payment, queryState.q, queryState.status]);

  const clearSearch = () => void setQueryState({ q: null, page: 1 });
  const clearFilters = () => void setQueryState({ status: null, payment: null, page: 1 });
  const clearAll = () => void setQueryState({ q: null, status: null, payment: null, page: 1 });

  const setStatus = (value: string) => void setQueryState({ status: value === "all" ? null : value, page: 1 });
  const setPayment = (value: string) => void setQueryState({ payment: value === "all" ? null : value, page: 1 });

  const handleStatusChange = async (
    orderId: string,
    type: "orderStatus" | "paymentStatus",
    newStatus: string,
    currentStatus: string
  ) => {
    if (newStatus === currentStatus) return;

    setUpdating({ orderId, type });

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [type]: newStatus }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to update order status");
      }

      toast({
        title: "Updated",
        description: `${type === "orderStatus" ? "Order" : "Payment"} status updated to ${formatOrderStatusLabel(newStatus)}.`,
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error?.message || "Could not update status",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const emptyState = (() => {
    if (totalCount > 0) return null;

    if (hasSearch) {
      return {
        icon: SearchX,
        title: `No results for “${queryState.q}”`,
        description: "Try a different order number, customer name, or email address.",
        action: <Button onClick={clearSearch}>Clear Search</Button>,
      };
    }

    if (hasFilters) {
      return {
        icon: FilterX,
        title: "No results for the selected filters",
        description: "Try a different order status or payment status.",
        action: <Button onClick={clearFilters}>Clear Filters</Button>,
      };
    }

    return {
      icon: PackageSearch,
      title: "No orders exist yet",
      description: "Orders will appear here once customers start checking out.",
      action: null,
    };
  })();

  return (
    <Card className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
      <CardContent className="space-y-5 p-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_0.9fr_0.9fr]">
          <div className="relative" suppressHydrationWarning>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by order number, customer name, or email"
              autoComplete="off"
              spellCheck={false}
              data-1p-ignore="true"
              data-lpignore="true"
              data-form-type="other"
              className="h-11 rounded-xl border-brand-border pl-10"
            />
          </div>

          <Select value={queryState.status || "all"} onValueChange={setStatus}>
            <SelectTrigger className="h-11 w-full rounded-xl border-brand-border">
              <SelectValue placeholder="Order Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Order Statuses</SelectItem>
              {ADMIN_ORDER_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={queryState.payment || "all"} onValueChange={setPayment}>
            <SelectTrigger className="h-11 w-full rounded-xl border-brand-border">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment Statuses</SelectItem>
              {ADMIN_PAYMENT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeSummary ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-brand-border bg-slate-50 px-4 py-3 text-sm text-[#6B5A64]">
            <span>{activeSummary}</span>
            <Button variant="ghost" className="h-8 rounded-full px-3 text-[#315243] hover:bg-[#FDF9E8]" onClick={clearAll}>
              Clear All
            </Button>
          </div>
        ) : null}

        {orders.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm font-semibold text-[#1F1720]">{order.orderNumber}</TableCell>
                    <TableCell className="text-[#6B5A64]">{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium text-[#1F1720]">{order.customerName}</p>
                        <p className="text-xs text-[#6B5A64]">{order.customerEmail || "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#6B5A64]">{order.itemsCount} items</TableCell>
                    <TableCell className="font-semibold text-[#1F1720]">{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            disabled={Boolean(updating && updating.orderId === order.id)}
                            className="inline-flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315243]/30 disabled:cursor-not-allowed"
                          >
                            <OrderStatusBadge status={order.paymentStatus} type="PAYMENT" className="cursor-pointer hover:opacity-90" />
                            {updating?.orderId === order.id && updating?.type === "paymentStatus" ? <Loader2 className="size-3.5 animate-spin text-[#315243]" /> : null}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 rounded-xl border-brand-border">
                          {quickPaymentStatuses.map((status) => (
                            <DropdownMenuItem
                              key={status}
                              disabled={Boolean(updating && updating.orderId === order.id)}
                              onClick={() => void handleStatusChange(order.id, "paymentStatus", status, order.paymentStatus)}
                            >
                              {formatOrderStatusLabel(status)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            disabled={Boolean(updating && updating.orderId === order.id)}
                            className="inline-flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315243]/30 disabled:cursor-not-allowed"
                          >
                            <OrderStatusBadge status={order.orderStatus} type="ORDER" className="cursor-pointer hover:opacity-90" />
                            {updating?.orderId === order.id && updating?.type === "orderStatus" ? <Loader2 className="size-3.5 animate-spin text-[#315243]" /> : null}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 rounded-xl border-brand-border">
                          {quickOrderStatuses.map((status) => (
                            <DropdownMenuItem
                              key={status}
                              disabled={Boolean(updating && updating.orderId === order.id)}
                              onClick={() => void handleStatusChange(order.id, "orderStatus", status, order.orderStatus)}
                            >
                              {formatOrderStatusLabel(status)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 rounded-full">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Open order actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl border-brand-border">
                          <DropdownMenuItem asChild>
                            <Link href={`/${locale}/admin/orders/${order.id}`} className="flex items-center gap-2">
                              <Eye className="size-4" />
                              <span>View Details</span>
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-3 border-t border-brand-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#6B5A64]">
                Showing <span className="font-semibold text-[#1F1720]">{startItem}</span>-<span className="font-semibold text-[#1F1720]">{endItem}</span> of <span className="font-semibold text-[#1F1720]">{totalCount}</span> orders
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => void setQueryState({ page: Math.max(currentPage - 1, 1) })}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <div className="rounded-lg border border-brand-border bg-slate-50 px-3 py-2 text-sm font-medium text-[#1F1720]">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  onClick={() => void setQueryState({ page: Math.min(currentPage + 1, totalPages) })}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            icon={emptyState!.icon}
            title={emptyState!.title}
            description={emptyState!.description}
            action={emptyState!.action}
          />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-brand-border bg-slate-50 px-6 py-12 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white text-[#315243] shadow-sm">
        <Icon className="size-7" />
      </div>
      <h3 className="text-xl font-bold text-[#1F1720]">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-[#6B5A64]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
