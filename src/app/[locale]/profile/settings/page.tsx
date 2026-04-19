import { getTranslations } from "next-intl/server";
import { Settings, Bell, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default async function SettingsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  await props.params;
  const t = await getTranslations("Profile");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
        <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
          <Settings className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("settings")}</h1>
          <p className="text-gray-500 mt-1">Manage your account preferences and security.</p>
        </div>
      </div>

      <div className="space-y-10">
        {/* Profile Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            Profile Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Your Name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="email@example.com" disabled />
            </div>
          </div>
          <Button className="bg-[#315243] hover:bg-[#1A3026] rounded-full">Save Changes</Button>
        </section>

        {/* Notifications Section */}
        <section className="space-y-4 pt-8 border-t border-gray-50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-400" />
            Notifications
          </h3>
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="font-semibold text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive updates about your orders.</p>
              </div>
              <Switch checked />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="font-semibold text-gray-900">Promotional Emails</p>
                <p className="text-sm text-gray-500">Get notified about new collections and offers.</p>
              </div>
              <Switch />
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="space-y-4 pt-8 border-t border-gray-50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-400" />
            Security
          </h3>
          <div className="max-w-xl">
            <Button variant="outline" className="rounded-full">Change Password</Button>
            <p className="text-xs text-gray-500 mt-4">Last password change: 2 months ago.</p>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="space-y-4 pt-8 border-t border-gray-50">
          <h3 className="text-lg font-bold text-red-600">Danger Zone</h3>
          <div className="p-6 border border-red-100 bg-red-50 rounded-3xl">
            <p className="font-semibold text-red-900">Delete Account</p>
            <p className="text-sm text-red-700/70 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
            <Button variant="destructive" className="rounded-full">Delete My Account</Button>
          </div>
        </section>
      </div>
    </div>
  );
}
