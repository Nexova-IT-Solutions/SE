"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Package,
  Tags,
  Calendar,
  Smile,
  Gift,
  Percent,
  ShoppingCart,
  Image as ImageIcon,
  Users,
  Settings,
  Truck,
  BarChart3,
  TrendingUp,
} from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"

type NavItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

const overviewItems: NavItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
]

const catalogItems: NavItem[] = [
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Discounts", url: "/admin/discounts", icon: Percent },
  { title: "Categories", url: "/admin/categories", icon: Tags },
  { title: "Occasions", url: "/admin/occasions", icon: Calendar },
  { title: "Moods", url: "/admin/moods", icon: Smile },
  { title: "Gift Cards", url: "/admin/gift-cards", icon: Gift },
]

const salesItems: NavItem[] = [
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { title: "Shipping Settings", url: "/admin/settings/shipping", icon: Truck },
]

const storefrontItems: NavItem[] = [
  { title: "Promo Banners", url: "/admin/banners", icon: ImageIcon },
]

const administrationItems: NavItem[] = [
  { title: "Users Setup", url: "/admin/users", icon: Users },
]

const systemItems: NavItem[] = [
  { title: "Settings", url: "/admin/settings", icon: Settings },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { isMobile, setOpen } = useSidebar()
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"
  const [pendingOrderCount, setPendingOrderCount] = React.useState(0)

  React.useEffect(() => {
    if (isMobile || typeof window === "undefined") return

    const isTablet = window.matchMedia("(min-width: 768px) and (max-width: 1279px)").matches
    setOpen(!isTablet)
  }, [isMobile, setOpen])

  React.useEffect(() => {
    const controller = new AbortController()

    const fetchPendingOrderCount = async () => {
      try {
        const response = await fetch("/api/admin/orders/metrics", {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!response.ok) return

        const payload = await response.json()
        if (typeof payload.pendingOrders === "number") {
          setPendingOrderCount(payload.pendingOrders)
        }
      } catch {
        // Sidebar alert is best-effort only.
      }
    }

    void fetchPendingOrderCount()

    return () => controller.abort()
  }, [])

  const isActive = (url: string) => {
    const normalizedPath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
    const localeAgnosticPath = normalizedPath.replace(/^\/(en|si|ta)(?=\/|$)/, "") || "/"

    if (url === "/admin") return localeAgnosticPath === "/admin"
    return localeAgnosticPath === url || localeAgnosticPath.startsWith(`${url}/`)
  }

  const localePrefix = pathname.split("/")[1]
  const isLocale = ["en", "si", "ta"].includes(localePrefix)
  const toHref = (url: string) => (isLocale ? `/${localePrefix}${url}` : url)

  const renderNavGroup = (label: string, items: NavItem[]) => (
    <SidebarGroup>
      <SidebarGroupLabel className="px-2 text-[11px] font-black uppercase tracking-wider text-[#6B5A64]">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip={item.title}
              isActive={isActive(item.url)}
              className="mx-1 rounded-xl px-3 text-[14px] font-medium text-[#1F1720] hover:bg-[#FDF9E8] hover:text-[#315243] data-[active=true]:bg-[#315243] data-[active=true]:text-white"
            >
              <Link href={toHref(item.url)}>
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
                {item.url === "/admin/orders" ? (
                  <Badge className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${pendingOrderCount > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                    {pendingOrderCount}
                  </Badge>
                ) : null}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-brand-border bg-white shadow-sm">
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-brand-border">
        <Link href={`/${isLocale ? localePrefix : "en"}`} className="flex items-center gap-2 font-bold text-xl text-[#315243] overflow-hidden truncate">
          <span className="truncate uppercase tracking-tight">Admin Dashboard</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="py-3">
        {renderNavGroup("Overview", overviewItems)}
        {renderNavGroup("Catalog", catalogItems)}
        {renderNavGroup("Sales", salesItems)}
        {renderNavGroup("Storefront", storefrontItems)}

        {isSuperAdmin && renderNavGroup("Administration", administrationItems)}

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[11px] font-black uppercase tracking-wider text-[#6B5A64]">
            Reports
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="lg"
                tooltip="Sales Reports"
                isActive={isActive("/admin/reports")}
                className="mx-1 rounded-xl px-3 text-[14px] font-medium text-[#1F1720] hover:bg-[#FDF9E8] hover:text-[#315243] data-[active=true]:bg-[#315243] data-[active=true]:text-white"
              >
                <Link href={toHref("/admin/reports")}>
                  <BarChart3 className="h-4 w-4" />
                  <span>Business Insights</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-brand-border py-2">
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
