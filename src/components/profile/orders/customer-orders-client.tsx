"use client";

import { useMemo, useState } from "react";
import { Search, ShoppingBag, WalletCards, Truck, PackageCheck, Star, RefreshCcw } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { OrderHistoryCard, type OrderHistoryCardOrder } from "@/components/profile/orders/order-history-card";
import { OrderEmptyState } from "@/components/profile/orders/order-empty-state";
import { categorizeOrders, type CategorizedOrders, type OrderCategoryKey } from "@/lib/orders/categorize-orders";

type CustomerOrdersClientProps = {
  locale: string;
  orders: OrderHistoryCardOrder[];
};

type TabKey = "all" | OrderCategoryKey;

const tabConfig: Array<{ key: TabKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "toPay", label: "To Pay" },
  { key: "toShip", label: "To Ship" },
  { key: "toReceive", label: "To Receive" },
  { key: "toReview", label: "To Review" },
  { key: "returns", label: "Returns" },
];

export function CustomerOrdersClient({ locale, orders }: CustomerOrdersClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const categorized = useMemo(() => categorizeOrders(orders), [orders]);

  const activeOrders = useMemo(() => {
    const source = activeTab === "all" ? categorized.all : categorized[activeTab];
    const query = searchTerm.trim().toLowerCase();

    if (!query) return source;

    return source.filter((order) => {
      const inOrderNumber = order.orderNumber.toLowerCase().includes(query);
      const inProducts = order.items.some((item) => item.productName.toLowerCase().includes(query));
      return inOrderNumber || inProducts;
    });
  }, [activeTab, categorized, searchTerm]);

  const hasSearch = searchTerm.trim().length > 0;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-sm text-gray-500">Track orders, payments, and delivery status in one place.</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by order number or product name"
          className="h-11 rounded-xl border-gray-200 bg-white pl-10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)} className="gap-4">
        <TabsList className="scrollbar-hide flex h-auto w-full snap-x snap-mandatory flex-nowrap items-center justify-start gap-2 overflow-x-auto rounded-none bg-transparent p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabConfig.map((tab) => {
            const count = tab.key === "all" ? categorized.all.length : categorized[tab.key].length;
            return (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="snap-start rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 data-[state=active]:border-[#315243] data-[state=active]:bg-[#FDF9E8] data-[state=active]:text-[#315243]"
              >
                <span>{tab.label}</span>
                {count > 0 ? (
                  <Badge className="ml-1 rounded-full bg-[#315243] px-1.5 py-0 text-[10px] text-white hover:bg-[#315243]">
                    {count}
                  </Badge>
                ) : null}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabConfig.map((tab) => {
          const tabOrders = tab.key === "all" ? categorized.all : categorized[tab.key];
          const visibleOrders = activeTab === tab.key ? activeOrders : tabOrders;

          return (
            <TabsContent key={tab.key} value={tab.key} className="space-y-4">
              {visibleOrders.length > 0 ? (
                visibleOrders.map((order) => (
                  <OrderHistoryCard
                    key={order.id}
                    locale={locale}
                    order={order}
                    context={tab.key === "all" ? "all" : tab.key}
                  />
                ))
              ) : (
                <OrderEmptyState
                  icon={getEmptyIcon(tab.key)}
                  title={hasSearch ? `No matches found in ${tab.label}` : getEmptyTitle(tab.key)}
                  description={
                    hasSearch
                      ? "Try searching by another order number or product name."
                      : getEmptyDescription(tab.key)
                  }
                />
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function getEmptyIcon(tab: TabKey) {
  if (tab === "toPay") return WalletCards;
  if (tab === "toShip") return Truck;
  if (tab === "toReceive") return PackageCheck;
  if (tab === "toReview") return Star;
  if (tab === "returns") return RefreshCcw;
  return ShoppingBag;
}

function getEmptyTitle(tab: TabKey) {
  if (tab === "toPay") return "No payments pending";
  if (tab === "toShip") return "No orders waiting to ship";
  if (tab === "toReceive") return "No orders in transit";
  if (tab === "toReview") return "No delivered orders to review";
  if (tab === "returns") return "No return or cancelled orders";
  return "No orders yet";
}

function getEmptyDescription(tab: TabKey) {
  if (tab === "toPay") return "When unpaid online orders are placed, they will appear here.";
  if (tab === "toShip") return "Confirmed and processing orders will be listed here.";
  if (tab === "toReceive") return "Shipped orders that are on the way appear here.";
  if (tab === "toReview") return "Delivered orders ready for your review show up here.";
  if (tab === "returns") return "Cancelled or refunded orders are listed in this tab.";
  return "Place your first order to start tracking it here.";
}
