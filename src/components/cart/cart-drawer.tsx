"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Minus, ShoppingBag, Sparkles } from "lucide-react";
import { useEffect } from "react";

export function CartDrawer() {
  const {
    items,
    isCartOpen,
    closeCart,
    removeItem,
    updateQuantity,
    addItem,
    specialTouchProducts,
    getSubtotal,
    getItemCount,
  } = useCartStore();

  const subtotal = getSubtotal();
  const itemCount = getItemCount();

  const productIdsInCart = useMemo(() => {
    return new Set(
      items.flatMap((item) => (item.type === "product" && item.product?.id ? [item.product.id] : []))
    );
  }, [items]);

  const specialTouchItems = useMemo(() => {
    return specialTouchProducts
      .filter((product) => product.stock > 0 && !productIdsInCart.has(product.id))
      .slice(0, 4);
  }, [productIdsInCart, specialTouchProducts]);

  useEffect(() => {
    console.log("[CartDrawer] specialTouchProducts", {
      total: specialTouchProducts.length,
      ids: specialTouchProducts.map((product) => product.id),
      inCart: Array.from(productIdsInCart),
      visible: specialTouchItems.map((product) => product.id),
    });
  }, [productIdsInCart, specialTouchItems, specialTouchProducts]);

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

  return (
    <Sheet open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#315243]" />
            Your Cart
            {itemCount > 0 && <span className="text-sm font-normal text-[#6B5A64]">({itemCount} items)</span>}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#FDF9E8]">
              <ShoppingBag className="h-10 w-10 text-[#315243]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1F1720]">Your cart is empty</h3>
            <p className="mt-1 mb-6 text-[#6B5A64]">Start shopping to add items to your cart</p>
            <Button onClick={closeCart} asChild className="bg-[#315243] hover:bg-[#1A3026]">
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-4 py-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 rounded-xl bg-[#FDF9E8]/80 p-3 shadow-sm border border-[#9B854A]/10">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-white">
                      <Image
                        src={getItemImage(item) || "/placeholder.jpg"}
                        alt={getItemName(item) || "Product"}
                        fill
                        className="object-cover"
                      />
                      {item.type === "custombox" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Sparkles className="h-6 w-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="line-clamp-1 font-medium text-[#1F1720]">{getItemName(item)}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0 text-[#6B5A64] hover:text-red-500"
                          onClick={() => removeItem(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {item.selectedVariant && <p className="text-xs text-[#6B5A64]">{item.selectedVariant.name}</p>}
                      {item.type === "custombox" && item.customBox && (
                        <p className="text-xs text-[#6B5A64]">
                          {item.customBox.items.length} items • {item.customBox.boxType.name}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 border-brand-border"
                            onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 border-brand-border"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-semibold text-[#315243]">{formatPrice(item.subtotal)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {specialTouchItems.length > 0 ? (
                <div className="border-t border-brand-border py-4">
                  <h4 className="mb-3 text-sm font-semibold text-[#1F1720]">Special Touch</h4>
                  <div className="space-y-2">
                    {specialTouchItems.map((product) => {
                      const displayPrice =
                        typeof product.salePrice === "number" && product.salePrice < product.price
                          ? product.salePrice
                          : product.price;

                      return (
                        <div key={product.id} className="flex items-center gap-3 rounded-lg border border-brand-border bg-white p-2">
                          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-[#FDF9E8]">
                            <Image src={product.images[0] || "/logo/logo.png"} alt={product.name} fill className="object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-sm font-medium text-[#1F1720]">{product.name}</p>
                            <p className="text-xs text-[#6B5A64]">{formatPrice(displayPrice)}</p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="bg-[#315243] px-3 text-xs hover:bg-[#1A3026]"
                            onClick={() => addItem(product)}
                          >
                            + Add
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </ScrollArea>

            <SheetFooter className="border-t border-brand-border p-6 pt-4">
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B5A64]">Subtotal</span>
                    <span className="font-medium text-[#1F1720]">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B5A64]">Delivery</span>
                    <span className="text-[#315243]">Calculated at checkout</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#1F1720]">Total</span>
                    <span className="text-lg font-bold text-[#315243]">{formatPrice(subtotal)}</span>
                  </div>
                </div>
                <Button asChild className="w-full bg-[#315243] text-white hover:bg-[#1A3026]" onClick={closeCart}>
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
                <Button asChild variant="outline" className="w-full border-brand-border" onClick={closeCart}>
                  <Link href="/cart">View Full Cart</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full text-[#6B5A64]" onClick={closeCart}>
                  <Link href="/">Continue Shopping</Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
