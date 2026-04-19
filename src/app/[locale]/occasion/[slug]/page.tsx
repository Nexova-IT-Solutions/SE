"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Header, Footer, CartDrawer, ProductCard, SectionHeading } from "@/components/giftbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getOccasionBySlug, getProductsByOccasion, occasions } from "@/data";
import { useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";

export default function OccasionPage() {
  const params = useParams();
  const slug = params.slug as string;
  const occasion = getOccasionBySlug(slug);
  
  const [sortBy, setSortBy] = useState("featured");

  if (!occasion) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <CartDrawer />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#315243]">Coming Soon!</h1>
            <p className="text-[#6B5A64] mt-3 text-lg">We&apos;re currently curating the perfect collection for this occasion.</p>
            <Button asChild className="mt-8 bg-[#315243] hover:bg-[#315243]/90 text-white px-8 py-6 rounded-full text-lg shadow-lg transition-all hover:scale-105">
              <Link href="/">Explore Collections</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const products = getProductsByOccasion(occasion.id);

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartDrawer />
      
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10 py-4">
          <nav className="flex items-center gap-2 text-sm text-[#6B5A64]">
            <Link href="/" className="hover:text-[#A7066A]">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/#occasions" className="hover:text-[#A7066A]">Occasions</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#1F1720]">{occasion.name}</span>
          </nav>
        </div>

        {/* Occasion Header */}
        <div className="relative h-48 sm:h-64 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${occasion.image})` }}
          />
          <div 
            className="absolute inset-0"
            style={{ 
              background: `linear-gradient(to top, ${occasion.color || '#A7066A'}CC, transparent)` 
            }}
          />
          <div className="relative h-full max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10 flex flex-col justify-end pb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">{occasion.name} Gifts</h1>
            {occasion.description && (
              <p className="text-white/90 mt-2 max-w-xl">{occasion.description}</p>
            )}
            <p className="text-white/70 text-sm mt-2">{products.length} gifts available</p>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10 py-8">
          {/* Quick Actions */}
          <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-[#A7066A]/10 to-[#E91E8C]/10 border border-[#A7066A]/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-[#1F1720]">Can&apos;t find what you&apos;re looking for?</h3>
                <p className="text-sm text-[#6B5A64]">Build your own custom gift box</p>
              </div>
              <Button asChild className="bg-gradient-to-r from-[#315243] to-[#4a6b5a] text-white rounded-full">
                <Link href="/box-builder">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Build Your Box
                </Link>
              </Button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-brand-border">
            <p className="text-sm text-[#6B5A64]">
              Showing <span className="font-medium text-[#1F1720]">{sortedProducts.length}</span> gifts
            </p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] border-brand-border">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          {sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-[#315243] mb-2">Coming Soon!</h2>
              <p className="text-[#6B5A64]">We&apos;re currently curating the perfect products for this occasion. Check back soon!</p>
              <Button asChild className="mt-6 bg-[#315243]">
                <Link href="/box-builder">Explore Other Collections</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Other Occasions */}
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10 py-8 border-t border-brand-border">
          <SectionHeading title="Browse Other Occasions" />
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {occasions.filter(o => o.id !== occasion.id).map((occ) => (
              <Link
                key={occ.id}
                href={`/occasion/${occ.slug}`}
                className="flex-shrink-0 w-36"
              >
                <div className="flex flex-col items-center p-4 rounded-xl bg-white border border-brand-border hover:border-[#A7066A] hover:shadow-md transition-all text-center">
                  <div 
                    className="w-14 h-14 rounded-full bg-cover bg-center mb-3"
                    style={{ backgroundImage: `url(${occ.image})` }}
                  />
                  <span className="text-sm font-medium text-[#1F1720]">{occ.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
