"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store";
import type { Product } from "@/types";

type ProductImage = {
  url: string;
  isMain?: boolean;
  color?: string;
};

type ProductVariant = {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  image?: string;
};

type DetailProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sizes: string[];
  colors: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  category: { name: string; slug: string } | null;
  occasions: { id: string; name: string; slug: string }[];
  boxItems: { itemId: string; itemName: string; quantity: number }[];
};

function toCartProduct(product: DetailProduct): Product {
  return {
    id: product.id,
    slug: product.id,
    name: product.name,
    description: product.description || "",
    shortDescription: product.description?.slice(0, 120) || "",
    price: product.price,
    images: product.images.map((image) => image.url),
    categoryId: product.category?.slug || "uncategorized",
    occasionIds: product.occasions.map((occasion) => occasion.id),
    tags: [],
    inStock: product.stock > 0,
    sizes: product.sizes,
    colors: product.colors,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      price: variant.price,
      inStock: variant.inStock,
    })),
  } as Product;
}

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

export function ProductDetailClient({ product }: { product: DetailProduct }) {
  const { data: session, status } = useSession();
  const mainImageIndex = Math.max(
    0,
    product.images.findIndex((image) => image.isMain)
  );

  const [selectedImage, setSelectedImage] = useState(mainImageIndex);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || "");
  const [quantity, setQuantity] = useState(1);

  const { addItem, openCart } = useCartStore();

  // Update image when variant or color selection changes
  useEffect(() => {
    // 1. First priority: Check if any product image is specifically tagged with this color
    if (selectedColor) {
      const colorImageIndex = product.images.findIndex(
        (img) => img.color?.toLowerCase() === selectedColor.toLowerCase()
      );
      if (colorImageIndex >= 0) {
        setSelectedImage(colorImageIndex);
        return;
      }
    }

    // 2. Second priority: Check if the specific variant has an image
    const matchingVariant = product.variants.find((variant) => {
      const lower = variant.name.toLowerCase();
      const sizeMatch = selectedSize ? lower.includes(selectedSize.toLowerCase()) : true;
      const colorMatch = selectedColor ? lower.includes(selectedColor.toLowerCase()) : true;
      return sizeMatch && colorMatch;
    });

    if (matchingVariant?.image) {
      const variantImageIndex = product.images.findIndex(
        (img) => img.url === matchingVariant.image
      );
      if (variantImageIndex >= 0) {
        setSelectedImage(variantImageIndex);
        return;
      }
    }

    // 3. Fallback: Only reset if we are intentionally resetting or initial load (optional)
    // But here we might want to stay on the current image if nothing better is found.
    // However, for consistency with variant selection, fallback to main is often expected.
  }, [selectedSize, selectedColor, product.variants, product.images]);

  useEffect(() => {
    if (typeof window === "undefined" || status === "loading") return;

    const userId = session?.user?.id;
    const storageKey = userId ? `recentlyViewed:${userId}` : "recentlyViewed:guest";

    const current = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url || "/logo/logo.png",
    };

    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];

      const unique = list.filter((item: any) => item && item.id !== current.id);
      const next = [current, ...unique].slice(0, 10);

      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      window.localStorage.setItem(storageKey, JSON.stringify([current]));
    }
  }, [product.id, product.images, product.name, product.price, session?.user?.id, status]);

  const filteredVariants = useMemo(() => {
    if (product.variants.length === 0) return [];

    return product.variants.filter((variant) => {
      const lower = variant.name.toLowerCase();
      const sizeMatch = selectedSize ? lower.includes(selectedSize.toLowerCase()) : true;
      const colorMatch = selectedColor ? lower.includes(selectedColor.toLowerCase()) : true;
      return sizeMatch && colorMatch;
    });
  }, [product.variants, selectedSize, selectedColor]);

  const selectedVariant = filteredVariants[0] || product.variants[0];
  const currentPrice = selectedVariant?.price || product.price;
  const inStock = selectedVariant ? selectedVariant.inStock : product.stock > 0;

  const handleAddToCart = () => {
    const cartProduct = toCartProduct(product);
    addItem(cartProduct, quantity, selectedVariant?.id);
    openCart();
  };

  return (
    <div className="space-y-8">
      <nav className="text-sm text-[#6B5A64]">
        <Link href="/" className="hover:text-[#A7066A]">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/categories" className="hover:text-[#A7066A]">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-[#1F1720]">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 2xl:grid-cols-[1.08fr_0.92fr] gap-10 2xl:gap-14">
        <section className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-brand-border bg-[#FCEAF4] transition-all duration-300">
            <Image
              src={product.images[selectedImage]?.url || "/logo/logo.png"}
              alt={product.name}
              fill
              className="object-cover transition-opacity duration-300"
              priority
            />
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {product.images.map((image, index) => (
                <button
                  key={`${image.url}-${index}`}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 ${
                    selectedImage === index ? "border-[#A7066A]" : "border-brand-border"
                  }`}
                >
                  <Image src={image.url} alt={`${product.name} image ${index + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1F1720]">{product.name}</h1>
            {product.occasions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {product.occasions.map((occasion) => (
                  <Badge key={occasion.id} variant="secondary" className="bg-[#FCEAF4] text-[#A7066A] border-0">
                    {occasion.name}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 mt-3">
              <span className="text-3xl font-bold text-[#A7066A]">LKR {currentPrice.toLocaleString()}</span>
              {inStock ? (
                <Badge className="bg-green-100 text-green-700 border-0">In Stock</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700 border-0">Out of Stock</Badge>
              )}
            </div>
          </div>

          {product.sizes.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-[#1F1720] mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-2 rounded-lg border text-sm ${
                      selectedSize === size ? "border-[#A7066A] text-[#A7066A] bg-[#FCEAF4]" : "border-brand-border"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-[#1F1720] mb-3">Color</p>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => {
                  const image = product.images.find(
                    (img) => img.color?.toLowerCase() === color.toLowerCase()
                  );
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color);
                        if (image) {
                          const idx = product.images.findIndex((img) => img.url === image.url);
                          if (idx >= 0) setSelectedImage(idx);
                        }
                      }}
                      className={cn(
                        "w-8 h-8 rounded-full border border-brand-border transition-all hover:scale-110",
                        selectedColor === color ? "ring-2 ring-[#A7066A] ring-offset-2" : ""
                      )}
                      style={{ backgroundColor: resolveColor(color) }}
                      title={color}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-[#1F1720] mb-2">Quantity</p>
            <div className="inline-flex items-center border border-brand-border rounded-xl overflow-hidden">
              <Button variant="ghost" size="icon" className="rounded-none" onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}>
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-12 text-center font-semibold">{quantity}</span>
              <Button variant="ghost" size="icon" className="rounded-none" onClick={() => setQuantity((prev) => prev + 1)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={!inStock}
            className="w-full h-12 text-base bg-[#A7066A] hover:bg-[#8A0558] disabled:opacity-50"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Add to Cart
          </Button>

          <div className="prose prose-sm max-w-none text-[#3A2B35] border-t border-brand-border pt-6">
            <ReactMarkdown>{product.description || "No description available."}</ReactMarkdown>
          </div>

          {product.boxItems.length > 0 ? (
            <div className="rounded-2xl border border-brand-border bg-[#FFF7FB] p-4">
              <h2 className="text-base font-bold text-[#1F1720]">🎁 This Box Includes:</h2>
              <ul className="mt-3 space-y-2 text-sm text-[#3A2B35]">
                {product.boxItems.map((entry) => (
                  <li key={entry.itemId} className="flex items-center justify-between rounded-lg border border-[#F1DFE8] bg-white px-3 py-2">
                    <span>{entry.itemName}</span>
                    <Badge className="border-0 bg-[#FCEAF4] text-[#A7066A]">Qty {entry.quantity}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
