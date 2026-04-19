import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  PackagePlus,
  ClipboardPlus,
  Gift,
  UserCog,
  BarChart3,
  ArrowRight,
  Package,
  Layers,
  Heart,
  CreditCard,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    redirect("/"); 
  }
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  let kpis = {
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    outOfStockItems: 0,
  };
  let recentOrders: Array<{ id: string; customer: string; amount: number; status: string }> = [];
  
  try {
    const [
      customerCount,
      outOfStockCount,
    ] = await Promise.all([
      db.user.count({ where: { role: "USER" } }),
      db.product.count({ where: { stock: { lte: 0 } } }),
    ]);
    kpis = {
      totalSales: 0,
      totalOrders: 0,
      totalCustomers: customerCount,
      outOfStockItems: outOfStockCount,
    };

    // Placeholder table shape until Order model is introduced.
    recentOrders = [];
  } catch (error) {
    console.error("Failed to fetch dashboard counts:", error);
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto space-y-8 px-4 md:px-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-brand-border pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1F1720]">Admin POS Dashboard</h1>
            <p className="text-[#6B5A64] mt-1">Touch-friendly controls for store operations and fast navigation.</p>
          </div>
          <Button asChild className="bg-[#315243] hover:bg-[#1A3026] text-white rounded-xl h-12 px-5">
            <Link href={`/${locale}/admin/products/new`} className="flex items-center gap-2">
              <PackagePlus className="w-4 h-4" />
              New Product
            </Link>
          </Button>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="grid grid-cols-4 gap-3 min-w-[980px]">
            <KpiCard title="Total Sales" value={`LKR ${kpis.totalSales.toLocaleString()}`} icon={DollarSign} accent="text-emerald-700" bgClass="bg-emerald-50" />
            <KpiCard title="Orders" value={kpis.totalOrders.toLocaleString()} icon={ShoppingCart} accent="text-blue-700" bgClass="bg-blue-50" />
            <KpiCard title="Customers" value={kpis.totalCustomers.toLocaleString()} icon={Users} accent="text-amber-700" bgClass="bg-amber-50" />
            <KpiCard title="Out-of-Stock" value={kpis.outOfStockItems.toLocaleString()} icon={AlertTriangle} accent="text-rose-700" bgClass="bg-rose-50" />
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-bold text-[#6B5A64] uppercase tracking-wider">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <ActionTile
              href={`/${locale}/admin/products/new`}
              icon={PackagePlus}
              title="Add New Product"
              description="Create and publish inventory"
              iconClassName="bg-emerald-500 text-white"
              cardClassName="bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
            />
            <ActionTile
              href={`/${locale}/admin/orders`}
              icon={ClipboardPlus}
              title="Create New Order"
              description="Start a POS order flow"
              iconClassName="bg-blue-500 text-white"
              cardClassName="bg-blue-50 border-blue-200 hover:bg-blue-100"
            />
            {isSuperAdmin && (
              <ActionTile
                href={`/${locale}/admin/users`}
                icon={UserCog}
                title="Manage Users"
                description="Staff and customer controls"
                iconClassName="bg-orange-500 text-white"
                cardClassName="bg-orange-50 border-orange-200 hover:bg-orange-100"
              />
            )}
            <ActionTile
              href={`/${locale}/admin/reports`}
              icon={BarChart3}
              title="View Business Reports"
              description="Detailed boutique analytics and sales performance insights"
              iconClassName="bg-[#315243] text-white"
              cardClassName="bg-white border-brand-border hover:bg-[#FDF9E8]"
            />
            <ActionTile
              href={`/${locale}/admin/settings/shipping`}
              icon={Truck}
              title="Delivery Charges"
              description="Update delivery fees and free-shipping thresholds"
              iconClassName="bg-cyan-500 text-white"
              cardClassName="bg-cyan-50 border-cyan-200 hover:bg-cyan-100"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold text-[#6B5A64] uppercase tracking-wider">Management Modules</h2>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B5A64]">Inventory Control</h3>
              <ModuleCard href={`/${locale}/admin/products`} icon={Package} title="Products" description="Edit, delete or search your product catalog" />
              <ModuleCard href={`/${locale}/admin/categories`} icon={Layers} title="Categories" description="Organize products into browsable groups" />
              <ModuleCard href={`/${locale}/admin/occasions`} icon={Heart} title="Occasions" description="Manage gifting moments and campaigns" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B5A64]">Sales & Orders</h3>
              <ModuleCard href={`/${locale}/admin/orders`} icon={ShoppingCart} title="Orders" description="Track and fulfill incoming purchases" />
              <ModuleCard href={`/${locale}/admin/gift-cards`} icon={CreditCard} title="Gift Cards" description="Configure card values and availability" />
              <ModuleCard href={`/${locale}/admin/reports`} icon={BarChart3} title="Reports" description="Analyze sales and team performance" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B5A64]">User Management</h3>
              {isSuperAdmin ? (
                <>
                  <ModuleCard href={`/${locale}/admin/users`} icon={Users} title="User Setup" description="Manage staff and customer accounts" />
                  <ModuleCard href={`/${locale}/admin/users/templates`} icon={UserCog} title="Permission Templates" description="Control role-based access profiles" />
                  <ModuleCard href={`/${locale}/admin/users/new?type=staff`} icon={UserCog} title="Add Staff User" description="Create a new employee account" />
                </>
              ) : (
                <Card className="rounded-2xl border border-brand-border bg-white">
                  <CardContent className="p-4 text-sm text-[#6B5A64]">
                    User management is available only for super admins.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#6B5A64] uppercase tracking-wider">Recent Orders</h2>
          <Card className="rounded-2xl border-brand-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-slate-50 border-b border-brand-border">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold text-[#6B5A64]">ID</th>
                      <th className="px-5 py-3 text-left font-semibold text-[#6B5A64]">Customer</th>
                      <th className="px-5 py-3 text-left font-semibold text-[#6B5A64]">Amount</th>
                      <th className="px-5 py-3 text-left font-semibold text-[#6B5A64]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length > 0 ? (
                      recentOrders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="border-b border-brand-border/70 last:border-b-0">
                          <td className="px-5 py-3 font-medium text-[#1F1720]">{order.id}</td>
                          <td className="px-5 py-3 text-[#1F1720]">{order.customer}</td>
                          <td className="px-5 py-3 text-[#1F1720]">LKR {order.amount.toLocaleString()}</td>
                          <td className="px-5 py-3">
                            <span className="inline-flex rounded-full bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-semibold">
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-[#6B5A64]">
                          No recent orders available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  accent,
  bgClass,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  bgClass: string;
}) {
  return (
    <Card className={`border border-brand-border shadow-sm rounded-xl overflow-hidden ${bgClass}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-4 pt-3">
        <CardTitle className="text-[11px] font-bold text-[#6B5A64] uppercase tracking-wide">{title}</CardTitle>
        <Icon className={`w-5 h-5 ${accent}`} />
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="text-xl font-bold text-[#1F1720]">{value}</div>
      </CardContent>
    </Card>
  );
}

function ActionTile({
  href,
  icon: Icon,
  title,
  description,
  iconClassName,
  cardClassName,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  iconClassName: string;
  cardClassName: string;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-2xl border p-5 min-h-[150px] shadow-sm hover:shadow-lg transition-all ${cardClassName}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${iconClassName}`}>
          <Icon className="w-8 h-8" />
        </div>
        <ArrowRight className="w-5 h-5 text-[#315243] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="mt-4">
        <h3 className="font-bold text-[#1F1720] text-base">{title}</h3>
        <p className="text-sm text-[#6B5A64] mt-1">{description}</p>
      </div>
    </Link>
  );
}

function ModuleCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-brand-border bg-white px-5 py-4 hover:border-[#315243] hover:bg-[#FDF9E8]/40 transition-colors"
    >
      <div className="flex items-center gap-2 font-semibold text-[#1F1720]">
        <Icon className="w-4 h-4 text-[#315243]" />
        {title}
      </div>
      <p className="text-sm text-[#6B5A64] mt-1">{description}</p>
    </Link>
  );
}
