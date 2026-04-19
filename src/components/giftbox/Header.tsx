"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { 
  Search, 
  ShoppingCart, 
  Menu, 
  Gift, 
  ChevronDown,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCartStore } from "@/store";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";

type CatData = { id: string; name: string; slug: string; image?: string; children?: CatData[] };

let cachedCategories: CatData[] | null = null;
let categoriesRequest: Promise<CatData[]> | null = null;

async function fetchCategoriesOnce(): Promise<CatData[]> {
  if (cachedCategories) return cachedCategories;
  if (!categoriesRequest) {
    categoriesRequest = fetch("/api/categories")
      .then((response) => response.json())
      .then((data) => {
        const resolved = Array.isArray(data) ? (data as CatData[]) : [];
        cachedCategories = resolved;
        return resolved;
      })
      .catch((error) => {
        categoriesRequest = null;
        throw error;
      });
  }
  return categoriesRequest;
}

const navigation = [
  { name: "Categories", href: "#categories", hasDropdown: true },
  { name: "Build Your Box", href: "/box-builder", icon: Sparkles, highlight: true },
];

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [categories, setCategories] = useState<CatData[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const { data: session, status } = useSession();
  const { openCart, getItemCount, getSubtotal, clearCart } = useCartStore();
  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const isCustomer = session?.user?.role === "USER";
  const isStaff = Boolean(session?.user?.role) && !isCustomer;
  const previousUserIdRef = useRef<string | null>(null);

  const clearPersistedCartStorage = () => {
    if (typeof window === "undefined") return;

    window.localStorage.removeItem("giftbox-cart");
    window.localStorage.removeItem("cart-storage");
  };

  const displayItemCount = status === "authenticated" ? itemCount : 0;
  const displaySubtotal = status === "authenticated" ? subtotal : 0;
  const formattedCartTotal = `LKR ${displaySubtotal.toLocaleString()}`;

  useEffect(() => {
    setMounted(true);
    setIsCategoriesLoading(true);

    fetchCategoriesOnce()
      .then((items) => setCategories(items))
      .catch((error) => {
        console.error(error);
        setCategories([]);
      })
      .finally(() => {
        setIsCategoriesLoading(false);
      });
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    const currentUserId = session?.user?.id ?? null;
    const previousUserId = previousUserIdRef.current;

    if (status === "unauthenticated") {
      clearCart();
      clearPersistedCartStorage();
    }

    if (previousUserId && previousUserId !== currentUserId) {
      clearCart();
      clearPersistedCartStorage();
    }

    previousUserIdRef.current = currentUserId;
  }, [clearCart, session?.user?.id, status]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    clearCart();
    clearPersistedCartStorage();

    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
    }

    await signOut();
  };

  return (
    <header className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled 
          ? "bg-[#1A3026]/90 backdrop-blur-md border-b border-white/10 shadow-lg py-2" 
          : "bg-[#1A3026] border-b border-white/5 py-4"
      )}>
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="relative group-hover:scale-110 transition-transform duration-500">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-[#9B854A]/20 blur-xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Image 
                src="/logo/logo.png?v=1.2" 
                alt="Skyish & Earthly Logo" 
                width={300}
                height={120}
                className="object-contain h-20 md:h-28 w-auto drop-shadow-[0_0_12px_rgba(155,133,74,0.4)]"
                priority
                unoptimized
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link href="/" prefetch={true} className="px-3 py-2 text-white/90 hover:text-white transition-colors rounded-lg hover:bg-white/10 font-medium text-base">
              Home
            </Link>

            {/* Categories Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setOpenDropdown("categories")}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <Link href="/categories" prefetch={true} className="flex items-center gap-1 px-3 py-2 text-white/90 hover:text-white transition-colors rounded-lg hover:bg-white/10 font-medium text-base">
                Collections
                <ChevronDown className="w-4 h-4" />
              </Link>
              {openDropdown === "categories" && (
                <div className="absolute top-full left-0 w-64 bg-white border border-brand-border rounded-xl shadow-lg p-2 animate-fade-in max-h-[80vh] overflow-y-visible z-50">
                  {isCategoriesLoading ? (
                    <div className="space-y-2 p-2">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-10 rounded-lg bg-[#EEF5F3] animate-pulse" />
                      ))}
                    </div>
                  ) : categories.length > 0 ? categories.map((category) => (
                    <div key={category.id} className="relative group">
                      <Link
                        href={`/categories?categories=${category.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-[#315243] hover:text-white transition-all group/item"
                      >
                        <span className="font-medium text-[#1F1720] group-hover/item:text-white">{category.name}</span>
                        {category.children && category.children.length > 0 && (
                          <ChevronRight className="w-4 h-4 text-[#6B5A64] group-hover/item:text-white" />
                        )}
                      </Link>
                      
                      {/* Subcategories Flyout */}
                      {category.children && category.children.length > 0 && (
                        <div className="absolute top-0 left-full ml-1 w-56 bg-white border border-brand-border rounded-xl shadow-xl p-2 invisible opacity-0 translate-x-2 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all z-50">
                          {category.children.map(sub => (
                            <Link 
                              key={sub.id} 
                              href={`/categories?categories=${sub.id}`} 
                              className="block p-2.5 rounded-lg hover:bg-[#315243] transition-colors text-sm font-medium text-[#6B5A64] hover:text-white"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="p-4 text-center text-sm text-gray-500">No categories found</div>
                  )}
                </div>
              )}
            </div>

            <Link href="/gift-card" prefetch={true} className="px-3 py-2 text-white/90 hover:text-white transition-colors rounded-lg hover:bg-white/10 font-medium text-base">
              Gift Card
            </Link>
            
            <Link href="/about" prefetch={true} className="px-3 py-2 text-white/90 hover:text-white transition-colors rounded-lg hover:bg-white/10 font-medium text-base">
              About Us
            </Link>

            <Link href="/contact" prefetch={true} className="px-3 py-2 text-white/90 hover:text-white transition-colors rounded-lg hover:bg-white/10 font-medium text-base">
              Contact Us
            </Link>

          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Desktop Auth */}
            <div className="hidden lg:flex items-center gap-2 mr-2">
              {status === "loading" ? (
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
              ) : session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-opacity-80 p-0 overflow-hidden">
                      {session.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user?.name || "Profile"}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover rounded-full"
                          priority
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-[#315243] text-white text-lg font-semibold">
                          {session.user?.name?.charAt(0)?.toUpperCase() || session.user?.email?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session.user?.name || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user?.email}
                        </p>
                        {session.user?.role === "SUPER_ADMIN" && (
                          <Badge className="mt-2 w-fit bg-[#315243] hover:bg-[#1A3026]">Super Admin</Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isStaff && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="w-full cursor-pointer hover:text-[#49A389] font-medium">
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isCustomer && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/profile" className="w-full cursor-pointer hover:text-[#315243] font-medium">
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/profile/billing" className="w-full cursor-pointer hover:text-[#315243] font-medium">
                            Update Billing Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/profile/orders" className="w-full cursor-pointer hover:text-[#315243] font-medium">
                            Orders
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                      onClick={() => {
                        void handleLogout();
                      }}
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link href="/sign-in" className="px-4 py-2 text-white/90 hover:text-white font-medium text-sm transition-colors">
                    Sign In
                  </Link>
                  <Link href="/sign-up" className="px-4 py-2 bg-white text-[#1A3026] hover:bg-white/90 rounded-full font-medium text-sm transition-colors">
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            <div className="flex h-10 items-center">
              <LanguageSwitcher />
            </div>

            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-10 w-10 sm:flex items-center justify-center hover:bg-white/10"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="w-5 h-5 text-white/80" />
            </Button>

            {/* Cart Button */}
            <Button
              variant="ghost"
              className="relative h-10 rounded-full border border-white/10 bg-white/5 px-3 hover:bg-white/10"
              onClick={openCart}
            >
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white/80" />
                {mounted && displayItemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-[#9B854A] text-white text-xs">
                      {displayItemCount}
                    </Badge>
                  )}
                </div>

                <span className="whitespace-nowrap text-sm font-medium leading-none text-white/90">
                  {mounted ? formattedCartTotal : "LKR 0"}
                </span>
              </div>
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-hidden={isMobileMenuOpen}
                  className={cn(
                    "lg:hidden hover:bg-[#FDF9E8] transition-opacity duration-200",
                    isMobileMenuOpen && "opacity-0 pointer-events-none"
                  )}
                >
                  <Menu className="w-5 h-5 text-white/90" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <MobileNav onClose={() => setIsMobileMenuOpen(false)} onLogout={handleLogout} />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Search Bar (Expandable) */}
        {isSearchOpen && (
          <div className="pb-4 animate-slide-up">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                placeholder="Search for shirts, dresses, trousers..."
                className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#9B854A] focus:ring-[#9B854A]/20"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function MobileNav({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) {
  const { getItemCount } = useCartStore();
  const { data: session, status } = useSession();
  const isCustomer = session?.user?.role === "USER";
  const isStaff = Boolean(session?.user?.role) && !isCustomer;

  return (
    <div className="flex flex-col h-full bg-[#1A3026]">
      {/* Header */}
      <div className="relative flex h-20 items-center border-b border-white/5 px-4 pr-14">
        <Link href="/" onClick={onClose} className="flex items-center">
          <Image 
            src="/logo/logo.png?v=1.2" 
            alt="Skyish & Earthly Logo" 
            width={240}
            height={84}
            className="object-contain h-14 w-auto drop-shadow-[0_0_8px_rgba(155,133,74,0.3)]"
            unoptimized
          />
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {/* Navigation Links */}
        <div className="space-y-1 mb-6">
          <Link href="/" onClick={onClose} className="block px-4 py-3 text-white/90 font-medium text-lg rounded-xl hover:bg-white/10 transition-colors">Home</Link>
          <Link href="/categories" prefetch={true} onClick={onClose} className="block px-4 py-3 text-white/90 font-medium text-lg rounded-xl hover:bg-white/10 transition-colors">Collections</Link>
          <Link href="/gift-card" prefetch={true} onClick={onClose} className="block px-4 py-3 text-white/90 font-medium text-lg rounded-xl hover:bg-white/10 transition-colors">Gift Card</Link>
          <Link href="/about" prefetch={true} onClick={onClose} className="block px-4 py-3 text-white/90 font-medium text-lg rounded-xl hover:bg-white/10 transition-colors">About Us</Link>
          <Link href="/contact" prefetch={true} onClick={onClose} className="block px-4 py-3 text-white/90 font-medium text-lg rounded-xl hover:bg-white/10 transition-colors">Contact Us</Link>
        </div>

        {/* Auth Links */}
        <div className="flex flex-col gap-3 mb-6">
          {status === "loading" ? (
             <div className="h-16 w-full bg-gray-100 animate-pulse rounded-xl" />
          ) : session ? (
            <div className="bg-[#315243]/10 p-4 rounded-xl border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#315243] text-white font-medium">
                  {session.user?.name?.charAt(0)?.toUpperCase() || session.user?.email?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[#1F1720] truncate">{session.user?.name || "User"}</p>
                  <p className="text-xs text-[#6B5A64] truncate">{session.user?.email}</p>
                  {session.user?.role === "SUPER_ADMIN" && (
                    <Badge className="mt-1 bg-[#315243] text-[10px] h-4">Super Admin</Badge>
                  )}
                </div>
              </div>

              {isStaff && (
                <Link 
                  href="/admin" 
                  onClick={onClose} 
                  className="flex w-full items-center justify-center p-2 mb-3 bg-white text-[#315243] border border-[#315243]/20 rounded-lg text-sm font-semibold hover:bg-[#F4FAF8] transition-colors"
                >
                  Admin Panel
                </Link>
              )}

              <Button 
                variant="outline" 
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                onClick={() => {
                  void onLogout();
                  onClose();
                }}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link
                href="/sign-in"
                onClick={onClose}
                className="flex-1 flex items-center justify-center p-3 text-white border border-white/20 rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                onClick={onClose}
                className="flex-1 flex items-center justify-center p-3 bg-[#9B854A] text-white rounded-xl font-semibold hover:bg-[#8A7642] transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Language Selection */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-[#6B5A64] uppercase tracking-wider mb-3 block px-4">Change Language</label>
          <div className="bg-[#315243]/5 rounded-xl p-2 border border-white/10 mx-2">
            <LanguageSwitcher />
          </div>
        </div>

      </div>
    </div>
  );
}
