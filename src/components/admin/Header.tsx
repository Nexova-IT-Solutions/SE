"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { Bell, LogOut, Settings, User, AlertCircle } from "lucide-react"

import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type AdminHeaderUser = {
  name?: string | null
  email?: string | null
  image?: string | null
}

type AdminHeaderProps = {
  locale: string
  user?: AdminHeaderUser | null
}

function getInitials(name: string, email?: string | null) {
  const source = name.trim() || email?.trim() || "Admin"
  const parts = source
    .replace(/@.*/, "")
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) {
    return "A"
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function AdminHeader({ locale, user }: AdminHeaderProps) {
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Admin"
  const email = user?.email?.trim() || "No email available"
  const initials = getInitials(displayName, user?.email)

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      window.localStorage.clear()
      window.sessionStorage.clear()
    }

    await signOut({ callbackUrl: `/${locale}/sign-in` })
  }

  return (
    <header className="h-14 border-b border-brand-border bg-white/95 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex h-full items-center gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <div className="min-w-0">
            <AdminBreadcrumb />
          </div>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-full px-3 py-2 text-[#6B5A64] hover:bg-[#315243]/10 hover:text-[#315243] transition-all duration-200 group"
            >
              <div className="relative">
                <Bell className="size-6 transition-transform group-hover:rotate-12" />
              </div>
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-sm ring-2 ring-white transition-all group-hover:bg-red-600">
                3
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={12}
            className="w-80 rounded-2xl border border-brand-border bg-white p-2 shadow-xl shadow-black/5"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
              <Badge variant="outline" className="text-[10px] h-4 border-red-100 text-red-600 bg-red-50">
                3 New Alerts
              </Badge>
            </div>
            <DropdownMenuSeparator className="my-1" />
            
            <div className="max-h-[300px] overflow-y-auto py-1">
              {[
                { id: 1, name: "Gold Cuff Links", stock: 2, status: "Low Stock" },
                { id: 2, name: "Silk Pocket Square", stock: 1, status: "Low Stock" },
                { id: 3, name: "Leather Wallet", stock: 0, status: "Out of Stock" },
              ].map((item) => (
                <DropdownMenuItem key={item.id} className="cursor-default rounded-xl px-3 py-3 focus:bg-slate-50">
                  <div className="flex w-full items-start gap-3">
                    <div className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                      item.stock === 0 ? "bg-red-50 ring-red-100" : "bg-amber-50 ring-amber-100"
                    )}>
                      <AlertCircle className={cn(
                        "size-5",
                        item.stock === 0 ? "text-red-600" : "text-amber-600"
                      )} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Only <span className="font-semibold text-slate-700">{item.stock}</span> units left in inventory.
                      </p>
                    </div>
                    <Badge className={cn(
                      "text-[10px] h-4 whitespace-nowrap",
                      item.stock === 0 ? "bg-red-500" : "bg-amber-500"
                    )}>
                      {item.status}
                    </Badge>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>

            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem asChild className="cursor-pointer justify-center rounded-xl p-2.5 text-xs font-semibold text-[#315243] hover:bg-[#FDF9E8]">
              <Link href={`/${locale}/admin/products`}>
                View Inventory Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open user profile menu"
              className="ml-auto inline-flex items-center justify-center rounded-full border border-transparent p-0.5 transition hover:border-[#315243]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315243]/30"
            >
              <Avatar className="size-10 ring-1 ring-border/60">
                <AvatarImage src={user?.image ?? undefined} alt={displayName} />
                <AvatarFallback className="bg-[#FDF9E8] text-sm font-semibold text-[#315243]">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={12}
            className="w-72 rounded-2xl border border-brand-border bg-white p-2 shadow-xl shadow-black/5"
          >
            <DropdownMenuLabel className="px-3 py-2">
              <div className="space-y-0.5">
                <p className="truncate text-sm font-medium text-slate-900">{displayName}</p>
                <p className="truncate text-xs text-slate-500">{email}</p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem asChild className="min-h-11 rounded-xl px-3 py-2.5 text-sm">
              <Link href={`/${locale}/admin/profile/edit`} className="flex w-full items-center gap-2">
                <User className="size-4 text-slate-500" />
                <span>Edit Profile</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="min-h-11 rounded-xl px-3 py-2.5 text-sm">
              <Link href={`/${locale}/admin/settings/account`} className="flex w-full items-center gap-2">
                <Settings className="size-4 text-slate-500" />
                <span>Account Settings</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="min-h-11 rounded-xl px-3 py-2.5 text-sm text-red-600 focus:bg-red-50 focus:text-red-700"
              onSelect={() => {
                void handleLogout()
              }}
            >
              <span className="flex items-center gap-2">
                <LogOut className="size-4" />
                <span>Logout</span>
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}