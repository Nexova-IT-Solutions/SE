import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product, CustomBox, GiftBox } from "@/types";
import type { SpecialTouchProduct } from "@/lib/special-touch";

interface CartState {
  items: CartItem[];
  specialTouchProducts: SpecialTouchProduct[];
  isCartOpen: boolean;
  
  // Actions
  addItem: (product: Product, quantity?: number, variantId?: string) => void;
  addGiftBox: (giftBox: GiftBox, quantity?: number) => void;
  addCustomBox: (customBox: CustomBox, quantity?: number) => void;
  setSpecialTouchProducts: (products: SpecialTouchProduct[]) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  
  // Computed
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      specialTouchProducts: [],
      isCartOpen: false,

      addItem: (product: Product, quantity = 1, variantId?: string) => {
        const { items } = get();
        const variant = variantId 
          ? product.variants?.find(v => v.id === variantId) 
          : undefined;
        
        const existingItem = items.find(
          item => item.product?.id === product.id && item.selectedVariant?.id === variantId
        );

        if (existingItem) {
          set({
            items: items.map(item =>
              item.id === existingItem.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          const price = variant?.price || product.salePrice || product.price;
          const newItem: CartItem = {
            id: `${product.id}${variantId ? `-${variantId}` : ''}`,
            type: "product",
            product,
            quantity,
            selectedVariant: variant,
            subtotal: price * quantity,
          };
          set({ items: [...items, newItem] });
        }
      },

      addGiftBox: (giftBox: GiftBox, quantity = 1) => {
        const { items } = get();
        const existingItem = items.find(item => item.giftBox?.id === giftBox.id);

        if (existingItem) {
          set({
            items: items.map(item =>
              item.id === existingItem.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          const newItem: CartItem = {
            id: `giftbox-${giftBox.id}`,
            type: "giftbox",
            giftBox,
            quantity,
            subtotal: giftBox.price * quantity,
          };
          set({ items: [...items, newItem] });
        }
      },

      addCustomBox: (customBox: CustomBox, quantity = 1) => {
        const { items } = get();
        const id = `custombox-${Date.now()}`;
        
        // Calculate total price
        const itemsTotal = customBox.items.reduce(
          (sum, item) => sum + item.item.price * item.quantity,
          0
        );
        const wrappingTotal = customBox.wrapping?.price || 0;
        const noteTotal = customBox.noteStyle?.price || 0;
        const total = (customBox.boxType.basePrice + itemsTotal + wrappingTotal + noteTotal) * quantity;

        const newItem: CartItem = {
          id,
          type: "custombox",
          customBox,
          quantity,
          subtotal: total,
        };
        set({ items: [...items, newItem] });
      },

      setSpecialTouchProducts: (products: SpecialTouchProduct[]) => {
        set({ specialTouchProducts: products });
      },

      removeItem: (itemId: string) => {
        set(state => ({
          items: state.items.filter(item => item.id !== itemId),
        }));
      },

      updateQuantity: (itemId: string, quantity: number) => {
        set(state => ({
          items: state.items.map(item => {
            if (item.id === itemId) {
              let price = 0;
              if (item.type === "product") {
                price = item.selectedVariant?.price || item.product?.salePrice || item.product?.price || 0;
              } else if (item.type === "giftbox") {
                price = item.giftBox?.price || 0;
              } else if (item.type === "custombox" && item.customBox) {
                const itemsTotal = item.customBox.items.reduce(
                  (sum, i) => sum + i.item.price * i.quantity,
                  0
                );
                price = item.customBox.boxType.basePrice + itemsTotal + 
                  (item.customBox.wrapping?.price || 0) + 
                  (item.customBox.noteStyle?.price || 0);
              }
              return { ...item, quantity, subtotal: price * quantity };
            }
            return item;
          }),
        }));
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set(state => ({ isCartOpen: !state.isCartOpen })),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.subtotal, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "giftbox-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
