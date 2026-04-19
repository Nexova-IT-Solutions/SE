import { getServerSession } from "next-auth/next"

import { AppSidebar } from "@/components/admin/app-sidebar"
import { AdminHeader } from "@/components/admin/Header"
import { authOptions } from "@/lib/auth"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await getServerSession(authOptions)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50">
        <div className="flex flex-col min-h-screen">
          <AdminHeader locale={locale} user={session?.user ?? null} />
          <div className="flex flex-1">
            <main className="flex-1 overflow-x-hidden">
              {children}
            </main>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
