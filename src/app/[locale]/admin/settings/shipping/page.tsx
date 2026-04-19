import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { ShippingConfigForm } from "./shipping-config-form";

export default async function AdminShippingSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN" && session.user.role !== "STOREFRONT_ADMIN")) {
    redirect("/");
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1F1720]">Shipping Settings</h1>
          <p className="mt-1 text-sm text-[#6B5A64]">Manage delivery fees, thresholds, and shipping configuration.</p>
        </div>

        <Card className="rounded-2xl border border-brand-border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#1F1720]">Shipping Configuration</CardTitle>
            <CardDescription>Update delivery fees, free delivery threshold, and shipping options</CardDescription>
          </CardHeader>
          <CardContent>
            <ShippingConfigForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
