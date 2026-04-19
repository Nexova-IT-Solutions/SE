"use client";

import { useEffect } from "react";
import type { SpecialTouchProduct } from "@/lib/special-touch";
import { useCartStore } from "@/store";

type CartStoreHydratorProps = {
  specialTouchProducts: SpecialTouchProduct[];
};

export function CartStoreHydrator({ specialTouchProducts }: CartStoreHydratorProps) {
  const setSpecialTouchProducts = useCartStore((state) => state.setSpecialTouchProducts);

  useEffect(() => {
    setSpecialTouchProducts(specialTouchProducts);
  }, [setSpecialTouchProducts, specialTouchProducts]);

  return null;
}