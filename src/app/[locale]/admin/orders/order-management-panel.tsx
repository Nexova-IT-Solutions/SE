"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Printer, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { formatOrderStatusLabel } from "@/lib/admin-orders";

type OrderPanelProps = {
  order: {
    id: string;
    orderStatus: string;
    paymentStatus: string;
    internalNotes: string | null;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    userId: string;
    total: number;
    subtotal: number;
    deliveryFee: number;
    giftWrapPrice: number | null;
    giftWrapName: string | null;
    suppressInvoice: boolean;
    isGift: boolean;
  };
  customerOrderCount: number;
  customerProfileUrl: string;
};

const ORDER_STATUS_VALUES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

const PAYMENT_STATUS_VALUES = ["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED"] as const;

export function OrderManagementPanel({ order, customerOrderCount, customerProfileUrl }: OrderPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [internalNotes, setInternalNotes] = React.useState(order.internalNotes ?? "");
  const [savingNotes, setSavingNotes] = React.useState(false);
  const [savingStatus, setSavingStatus] = React.useState<"orderStatus" | "paymentStatus" | null>(null);

  const repeatCustomer = customerOrderCount > 1;

  const handleStatusChange = async (type: "orderStatus" | "paymentStatus", newStatus: string) => {
    if (newStatus === order[type]) return;

    setSavingStatus(type);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [type]: newStatus }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to update order");
      }

      toast({
        title: "Updated",
        description: `${type === "orderStatus" ? "Order" : "Payment"} status updated to ${formatOrderStatusLabel(newStatus)}`,
      });
      router.refresh();
    } catch (error: any) {
      toast({ title: "Update failed", description: error?.message || "Could not update status", variant: "destructive" });
    } finally {
      setSavingStatus(null);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNotes }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to save notes");
      }

      toast({ title: "Saved", description: "Internal notes updated" });
      router.refresh();
    } catch (error: any) {
      toast({ title: "Save failed", description: error?.message || "Could not save internal notes", variant: "destructive" });
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-brand-border bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#1F1720]">Status Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1F1720]">Order Status</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="w-full text-left">
                  <OrderStatusBadge status={order.orderStatus} type="ORDER" className="w-full justify-center py-2" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-xl border-brand-border">
                {ORDER_STATUS_VALUES.map((status) => (
                  <DropdownMenuItem key={status} onClick={() => void handleStatusChange("orderStatus", status)}>
                    {formatOrderStatusLabel(status)}
                    {status === order.orderStatus ? <span className="ml-auto text-xs text-[#315243]">Current</span> : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1F1720]">Payment Status</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="w-full text-left">
                  <OrderStatusBadge status={order.paymentStatus} type="PAYMENT" className="w-full justify-center py-2" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-xl border-brand-border">
                {PAYMENT_STATUS_VALUES.map((status) => (
                  <DropdownMenuItem key={status} onClick={() => void handleStatusChange("paymentStatus", status)}>
                    {formatOrderStatusLabel(status)}
                    {status === order.paymentStatus ? <span className="ml-auto text-xs text-[#315243]">Current</span> : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 size-4" />
              Print Packing Slip
            </Button>
            <Button type="button" variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 size-4" />
              Print Invoice
            </Button>
          </div>

          {savingStatus ? (
            <p className="flex items-center gap-2 text-xs text-[#6B5A64]">
              <Loader2 className="size-3.5 animate-spin" />
              Updating {savingStatus === "orderStatus" ? "order" : "payment"} status...
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-brand-border bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#1F1720]">Customer Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#6B5A64]">Customer</span>
            <Badge className={repeatCustomer ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"}>
              {repeatCustomer ? "Repeat Customer" : "First Order"}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#6B5A64]">Orders by email</span>
            <span className="font-semibold text-[#1F1720]">{customerOrderCount}</span>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-brand-border bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-[#6B5A64]">Customer Profile</p>
            <a href={customerProfileUrl} className="text-sm font-semibold text-[#315243] hover:underline">
              View customer profile
            </a>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-brand-border bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#1F1720]">Internal Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={internalNotes}
            onChange={(event) => setInternalNotes(event.target.value)}
            placeholder="Add private warehouse / fulfillment notes here..."
            className="min-h-[180px] rounded-xl"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[#6B5A64]">Visible only to admins.</p>
            <Button type="button" onClick={() => void handleSaveNotes()} disabled={savingNotes} className="bg-[#315243] text-white hover:bg-[#1A3026]">
              {savingNotes ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save Notes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-brand-border bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#1F1720]">Operational Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <SnapshotRow label="Customer" value={order.customerName} />
          <SnapshotRow label="Email" value={order.customerEmail || "-"} />
          <SnapshotRow label="Phone" value={order.customerPhone || "-"} />
          <SnapshotRow label="Gift Wrap" value={order.giftWrapName || "-"} />
          <SnapshotRow label="Invoice" value={order.suppressInvoice ? "Do not include" : "Include"} />
          <SnapshotRow label="Total" value={`LKR ${order.total.toLocaleString()}`} emphasized />
        </CardContent>
      </Card>
    </div>
  );
}

function SnapshotRow({
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
      <span className="text-[#6B5A64]">{label}</span>
      <span className={emphasized ? "font-bold text-[#315243]" : "font-medium text-[#1F1720]"}>{value}</span>
    </div>
  );
}
