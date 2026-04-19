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
  Sparkles,
  UserCog,
  BarChart3,
  ArrowRight,
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
          <Button asChild className="bg-[#315243] hover:bg-[#1A3026] text-white rounded-xl h-12 px-5 shadow-lg shadow-[#315243]/20">
            <Link href={`/${locale}/admin/products/new`} className="flex items-center gap-2">
              <PackagePlus className="w-4 h-4" />
              New Product
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <KpiCard title="Total Sales" value={`LKR ${kpis.totalSales.toLocaleString()}`} icon={DollarSign} accent="text-emerald-600" helper="Orders module pending" />
          <KpiCard title="Orders" value={kpis.totalOrders.toLocaleString()} icon={ShoppingCart} accent="text-blue-600" helper="Real-time when orders are enabled" />
          <KpiCard title="Customers" value={kpis.totalCustomers.toLocaleString()} icon={Users} accent="text-amber-600" helper="Registered customer accounts" />
          <KpiCard title="Out-of-Stock" value={kpis.outOfStockItems.toLocaleString()} icon={AlertTriangle} accent="text-rose-600" helper="Requires immediate restock" />
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-bold text-[#6B5A64] uppercase tracking-wider">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <ActionTile
              href={`/${locale}/admin/products/new`}
              icon={PackagePlus}
              title="Add New Product"
              description="Create and publish inventory"
              iconClassName="bg-emerald-100 text-emerald-700"
            />
            <ActionTile
              href={`/${locale}/admin/orders`}
              icon={ClipboardPlus}
              title="Create New Order"
              description="Start a POS order flow"
              iconClassName="bg-blue-100 text-blue-700"
            />
            {isSuperAdmin && (
              <ActionTile
                href={`/${locale}/admin/users`}
                icon={UserCog}
                title="Manage Users"
                description="Staff and customer controls"
                iconClassName="bg-orange-100 text-orange-700"
              />
            )}
            <ActionTile
              href={`/${locale}/admin/moods`}
              icon={Sparkles}
              title="Manage Moods"
              description="Create tags for mood-based shopping"
              iconClassName="bg-[#FDF9E8] text-[#9B854A]"
            />
            <ActionTile
              href={`/${locale}/admin/reports`}
              icon={BarChart3}
              title="Business Insights"
              description="Detailed boutique analytics and sales performance"
              iconClassName="bg-[#315243] text-white"
            />
            <ActionTile
              href={`/${locale}/admin/settings/shipping`}
              icon={Truck}
              title="Delivery Charges"
              description="Update delivery fees and free-shipping thresholds"
              iconClassName="bg-cyan-100 text-cyan-700"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold text-[#6B5A64] uppercase tracking-wider">Management Modules</h2>
          <div className="overflow-x-auto pb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-w-[640px] md:min-w-0">
              <ModuleCard href={`/${locale}/admin/products`} title="Products" description="Edit, delete or search your product catalog" />
              <ModuleCard href={`/${locale}/admin/categories`} title="Categories" description="Organize products into browsable groups" />
              <ModuleCard href={`/${locale}/admin/occasions`} title="Occasions" description="Manage gifting moments and campaigns" />
              <ModuleCard href={`/${locale}/admin/gift-cards`} title="Gift Cards" description="Configure card values and availability" />
              {isSuperAdmin && (
                <ModuleCard href={`/${locale}/admin/users`} title="User Setup" description="Manage staff and customer accounts" />
              )}
              <ModuleCard href={`/${locale}/admin/orders`} title="Orders" description="Track and fulfill incoming purchases" />
            </div>
          </div>
        </section>

        <div className="text-xs text-[#6B5A64] rounded-2xl border border-brand-border bg-white px-4 py-3">
          Tips: Tablet mode defaults to icon-only sidebar for more workspace. Use the sidebar toggle to expand labels.
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  helper,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <Card className="border border-brand-border bg-white shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0 px-5 pt-5">
        <CardTitle className="text-xs font-bold text-[#6B5A64] uppercase tracking-wide">{title}</CardTitle>
        <Icon className={`w-5 h-5 ${accent}`} />
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="text-2xl font-bold text-[#1F1720]">{value}</div>
        <p className="text-xs text-[#6B5A64] mt-1">{helper}</p>
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
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  iconClassName: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-brand-border bg-white p-5 min-h-[136px] hover:border-[#315243] hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconClassName}`}>
          <Icon className="w-7 h-7" />
        </div>
        <ArrowRight className="w-4 h-4 text-[#315243] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="mt-4">
        <h3 className="font-bold text-[#1F1720] text-base">{title}</h3>
        <p className="text-sm text-[#6B5A64] mt-1">{description}</p>
      </div>
    </Link>
  );
}

function ModuleCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-brand-border bg-white px-5 py-4 hover:border-[#315243] hover:bg-[#FDF9E8]/40 transition-colors"
    >
      <div className="font-semibold text-[#1F1720]">{title}</div>
      <p className="text-sm text-[#6B5A64] mt-1">{description}</p>
    </Link>
  );
}
