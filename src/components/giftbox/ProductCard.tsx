"use client";

import { memo, useState, useEffect } from "react";
import Image from "next/image";
import { ShoppingCart, Heart, Star, Sparkles, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types";
import { useCartStore } from "@/store";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { useCartDrawer } from "@/hooks/use-cart-drawer";

const COLOR_NAME_MAP: Record<string, string> = {
  "rose gold": "#B76E79",
  "gold": "#D4AF37",
  "silver": "#C0C0C0",
  "navy": "#000080",
  "emerald": "#50C878",
};

function resolveColor(colorName: string): string {
  const lower = colorName.toLowerCase();
  return COLOR_NAME_MAP[lower] || lower;
}

interface ProductCardProps {
  product: Product;
  variant?: "default" | "compact" | "horizontal";
  showAddToCart?: boolean;
  ctaMode?: "default" | "byob";
}

function ProductCardComponent({
  product,
  variant = "default",
  showAddToCart = true,
  ctaMode = "default",
}: ProductCardProps) {
  const { addItem, openCart } = useCartStore();

  const discountFromPrices = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const discount = discountFromPrices;

  const hasDiscount = discount > 0 && Boolean(product.originalPrice);
  const badge = hasDiscount
    ? { label: `-${discount}%`, className: "bg-[#FF4757] text-white border-0 shadow-sm" }
    : product.isNew || product.isNewArrival
      ? { label: "New", className: "bg-[#CFB53B] text-white border-0 shadow-sm" }
      : product.isTrending
        ? { label: "Trending", className: "bg-[#F78C2D] text-white border-0 shadow-sm" }
        : null;

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    // Reset selected image when product changes
    setSelectedImage(null);
  }, [product.id]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    openCart();
  };

  const displayImage = selectedImage || product.images[0];

  const formatPrice = (price: number) => {
    return `LKR ${price.toLocaleString()}`;
  };

  if (variant === "horizontal") {
    return (
      <Link
        href={`/products/${product.id}`}
        className="flex gap-4 p-3 bg-white rounded-xl border border-brand-border hover:shadow-md transition-all group"
      >
        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-[#F4FAF8]">
          <Image
            src={displayImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {hasDiscount && (
            <Badge className="absolute top-1 left-1 bg-[#FF4757] text-white border-0 text-[10px] px-1.5 py-0.5">-{discount}%</Badge>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[#1F1720] truncate group-hover:text-[#315243] transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-[#6B5A64] line-clamp-1 mt-0.5">{product.shortDescription}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-semibold text-[#315243]">{formatPrice(product.price)}</span>
            {hasDiscount && product.originalPrice && (
              <span className="text-sm text-[#6B5A64] line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        href={`/products/${product.id}`}
        className="block bg-white rounded-xl border border-brand-border hover:shadow-md transition-all overflow-hidden group"
      >
        <div className="relative aspect-square bg-[#F4FAF8] overflow-hidden">
          <Image
            src={displayImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
            <Badge className="absolute top-2 left-2 bg-[#CFB53B] text-white border-0">
              <Star className="w-3 h-3 mr-1" /> Best Seller
            </Badge>
          {discount > 0 && (
            <Badge className="absolute top-2 right-2 bg-[#FF4757] text-white border-0">-{discount}%</Badge>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm text-[#1F1720] truncate group-hover:text-[#315243] transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-semibold text-sm text-[#315243]">{formatPrice(product.price)}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="group bg-white rounded-2xl border border-brand-border hover:shadow-lg transition-all overflow-hidden">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square bg-[#F4FAF8] overflow-hidden">
          <Image
            src={displayImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Badges */}
          {badge ? (
            <div className="absolute top-3 left-3">
              <Badge className={badge.className}>{badge.label}</Badge>
            </div>
          ) : null}

          {/* Wishlist */}
          <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-[#315243]">
            <Heart className="w-4 h-4" />
          </button>
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-[#1F1720] group-hover:text-[#315243] transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-[#6B5A64] mt-1 line-clamp-2">{product.shortDescription}</p>
        
        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mt-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-3.5 h-3.5",
                    i < Math.floor(product.rating!)
                      ? "text-[#FFD93D] fill-[#FFD93D]"
                      : "text-[#EBC9DB]"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-[#6B5A64]">({product.reviewCount})</span>
          </div>
        )}

        {/* Color Swatches */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            {product.colors.map((color) => {
              const imageUrl = product.colorImages?.[color.toLowerCase()];
              return (
                <button
                  key={color}
                  type="button"
                  onMouseEnter={() => imageUrl && setSelectedImage(imageUrl)}
                  onMouseLeave={() => setSelectedImage(null)}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (imageUrl) setSelectedImage(imageUrl);
                  }}
                  className={cn(
                    "w-6 h-6 rounded-full border border-brand-border transition-all hover:scale-110",
                    (selectedImage === imageUrl && imageUrl) ? "ring-2 ring-[#315243] ring-offset-2" : ""
                  )}
                  style={{ backgroundColor: resolveColor(color) }}
                  title={color}
                />
              );
            })}
          </div>
        )}

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-lg font-bold text-[#315243]">{formatPrice(product.price)}</span>
            {hasDiscount && product.originalPrice && (
              <span className="text-sm text-[#6B5A64] line-through ml-2">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          {showAddToCart && (
            ctaMode === "byob" ? (
              <Button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="rounded-full bg-[#315243] px-4 text-white hover:bg-[#315243/90]"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add to Box
              </Button>
            ) : product.inStock ? (
              <Button
                onClick={handleAddToCart}
                className="rounded-full bg-[#315243] px-4 text-white hover:bg-[#315243/90]"
              >
                <ShoppingCart className="mr-1 h-4 w-4" />
                Add to Cart
              </Button>
            ) : (
              <Button asChild variant="outline" className="rounded-full border-brand-border px-4 text-[#1F1720]">
                <Link href={`/products/${product.id}`}>
                  <Eye className="mr-1 h-4 w-4" />
                  View
                </Link>
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export const ProductCard = memo(ProductCardComponent);
