"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header, Footer, CartDrawer } from "@/components/giftbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store";
import { 
  ArrowLeft, 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  Sparkles,
  Truck,
  Shield
} from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, addItem, specialTouchProducts, getSubtotal, getItemCount } = useCartStore();
  const subtotal = getSubtotal();
  const itemCount = getItemCount();

  const productIdsInCart = useMemo(() => {
    return new Set(items.flatMap((item) => (item.type === "product" && item.product?.id ? [item.product.id] : [])));
  }, [items]);

  const specialTouchItems = useMemo(() => {
    return specialTouchProducts
      .filter((product) => product.stock > 0 && !productIdsInCart.has(product.id))
      .slice(0, 4);
  }, [productIdsInCart, specialTouchProducts]);

  const formatPrice = (price: number) => `LKR ${price.toLocaleString()}`;

  const getItemName = (item: typeof items[0]) => {
    if (item.type === "product") return item.product?.name;
    if (item.type === "giftbox") return item.giftBox?.name;
    return "Custom Gift Box";
  };

  const getItemImage = (item: typeof items[0]) => {
    if (item.type === "product") return item.product?.images[0];
    if (item.type === "giftbox") return item.giftBox?.images[0];
    return "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=100&h=100&fit=crop";
  };

  const getItemDescription = (item: typeof items[0]) => {
    if (item.type === "product") return item.product?.shortDescription;
    if (item.type === "giftbox") return item.giftBox?.shortDescription;
    if (item.type === "custombox" && item.customBox) {
      return `${item.customBox.items.length} items • ${item.customBox.boxType.name}`;
    }
    return "";
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <CartDrawer />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-[#315243]/10 flex items-center justify-center mb-6">
              <ShoppingBag className="w-12 h-12 text-[#315243]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1F1720]">Your cart is empty</h1>
            <p className="text-[#6B5A64] mt-2 mb-6">Start shopping to add items to your cart</p>
            <div className="flex justify-center">
              <Button asChild className="bg-[#315243] hover:bg-[#1A3026] px-8 py-6 rounded-full text-lg shadow-lg transition-transform hover:scale-105">
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartDrawer />
      
      <main className="flex-1">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10 py-6">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center gap-2 text-[#6B5A64] hover:text-[#315243] mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1F1720]">
              Your Cart
              <span className="text-lg font-normal text-[#6B5A64] ml-2">({itemCount} items)</span>
            </h1>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="border-brand-border overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex gap-4">
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-[#315243]/10 flex-shrink-0">
                        <Image
                          src={getItemImage(item) || "/placeholder.jpg"}
                          alt={getItemName(item) || "Product"}
                          fill
                          className="object-cover"
                        />
                        {item.type === "custombox" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Sparkles className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link 
                              href={item.type === "product" && item.product ? `/products/${item.product.id}` : "#"}
                              className="font-semibold text-[#1F1720] hover:text-[#315243] transition-colors"
                            >
                              {getItemName(item)}
                            </Link>
                            {item.selectedVariant && (
                              <p className="text-sm text-[#6B5A64]">{item.selectedVariant.name}</p>
                            )}
                            <p className="text-sm text-[#6B5A64] mt-1">{getItemDescription(item)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-[#6B5A64] hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="w-9 h-9 border-brand-border"
                              onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-10 text-center font-medium text-[#1F1720]">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="w-9 h-9 border-brand-border"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <span className="text-lg font-bold text-[#315243]">
                            {formatPrice(item.subtotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add-ons Suggestion */}
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-[#1F1720] mb-4">Add a special touch</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {specialTouchItems.map((product) => {
                    const displayPrice = typeof product.salePrice === "number" && product.salePrice < product.price ? product.salePrice : product.price;

                    return (
                      <div key={product.id} className="rounded-xl bg-white border border-brand-border p-3 text-center group">
                        <button
                          type="button"
                          onClick={() => addItem(product)}
                          className="w-full"
                        >
                          <div className="relative w-16 h-16 mx-auto rounded-lg overflow-hidden bg-[#315243]/10 mb-2">
                            <Image src={product.images[0] || "/logo/logo.png"} alt={product.name} fill className="object-cover" />
                          </div>
                          <p className="text-sm font-medium text-[#1F1720] line-clamp-1 group-hover:text-[#315243]">
                            {product.name}
                          </p>
                          <p className="text-sm text-[#315243] font-semibold">{formatPrice(displayPrice)}</p>
                          <span className="mt-2 inline-flex rounded-full bg-[#315243]/10 px-3 py-1 text-xs font-semibold text-[#315243]">
                            + Add
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-brand-border">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-[#1F1720] mb-4">Order Summary</h2>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#6B5A64]">Subtotal ({itemCount} items)</span>
                      <span className="text-[#1F1720]">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B5A64]">Delivery</span>
                      <span className="text-[#315243]">Calculated at checkout</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-semibold">
                      <span className="text-[#1F1720]">Total</span>
                      <span className="text-[#315243]">{formatPrice(subtotal)}</span>
                    </div>
                  </div>

                  <Button
                    asChild
                    className="w-full mt-6 bg-[#315243] hover:bg-[#1A3026] text-white shadow-lg shadow-[#315243]/20"
                    size="lg"
                  >
                    <Link href="/checkout">Proceed to Checkout</Link>
                  </Button>

                  {/* Trust Badges */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-[#6B5A64]">
                      <Truck className="w-4 h-4 text-[#315243]" />
                      <span>Island-wide delivery</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#6B5A64]">
                      <Shield className="w-4 h-4 text-[#315243]" />
                      <span>Secure checkout</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
