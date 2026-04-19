import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { 
  ShoppingBag, 
  MapPin, 
  CreditCard, 
  ArrowRight,
  Clock,
  CheckCircle2,
  Settings
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecentlyViewedSection } from "@/components/profile/RecentlyViewedSection";

export default async function ProfileDashboard(props: {
  params: Promise<{ locale: string }>;
}) {
  await props.params;
  const session = await getServerSession(authOptions);
  const t = await getTranslations("Profile");

  if (!session?.user?.id) return null;

  // Fetch some summary data
  const [addressCount, defaultShipping] = await Promise.all([
    db.address.count({ where: { userId: session.user.id } }),
    db.address.findFirst({ where: { userId: session.user.id, type: "DELIVERY", isDefault: true } }),
  ]);

  return (
    <div className="space-y-8">
      {/* Header / Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          {t("welcome")} {session.user?.name || "User"}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Manage your account, orders, and addresses in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Account Status Card */}
        <div className="p-6 rounded-3xl border border-gray-100 bg-gray-50 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Account Status</h3>
            <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              {t("active")}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200/50">
            <p className="text-xs text-gray-400 font-medium">{t("memberSince")}</p>
            <p className="text-sm font-semibold text-gray-700">March 2024</p>
          </div>
        </div>

        {/* Addresses Summary Card */}
        <div className="p-6 rounded-3xl border border-gray-100 bg-gray-50 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">{t("addresses")}</h3>
            <div className="text-xl font-bold text-gray-900">
              {addressCount} Saved {addressCount === 1 ? "Address" : "Addresses"}
            </div>
            {defaultShipping && (
              <p className="text-sm text-gray-500 mt-2 truncate max-w-full">
                 🏠 {defaultShipping.city}
              </p>
            )}
          </div>
          <Link href="/profile/addresses" className="mt-4 text-[#9B854A] text-sm font-bold flex items-center gap-1 hover:underline group">
            {t("manageAddresses")}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Orders Summary Card */}
        <div className="p-6 rounded-3xl border border-gray-100 bg-[#315243] text-white flex flex-col justify-between shadow-lg shadow-[#315243]/10">
          <div>
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-4">{t("orders")}</h3>
            <div className="text-xl font-bold">No Recent Orders</div>
            <p className="text-sm text-white/80 mt-2">Ready to send some love?</p>
          </div>
          <Link href="/" className="mt-4 text-white text-sm font-bold flex items-center gap-1 hover:opacity-80 group">
            Shop Now
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Recent Orders Section Placeholder */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-[#315243]" />
            {t("recentOrders")}
          </h2>
          <Button variant="ghost" asChild className="text-[#315243] hover:bg-[#315243]/5 rounded-full">
            <Link href="/orders">
              {t("viewOrders")}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>

        <div className="text-center py-16 bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm">
            <Clock className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium mb-1">{t("noOrders")}</p>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">Discover our collection and make someone's day special.</p>
          <Button asChild className="mt-6 bg-[#315243] hover:bg-[#1A3026] rounded-full px-10 transition-all shadow-md">
            <Link href="/gift-boxes">Explore Collections</Link>
          </Button>
        </div>
      </div>

      {/* Quick Settings Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-8 border-t border-gray-50">
        <div className="flex gap-4 items-start p-6 rounded-3xl hover:bg-gray-50 transition-colors cursor-pointer group">
          <div className="p-3 bg-blue-100 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{t("billing")}</h4>
            <p className="text-sm text-gray-500 mt-1">{t("updateBilling")}</p>
            <Link href="/profile/billing" className="text-xs text-[#9B854A] font-bold uppercase tracking-widest mt-3 block hover:underline">
              Go to Billing
            </Link>
          </div>
        </div>

        <div className="flex gap-4 items-start p-6 rounded-3xl hover:bg-gray-50 transition-colors cursor-pointer group">
          <div className="p-3 bg-purple-100 rounded-2xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-200">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{t("settings")}</h4>
            <p className="text-sm text-gray-500 mt-1">Manage notifications and security.</p>
            <Link href="/profile/settings" className="text-xs text-[#9B854A] font-bold uppercase tracking-widest mt-3 block hover:underline">
              View Settings
            </Link>
          </div>
        </div>
      </div>

      <RecentlyViewedSection />
    </div>
  );
}
