"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { uploadFile } from "@/utils/supabase";
import { Camera, Check, ChevronsUpDown, Package, RefreshCw, Star, Tag, Trash2, X } from "lucide-react";

const MarkdownEditor = dynamic(() => import("@/components/ui/markdown-editor"), { ssr: false });

const REQUIRED_FIELD_MESSAGE = "This field is required.";

const productFormSchema = z.object({
  name: z.string().trim().min(1, REQUIRED_FIELD_MESSAGE),
  sku: z.string().trim().min(1, REQUIRED_FIELD_MESSAGE),
  categoryId: z.string().trim().min(1, REQUIRED_FIELD_MESSAGE),
  price: z
    .string()
    .trim()
    .min(1, REQUIRED_FIELD_MESSAGE)
    .refine((value) => Number(value) > 0, "Price must be greater than 0"),
  stock: z
    .string()
    .trim()
    .min(1, REQUIRED_FIELD_MESSAGE)
    .refine((value) => Number.isInteger(Number(value)) && Number(value) >= 0, "Stock must be a valid whole number"),
  moodIds: z.array(z.string().trim()).default([]),
});

type ProductImageData = {
  url: string;
  color?: string;
  isMain?: boolean;
};

type StagedImageData = ProductImageData & { file?: File; previewUrl?: string };

type VariantData = {
  size: string;
  color: string;
  price: number;
  stock: number;
};

type CategoryData = {
  id: string;
  name: string;
  slug?: string;
};

type OccasionData = {
  id: string;
  name: string;
};

type RecipientData = {
  id: string;
  name: string;
  slug?: string;
};

type MoodData = {
  id: string;
  name: string;
  icon?: string | null;
};

type DiscountData = {
  id: string;
  name: string;
  description?: string | null;
  value: number;
  type: "PERCENTAGE" | "FIXED";
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

type GiftBoxItemSelection = {
  itemId: string;
  quantity: number;
  sortOrder: number;
  item?: {
    id: string;
    name: string;
  };
};

type AvailableGiftItem = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: {
    id: string;
    name: string;
    slug?: string;
  } | null;
};

type ProductInput = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  salePrice?: number | null;
  discountId?: string | null;
  stock: number;
  isNewArrival?: boolean;
  isTrending?: boolean;
  isTopRated?: boolean;
  isBestSeller?: boolean;
  showInDiscountSection?: boolean;
  isPremiumGiftBox?: boolean;
  isSpecialTouch?: boolean;
  specialTouchOrder?: number;
  categoryId: string | null;
  sizes: string[];
  colors: string[];
  occasions: OccasionData[];
  recipients?: RecipientData[];
  moods?: Array<{ mood: MoodData } | { moodId: string; productId: string }>;
  boxItems?: GiftBoxItemSelection[];
  productImages: unknown;
  productVariants: unknown;
};

type ProductFormProps = {
  locale: string;
  mode: "create" | "edit";
  categories?: CategoryData[];
  occasions?: OccasionData[];
  recipients?: RecipientData[];
  moods?: MoodData[];
  discounts?: DiscountData[];
  availableGiftItems?: AvailableGiftItem[];
  product?: ProductInput;
};

function calculateSalePrice(basePrice: number, discount?: DiscountData | null) {
  if (!discount || !Number.isFinite(basePrice) || basePrice <= 0) {
    return null;
  }

  if (discount.type === "FIXED") {
    return Math.max(0, Number((basePrice - discount.value).toFixed(2)));
  }

  const capped = Math.min(Math.max(discount.value, 0), 100);
  return Math.max(0, Number((basePrice - (basePrice * capped) / 100).toFixed(2)));
}

function parseImages(images: unknown): ProductImageData[] {
  if (!Array.isArray(images)) return [];
  const parsed: ProductImageData[] = [];

  images.forEach((image) => {
    if (!image || typeof image !== "object") return;
    const candidate = image as { url?: unknown; color?: unknown; isMain?: unknown };
    if (typeof candidate.url !== "string" || !candidate.url) return;

    parsed.push({
      url: candidate.url,
      color: typeof candidate.color === "string" ? candidate.color : undefined,
      isMain: typeof candidate.isMain === "boolean" ? candidate.isMain : false,
    });
  });

  return parsed;
}

function parseVariants(variants: unknown): VariantData[] {
  if (!Array.isArray(variants)) return [];
  return variants
    .map((variant) => {
      if (!variant || typeof variant !== "object") return null;
      const candidate = variant as {
        size?: unknown;
        color?: unknown;
        price?: unknown;
        stock?: unknown;
      };
      return {
        size: typeof candidate.size === "string" ? candidate.size : "",
        color: typeof candidate.color === "string" ? candidate.color : "",
        price: Number(candidate.price) || 0,
        stock: Number(candidate.stock) || 0,
      };
    })
    .filter((variant): variant is VariantData => Boolean(variant));
}

export function ProductForm({ locale, mode, categories, occasions, recipients, moods, discounts, availableGiftItems, product }: ProductFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { watch, setValue: setWatchedValue } = useForm<{ categoryId: string }>({
    defaultValues: { categoryId: "" },
  });
  const formMode: "item" | "box" = "item";

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [selectedDiscountId, setSelectedDiscountId] = useState("");
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isTopRated, setIsTopRated] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [showInDiscountSection, setShowInDiscountSection] = useState(false);
  const [isPremiumGiftBox, setIsPremiumGiftBox] = useState(false);
  const [isSpecialTouch, setIsSpecialTouch] = useState(false);
  const [specialTouchOrder, setSpecialTouchOrder] = useState<number | "">(0);
  const [categoryId, setCategoryId] = useState("");
  const [selectedOccasionIds, setSelectedOccasionIds] = useState<string[]>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [selectedMoodIds, setSelectedMoodIds] = useState<string[]>([]);
  const [stagedImages, setStagedImages] = useState<StagedImageData[]>([]);

  const [sizeInput, setSizeInput] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);

  const [colorInput, setColorInput] = useState("");
  const [colors, setColors] = useState<string[]>([]);

  const [variants, setVariants] = useState<VariantData[]>([]);
  const [removedVariants, setRemovedVariants] = useState<string[]>([]);

  const [categoryOptions, setCategoryOptions] = useState<CategoryData[]>(categories ?? []);
  const [occasionOptions, setOccasionOptions] = useState<OccasionData[]>(occasions ?? []);
  const [recipientOptions, setRecipientOptions] = useState<RecipientData[]>(recipients ?? []);
  const [moodOptions, setMoodOptions] = useState<MoodData[]>(moods ?? []);
  const [discountOptions, setDiscountOptions] = useState<DiscountData[]>(discounts ?? []);
  const [giftItemOptions, setGiftItemOptions] = useState<AvailableGiftItem[]>(availableGiftItems ?? []);
  const [selectedGiftItems, setSelectedGiftItems] = useState<GiftBoxItemSelection[]>([]);
  const [giftItemPickerOpen, setGiftItemPickerOpen] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(!categories || !occasions || !recipients || !moods || !availableGiftItems || !discounts);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"name" | "sku" | "price" | "stock" | "categoryId" | "moodIds", string>>>({});

  useEffect(() => {
    if (!product) return;

    setName(product.name);
    setSku(product.id);
    setDescription(product.description ?? "");
    setPrice(product.price);
    setStock(product.stock);
    setSelectedDiscountId(product.discountId ?? "");
    setIsNewArrival(Boolean(product.isNewArrival));
    setIsTrending(Boolean(product.isTrending));
    setIsTopRated(Boolean(product.isTopRated));
    setIsBestSeller(Boolean(product.isBestSeller));
    setShowInDiscountSection(Boolean(product.showInDiscountSection));
    setIsPremiumGiftBox(Boolean(product.isPremiumGiftBox));
    setIsSpecialTouch(Boolean(product.isSpecialTouch));
    setSpecialTouchOrder(Number.isFinite(product.specialTouchOrder) ? Number(product.specialTouchOrder) : 0);
    setCategoryId(product.categoryId ?? "");
    setSelectedOccasionIds(product.occasions?.map((occasion) => occasion.id) ?? []);
    setSelectedRecipientIds(product.recipients?.map((recipient) => recipient.id) ?? []);
    setSelectedMoodIds(
      product.moods?.map((productMood) => ("mood" in productMood ? productMood.mood.id : productMood.moodId)) ?? []
    );

    const parsedImages = parseImages(product.productImages);
    setStagedImages(
      parsedImages.map((image, index) => ({
        ...image,
        isMain: image.isMain ?? index === 0,
      }))
    );

    setSizes(product.sizes ?? []);
    setColors(product.colors ?? []);
    setVariants(parseVariants(product.productVariants));
    setSelectedGiftItems(
      (product.boxItems ?? []).map((entry, index) => ({
        itemId: entry.itemId,
        quantity: Math.max(1, Number(entry.quantity) || 1),
        sortOrder: Number.isInteger(entry.sortOrder) ? entry.sortOrder : index,
        item: entry.item,
      }))
    );

  }, [product]);

  useEffect(() => {
    let active = true;

    const loadOptions = async () => {
      if (categories && occasions && recipients && moods && availableGiftItems && discounts) {
        setOptionsLoading(false);
        return;
      }

      try {
        const [categoriesRes, occasionsRes, recipientsRes, moodsRes, discountsRes] = await Promise.all([
          categories ? Promise.resolve(null) : fetch("/api/admin/categories", { cache: "no-store" }),
          occasions ? Promise.resolve(null) : fetch("/api/admin/occasions", { cache: "no-store" }),
          recipients ? Promise.resolve(null) : fetch("/api/admin/recipients", { cache: "no-store" }),
          moods ? Promise.resolve(null) : fetch("/api/admin/moods", { cache: "no-store" }),
          discounts ? Promise.resolve(null) : fetch("/api/admin/discounts", { cache: "no-store" }),
        ]);

        if (!active) return;

        if (categoriesRes && categoriesRes.ok) {
          const categoriesJson = await categoriesRes.json();
          setCategoryOptions(
            Array.isArray(categoriesJson)
              ? categoriesJson
                  .map((item) => ({ id: item.id, name: item.name, slug: item.slug }))
                  .filter((item) => item.id && item.name)
              : []
          );
        }

        if (occasionsRes && occasionsRes.ok) {
          const occasionsJson = await occasionsRes.json();
          setOccasionOptions(
            Array.isArray(occasionsJson)
              ? occasionsJson.map((item) => ({ id: item.id, name: item.name })).filter((item) => item.id && item.name)
              : []
          );
        }

        if (recipientsRes && recipientsRes.ok) {
          const recipientsJson = await recipientsRes.json();
          setRecipientOptions(
            Array.isArray(recipientsJson)
              ? recipientsJson
                  .map((item) => ({ id: item.id, name: item.name, slug: item.slug }))
                  .filter((item) => item.id && item.name)
              : []
          );
        }

        if (moodsRes && moodsRes.ok) {
          const moodsJson = await moodsRes.json();
          setMoodOptions(
            Array.isArray(moodsJson)
              ? moodsJson.map((item) => ({ id: item.id, name: item.name, icon: item.icon })).filter((item) => item.id && item.name)
              : []
          );
        }

        if (discountsRes && discountsRes.ok) {
          const discountsJson = await discountsRes.json();
          setDiscountOptions(
            Array.isArray(discountsJson)
              ? discountsJson
                  .filter((item) => item?.isActive)
                  .map((item) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description ?? null,
                    value: Number(item.value) || 0,
                    type: item.type === "FIXED" ? "FIXED" : "PERCENTAGE",
                    isActive: Boolean(item.isActive),
                    startsAt: item.startsAt ?? null,
                    endsAt: item.endsAt ?? null,
                  }))
              : []
          );
        }
      } finally {
        if (active) setOptionsLoading(false);
      }
    };

    void loadOptions();

    return () => {
      active = false;
    };
  }, [categories, occasions, recipients, moods, discounts, availableGiftItems]);

  useEffect(() => {
    if (availableGiftItems) {
      setGiftItemOptions(availableGiftItems);
    }
  }, [availableGiftItems]);

  useEffect(() => {
    setVariants((prev) => {
      const nextVariants: VariantData[] = [];
      const sizesList = sizes.length > 0 ? sizes : [""];
      const colorsList = colors.length > 0 ? colors : [""];

      if (sizes.length === 0 && colors.length === 0) return [];

      sizesList.forEach((sizeValue) => {
        colorsList.forEach((colorValue) => {
          const key = `${sizeValue}:${colorValue}`;
          if (removedVariants.includes(key)) return;

          const existing = prev.find((variant) => variant.size === sizeValue && variant.color === colorValue);
          nextVariants.push(
            existing || {
              size: sizeValue,
              color: colorValue,
              price: Number(price) || 0,
              stock: Number(stock) || 0,
            }
          );
        });
      });

      return nextVariants;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizes, colors, removedVariants]);

  const isEdit = mode === "edit";

  const heading = useMemo(() => {
    return isEdit ? "Edit Product" : "New Inventory Registration";
  }, [isEdit]);

  const selectedDiscount = useMemo(
    () => discountOptions.find((discount) => discount.id === selectedDiscountId) ?? null,
    [discountOptions, selectedDiscountId]
  );

  const computedSalePrice = useMemo(() => {
    const basePrice = typeof price === "number" ? price : Number(price);
    if (!Number.isFinite(basePrice) || basePrice <= 0) return null;
    return calculateSalePrice(basePrice, selectedDiscount);
  }, [price, selectedDiscount]);

  const hasAtLeastOneImage = useMemo(
    () =>
      stagedImages.some(
        (image) => Boolean(image.file) || (typeof image.url === "string" && image.url.trim().length > 0)
      ),
    [stagedImages]
  );
  const storefrontOptionsLocked = !hasAtLeastOneImage;

  const selectedCategory = useMemo(
    () => categoryOptions.find((category) => category.id === watch("categoryId")),
    [categoryOptions, watch]
  );

  const isBoxCategory = useMemo(() => {
    if (!selectedCategory) return false;
    const normalizedName = selectedCategory.name.toLowerCase();
    const normalizedSlug = (selectedCategory.slug ?? "").toLowerCase();
    return normalizedName.includes("gift box") || normalizedSlug.includes("box");
  }, [selectedCategory]);

  useEffect(() => {
    if (!isBoxCategory) {
      setIsPremiumGiftBox(false);
      setSelectedGiftItems([]);
    }
  }, [isBoxCategory]);

  useEffect(() => {
    if (!storefrontOptionsLocked) return;
    setIsNewArrival(false);
    setIsTrending(false);
    setShowInDiscountSection(false);
  }, [storefrontOptionsLocked]);

  useEffect(() => {
    if (formMode !== "box") {
      setIsPremiumGiftBox(false);
      setSelectedGiftItems([]);
      return;
    }

    const giftBoxCategory = categoryOptions.find((category) => {
      const normalizedName = category.name.toLowerCase();
      const normalizedSlug = (category.slug ?? "").toLowerCase();
      return normalizedName.includes("gift box") || normalizedSlug.includes("box");
    });

    if (!giftBoxCategory) return;
    if (categoryId === giftBoxCategory.id) return;

    setCategoryId(giftBoxCategory.id);
    setWatchedValue("categoryId", giftBoxCategory.id);
  }, [categoryId, categoryOptions, formMode, setWatchedValue]);

  useEffect(() => {
    setWatchedValue("categoryId", categoryId);
  }, [categoryId, setWatchedValue]);

  const selectableGiftItems = useMemo(
    () =>
      giftItemOptions.filter(
        (item) =>
          item.id !== product?.id && !selectedGiftItems.some((selectedItem) => selectedItem.itemId === item.id)
      ),
    [giftItemOptions, product?.id, selectedGiftItems]
  );

  const handleAddItem = (
    input: string,
    setInput: (value: string) => void,
    list: string[],
    setList: (value: string[]) => void
  ) => {
    const value = input.trim();
    if (!value || list.includes(value)) return;
    setList([...list, value]);
    setInput("");
  };

  const handleImageSelect = (items: (string | File)[]) => {
    const nextItems: StagedImageData[] = items.map((item, index) => {
      if (typeof item === "string") {
        const existing = stagedImages.find((image) => image.url === item);
        return {
          url: item,
          color: existing?.color,
          isMain: existing?.isMain ?? index === 0,
        };
      }

      return {
        url: "",
        file: item,
        previewUrl: URL.createObjectURL(item),
        isMain: index === 0,
      };
    });

    if (nextItems.length > 0 && !nextItems.some((item) => item.isMain)) {
      nextItems[0].isMain = true;
    }

    setStagedImages(nextItems);
  };

  const addGiftItem = (item: AvailableGiftItem) => {
    setSelectedGiftItems((prev) => [
      ...prev,
      {
        itemId: item.id,
        quantity: 1,
        sortOrder: prev.length,
        item: { id: item.id, name: item.name },
      },
    ]);
    setGiftItemPickerOpen(false);
  };

  const removeGiftItem = (itemId: string) => {
    setSelectedGiftItems((prev) =>
      prev
        .filter((entry) => entry.itemId !== itemId)
        .map((entry, index) => ({
          ...entry,
          sortOrder: index,
        }))
    );
  };

  const updateGiftItemQuantity = (itemId: string, quantity: number) => {
    setSelectedGiftItems((prev) =>
      prev.map((entry) =>
        entry.itemId === itemId
          ? {
              ...entry,
              quantity: Math.max(1, quantity || 1),
            }
          : entry
      )
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});

    const parsed = productFormSchema.safeParse({
      name,
      sku,
      categoryId,
      price: price === "" ? "" : String(price),
      stock: stock === "" ? "" : String(stock),
      moodIds: selectedMoodIds,
    });

    if (!parsed.success) {
      const nextErrors: Partial<Record<"name" | "sku" | "price" | "stock" | "categoryId" | "moodIds", string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof typeof nextErrors;
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      const boxItems = formMode === "box"
        ? selectedGiftItems.map((entry, index) => ({
            itemId: entry.itemId,
            quantity: Math.max(1, entry.quantity),
            sortOrder: index,
          }))
        : [];

      const finalImages: ProductImageData[] = await Promise.all(
        stagedImages.map(async (image) => {
          let url = image.url;
          if (image.file) {
            url = await uploadFile(image.file, "products");
          }
          return {
            url,
            color: image.color,
            isMain: image.isMain,
          };
        })
      );

      const hasImagesForStorefront = finalImages.some(
        (image) => typeof image.url === "string" && image.url.trim().length > 0
      );
      const enforcedShowInDiscountSection = hasImagesForStorefront ? showInDiscountSection : false;
      const selectedDiscountForSubmit = hasImagesForStorefront ? selectedDiscount : null;
      const basePrice = Number(price);
      const discountAmount = selectedDiscountForSubmit
        ? selectedDiscountForSubmit.type === "FIXED"
          ? Math.min(basePrice, selectedDiscountForSubmit.value)
          : Math.min(basePrice, (basePrice * Math.min(Math.max(selectedDiscountForSubmit.value, 0), 100)) / 100)
        : 0;
      const enforcedSalePrice = selectedDiscountForSubmit
        ? Math.max(0, Number((basePrice - discountAmount).toFixed(2)))
        : null;

      const res = await fetch(isEdit ? `/api/admin/products/${product?.id}` : "/api/admin/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sku,
          description,
          price: Number(price),
          stock: Number(stock),
          isNewArrival: hasImagesForStorefront ? isNewArrival : false,
          isTrending: hasImagesForStorefront ? isTrending : false,
          isTopRated: hasImagesForStorefront ? isTopRated : false,
          isBestSeller: hasImagesForStorefront ? isBestSeller : false,
          showInDiscountSection: enforcedShowInDiscountSection,
          isPremiumGiftBox,
          isSpecialTouch,
          specialTouchOrder: Number(specialTouchOrder) || 0,
          discountId: selectedDiscountForSubmit?.id ?? null,
          salePrice: enforcedSalePrice,
          categoryId,
          sizes,
          colors,
          occasionIds: selectedOccasionIds,
          recipientIds: selectedRecipientIds,
          moodIds: selectedMoodIds,
          giftBoxItems: boxItems,
          boxItems,
          images: finalImages,
          variants,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to ${isEdit ? "update" : "create"} product`);
      }

      toast({
        title: isEdit ? "Product updated" : "Product created",
        description: isEdit ? "Product changes saved successfully." : "Successfully created product in inventory.",
      });

      router.push(`/${locale}/admin/products`);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Request failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleOccasion = (occasionId: string) => {
    setSelectedOccasionIds((prev) =>
      prev.includes(occasionId) ? prev.filter((id) => id !== occasionId) : [...prev, occasionId]
    );
  };

  const toggleRecipient = (recipientId: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(recipientId) ? prev.filter((id) => id !== recipientId) : [...prev, recipientId]
    );
  };

  const toggleMood = (moodId: string) => {
    setSelectedMoodIds((prev) =>
      prev.includes(moodId) ? prev.filter((id) => id !== moodId) : [...prev, moodId]
    );
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-brand-border">
      <h1 className="text-2xl font-bold text-[#1F1720] mb-8 flex items-center gap-3">
        <div className="p-2 bg-brand-surface rounded-xl">
          <Package className="w-6 h-6 text-[#315243]" />
        </div>
        {heading}
      </h1>


      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2 space-y-2">
            <Label required className="text-sm font-bold text-[#1F1720] uppercase tracking-wider">Product Name</Label>
            <Input required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Signature Golden Gift Box" className="h-12 border-brand-border" />
            {fieldErrors.name ? <p className="text-sm text-destructive">{fieldErrors.name}</p> : null}
          </div>

          <div className="space-y-2">
            <Label required className="text-sm font-bold text-[#1F1720] uppercase tracking-wider">SKU</Label>
            <Input
              required
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              placeholder="e.g. GBX-001"
              className="h-12 border-brand-border"
            />
            {fieldErrors.sku ? <p className="text-sm text-destructive">{fieldErrors.sku}</p> : null}
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label className="text-sm font-bold text-[#1F1720] uppercase tracking-wider block mb-2">Product Narrative</Label>
            <MarkdownEditor value={description || ""} onChange={setDescription} placeholder="Tell the brand story for this item..." />
          </div>

          <div className="space-y-2">
            <Label required className="text-sm font-bold text-[#1F1720] uppercase tracking-wider">Base Price (LKR)</Label>
            <Input
              required
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(event) => setPrice(event.target.value ? Number(event.target.value) : "")}
              placeholder="2500.00"
              className="h-12"
            />
            {fieldErrors.price ? <p className="text-sm text-destructive">{fieldErrors.price}</p> : null}
          </div>

          <div className="space-y-2">
            <Label required className="text-sm font-bold text-[#1F1720] uppercase tracking-wider">Stock</Label>
            <Input
              required
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(event) => setStock(event.target.value ? Number(event.target.value) : "")}
              placeholder="150"
              className="h-12"
            />
            {fieldErrors.stock ? <p className="text-sm text-destructive">{fieldErrors.stock}</p> : null}
          </div>

          <Card className="md:col-span-2 border-[#315243]/25 bg-[#FDF9E8] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-[#1F1720]">Marketing & Visibility Flags</CardTitle>
              <p className="text-xs text-[#6B5A64]">
                Control which homepage and merchandising surfaces this product can appear in.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {storefrontOptionsLocked ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                  ⚠️ Add at least one product image to enable marketing and visibility flags.
                </p>
              ) : null}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl border border-brand-border bg-white p-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1F1720]">New Arrival</p>
                    <p className="text-xs text-[#6B5A64]">Show in the new arrivals section</p>
                  </div>
                  <Switch checked={isNewArrival} onCheckedChange={setIsNewArrival} disabled={storefrontOptionsLocked} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-brand-border bg-white p-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1F1720]">Trending Now</p>
                    <p className="text-xs text-[#6B5A64]">Show in trending lists</p>
                  </div>
                  <Switch checked={isTrending} onCheckedChange={setIsTrending} disabled={storefrontOptionsLocked} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-brand-border bg-white p-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1F1720]">Manual Top Rated</p>
                    <p className="text-xs text-[#6B5A64]">Mark as manually curated top rated</p>
                  </div>
                  <Switch checked={isTopRated} onCheckedChange={setIsTopRated} disabled={storefrontOptionsLocked} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-brand-border bg-white p-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1F1720]">Manual Best Seller</p>
                    <p className="text-xs text-[#6B5A64]">Mark as manually curated bestseller</p>
                  </div>
                  <Switch checked={isBestSeller} onCheckedChange={setIsBestSeller} disabled={storefrontOptionsLocked} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className={`md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2 ${storefrontOptionsLocked ? "opacity-80" : ""}`} aria-disabled={storefrontOptionsLocked}>
            <div className="rounded-2xl border border-brand-border bg-[#FAFAFA] p-4">
              <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B5A64]">Apply Promotion/Discount (Optional)</Label>
              <select
                className="mt-1 h-10 w-full rounded-md border border-brand-border bg-white px-3 text-sm"
                value={selectedDiscountId}
                onChange={(event) => setSelectedDiscountId(event.target.value)}
                disabled={storefrontOptionsLocked}
              >
                <option value="">None</option>
                {discountOptions.map((discount) => (
                  <option key={discount.id} value={discount.id}>
                    {discount.name} ({discount.type === "PERCENTAGE" ? `${discount.value}%` : `LKR ${discount.value}`})
                  </option>
                ))}
              </select>
              {optionsLoading && discountOptions.length === 0 ? (
                <p className="mt-1 text-xs text-[#6B5A64]">Loading discounts...</p>
              ) : null}
            </div>
            <div className="rounded-xl border border-brand-border bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B5A64]">Discount Preview</p>
              <p className="mt-1 text-xs text-[#6B5A64]">Base Price: {typeof price === "number" ? `LKR ${price.toLocaleString()}` : "-"}</p>
              <p className="mt-1 text-xs text-[#E11D48]">
                Discount Amount: {selectedDiscount && typeof price === "number"
                  ? selectedDiscount.type === "FIXED"
                    ? `LKR ${Math.min(price, selectedDiscount.value).toLocaleString()}`
                    : `LKR ${((price * Math.min(Math.max(selectedDiscount.value, 0), 100)) / 100).toLocaleString()}`
                  : "-"}
              </p>
              <p className="mt-1 text-lg font-bold text-[#16A34A]">
                Final Sale Price: {computedSalePrice !== null ? `LKR ${computedSalePrice.toLocaleString()}` : "-"}
              </p>
            </div>
            <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-brand-border bg-white p-3">
              <div>
                <p className="text-sm font-semibold text-[#1F1720]">Show in Discount Section</p>
                <p className="text-xs text-[#6B5A64]">Feature this product in discount-driven storefront modules.</p>
              </div>
              <Switch checked={showInDiscountSection} onCheckedChange={setShowInDiscountSection} disabled={storefrontOptionsLocked} />
            </div>
          </div>
          <Card className="md:col-span-2 border-[#F2D8B6] bg-[#FFFDF8] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-[#1F1720]">CART & UPSELL FLAGS</CardTitle>
              <p className="text-xs text-[#6B5A64]">
                Control which products can surface as a cart drawer upsell and how they are ordered.
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-brand-border bg-white p-3">
                <div className="pr-4">
                  <p className="text-sm font-semibold text-[#1F1720]">Special Touch Upsell</p>
                  <p className="text-xs text-[#6B5A64]">Feature this product inside the cart drawer add-on rail.</p>
                </div>
                <Switch checked={isSpecialTouch} onCheckedChange={setIsSpecialTouch} />
              </div>
              <div className="space-y-2 rounded-xl border border-brand-border bg-white p-3">
                <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B5A64]">Display Priority</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={specialTouchOrder}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSpecialTouchOrder(nextValue === "" ? "" : Number(nextValue));
                  }}
                  className="h-11"
                />
                <p className="text-[11px] text-[#6B5A64]">Lower numbers are shown first in the cart drawer.</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label required className="text-sm font-bold text-[#1F1720] uppercase tracking-wider">Category</Label>
            <select
              required
              className="w-full h-12 rounded-xl border border-brand-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#315243]"
              value={categoryId}
              onChange={(event) => {
                const selectedId = event.target.value;
                setCategoryId(selectedId);
                setWatchedValue("categoryId", selectedId);
              }}
            >
              <option value="" disabled>
                Select Item Type...
              </option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {fieldErrors.categoryId ? <p className="text-sm text-destructive">{fieldErrors.categoryId}</p> : null}
            {optionsLoading && categoryOptions.length === 0 ? (
              <p className="text-xs text-[#6B5A64]">Loading categories...</p>
            ) : null}
          </div>

          {formMode === "box" ? (
            <Card className="md:col-span-2 border-[#315243]/25 bg-[#FDF9E8] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-[#1F1720]">📦 Gift Box Configuration</CardTitle>
                <p className="text-xs text-[#6B5A64]">Configure premium placement and included products for this gift box.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-brand-border bg-white p-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1F1720]">Premium Gift Box</p>
                    <p className="text-xs text-[#6B5A64]">Enable this to feature the product in the Premium Gift Boxes home section.</p>
                  </div>
                  <Switch checked={isPremiumGiftBox} onCheckedChange={setIsPremiumGiftBox} />
                </div>

              <div className="mt-4 space-y-3">
                <Label className="text-sm font-bold text-[#1F1720] uppercase tracking-wider">Included Items</Label>
                <Popover open={giftItemPickerOpen} onOpenChange={setGiftItemPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={giftItemPickerOpen}
                      className="h-12 w-full justify-between border-brand-border"
                    >
                      Search and add products...
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search products..." />
                      <CommandList>
                        <CommandEmpty>No matching products found.</CommandEmpty>
                        <CommandGroup>
                          {selectableGiftItems.map((item) => (
                            <CommandItem
                              key={item.id}
                              value={`${item.name} ${item.category?.name ?? ""}`}
                              onSelect={() => addGiftItem(item)}
                              className="flex items-center justify-between"
                            >
                              <div>
                                <p className="text-sm font-medium text-[#1F1720]">{item.name}</p>
                                <p className="text-xs text-[#6B5A64]">
                                  {item.category?.name ?? "Uncategorized"} • LKR {item.price.toLocaleString()} • Stock {item.stock}
                                </p>
                              </div>
                              <Check className="h-4 w-4 text-[#315243] opacity-0" />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selectedGiftItems.length > 0 ? (
                  <div className="space-y-2 rounded-xl border border-brand-border bg-white p-3">
                    {selectedGiftItems.map((entry, index) => (
                      <div key={entry.itemId} className="flex flex-col gap-2 rounded-lg border border-brand-border p-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#1F1720]">{entry.item?.name || entry.itemId}</p>
                          <p className="text-xs text-[#6B5A64]">Included item #{index + 1}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B5A64]">Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={entry.quantity}
                            onChange={(event) => updateGiftItemQuantity(entry.itemId, Number(event.target.value))}
                            className="h-9 w-20"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => removeGiftItem(entry.itemId)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#6B5A64]">Add one or more included products for this gift box.</p>
                )}
              </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="md:col-span-2 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-brand-border bg-[#FAFAFA] p-4">
              <Label className="text-sm font-bold text-[#1F1720] uppercase tracking-wider">Occasions</Label>
              <div className="flex flex-wrap gap-2">
                {occasionOptions.map((occasion) => {
                  const selected = selectedOccasionIds.includes(occasion.id);
                  return (
                    <button
                      key={occasion.id}
                      type="button"
                      onClick={() => toggleOccasion(occasion.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        selected
                          ? "border-[#315243] bg-[#FDF9E8] text-[#315243]"
                          : "border-brand-border bg-white text-[#3A2B35] hover:border-[#315243]/40"
                      }`}
                    >
                      {occasion.name}
                    </button>
                  );
                })}
              </div>
              {selectedOccasionIds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedOccasionIds.map((id) => {
                    const occasion = occasionOptions.find((item) => item.id === id);
                    if (!occasion) return null;

                    return (
                      <Badge key={id} className="bg-brand-surface text-[#1F1720] border-brand-border py-1.5 group">
                        {occasion.name}
                        <X
                          className="w-3 h-3 ml-2 cursor-pointer group-hover:text-red-500"
                          onClick={() => toggleOccasion(id)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#6B5A64]">Select one or more occasions for this product.</p>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-brand-border bg-[#FAFAFA] p-4">
              <Label className="text-sm font-bold text-[#1F1720] uppercase tracking-wider">Recipients</Label>
              <div className="flex flex-wrap gap-2">
                {recipientOptions.map((recipient) => {
                  const selected = selectedRecipientIds.includes(recipient.id);
                  return (
                    <button
                      key={recipient.id}
                      type="button"
                      onClick={() => toggleRecipient(recipient.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        selected
                          ? "border-[#315243] bg-[#FDF9E8] text-[#315243]"
                          : "border-brand-border bg-white text-[#3A2B35] hover:border-[#315243]/40"
                      }`}
                    >
                      {recipient.name}
                    </button>
                  );
                })}
              </div>
              {selectedRecipientIds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedRecipientIds.map((id) => {
                    const recipient = recipientOptions.find((item) => item.id === id);
                    if (!recipient) return null;

                    return (
                      <Badge key={id} className="bg-brand-surface text-[#1F1720] border-brand-border py-1.5 group">
                        {recipient.name}
                        <X
                          className="w-3 h-3 ml-2 cursor-pointer group-hover:text-red-500"
                          onClick={() => toggleRecipient(id)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#6B5A64]">Select one or more recipient groups for this product.</p>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <Label className="text-sm font-bold text-[#1F1720] uppercase tracking-wider">Mood Selection (Optional)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 rounded-xl border border-brand-border bg-[#FAFAFA] p-3">
              {moodOptions.map((mood) => {
                const selected = selectedMoodIds.includes(mood.id);
                return (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => toggleMood(mood.id)}
                    className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors flex items-center gap-2 ${
                      selected
                        ? "border-[#315243] bg-[#FDF9E8] text-[#315243]"
                        : "border-brand-border bg-white text-[#3A2B35] hover:border-[#315243]/40"
                    }`}
                  >
                    <span className="text-sm leading-none">{mood.icon || "✨"}</span>
                    <span>{mood.name}</span>
                  </button>
                );
              })}
            </div>
            {fieldErrors.moodIds ? <p className="text-sm text-destructive">{fieldErrors.moodIds}</p> : null}
            {selectedMoodIds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedMoodIds.map((id) => {
                  const mood = moodOptions.find((item) => item.id === id);
                  if (!mood) return null;

                  return (
                    <Badge key={id} className="bg-brand-surface text-[#1F1720] border-brand-border py-1.5 group">
                      <span className="mr-1">{mood.icon || "✨"}</span>
                      {mood.name}
                      <X
                        className="w-3 h-3 ml-2 cursor-pointer group-hover:text-red-500"
                        onClick={() => toggleMood(id)}
                      />
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#6B5A64]">Tag this product with one or more moods for mood-based shopping.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Label className="text-sm font-bold text-[#1F1720] uppercase tracking-wider flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#315243]" />
            Product Images
          </Label>

          <div className="bg-[#FAFAFA] text-center p-10 rounded-3xl border-2 border-dashed border-brand-border group hover:bg-[#FDF9E8]/10 transition-colors">
            <ImageUpload multiple value={stagedImages.map((image) => image.file || image.url)} onChange={handleImageSelect} />
          </div>

          {stagedImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mt-6">
              {stagedImages.map((image, index) => (
                <div
                  key={`${image.url}-${index}`}
                  className={`relative rounded-2xl overflow-hidden border-2 bg-white flex flex-col group transition-all ${
                    image.isMain ? "border-[#315243] ring-4 ring-[#315243]/10" : "border-brand-border"
                  }`}
                >
                  <div className="relative aspect-square w-full">
                    <Image src={image.file ? image.previewUrl || "" : image.url} alt={`Preview ${index + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setStagedImages(stagedImages.filter((_, imageIndex) => imageIndex !== index))}
                      className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-600 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3 space-y-3 bg-white">
                    <label className="flex items-center justify-between cursor-pointer w-full text-[10px] font-black uppercase text-[#1F1720] tracking-tighter">
                      <span className="flex items-center gap-1">
                        <Star className={`w-3 h-3 ${image.isMain ? "fill-[#315243] text-[#315243]" : "text-gray-300"}`} />
                        Lead Visual
                      </span>
                      <input
                        type="radio"
                        name="mainImageSelection"
                        checked={image.isMain || false}
                        onChange={() => setStagedImages(stagedImages.map((item, itemIndex) => ({ ...item, isMain: itemIndex === index })))}
                        className="accent-[#315243]"
                      />
                    </label>
                    <select
                      className="w-full text-[10px] p-1.5 border rounded-lg border-brand-border text-[#6B5A64]"
                      value={image.color || ""}
                      onChange={(event) =>
                        setStagedImages(stagedImages.map((item, itemIndex) => (itemIndex === index ? { ...item, color: event.target.value } : item)))
                      }
                    >
                      <option value="">No Color Tag</option>
                      {colors.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-6 border-t border-brand-border">
          <div className="space-y-4">
            <Label className="text-sm font-bold text-[#1F1720] uppercase tracking-wider">Size Options</Label>
            <div className="flex gap-2">
              <Input
                value={sizeInput}
                onChange={(event) => setSizeInput(event.target.value)}
                placeholder="e.g. XL"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddItem(sizeInput, setSizeInput, sizes, setSizes);
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={() => handleAddItem(sizeInput, setSizeInput, sizes, setSizes)}>
                Register
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((sizeValue) => (
                <Badge key={sizeValue} className="bg-brand-surface text-[#1F1720] hover:bg-red-50 border-brand-border py-1.5 group">
                  {sizeValue}
                  <X className="w-3 h-3 ml-2 cursor-pointer group-hover:text-red-500" onClick={() => setSizes(sizes.filter((item) => item !== sizeValue))} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-bold text-[#1F1720] uppercase tracking-wider">Color Palette</Label>
            <div className="flex gap-2">
              <Input
                value={colorInput}
                onChange={(event) => setColorInput(event.target.value)}
                placeholder="e.g. Rose Gold"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddItem(colorInput, setColorInput, colors, setColors);
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={() => handleAddItem(colorInput, setColorInput, colors, setColors)}>
                Register
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {colors.map((colorValue) => (
                <Badge key={colorValue} className="bg-[#1F1720] text-white py-1.5 group">
                  {colorValue}
                  <X className="w-3 h-3 ml-2 cursor-pointer group-hover:text-red-400" onClick={() => setColors(colors.filter((item) => item !== colorValue))} />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {variants.length > 0 && (
          <div className="border border-brand-border rounded-2xl overflow-hidden mt-6 shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#FAFAFA] border-b border-brand-border">
                <tr>
                  <th className="px-6 py-4 font-bold text-[#1F1720] uppercase text-[11px] tracking-wider">Combination Path</th>
                  <th className="px-6 py-4 font-bold text-[#1F1720] uppercase text-[11px] tracking-wider w-32">Price Offset</th>
                  <th className="px-6 py-4 font-bold text-[#1F1720] uppercase text-[11px] tracking-wider w-32">Stock Allocation</th>
                  <th className="px-6 py-4 font-bold text-center w-16 text-[#315243]">
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {variants.map((variant, index) => (
                  <tr key={`${variant.size}:${variant.color}:${index}`} className="hover:bg-[#FAFAFA]/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#6B5A64]">{[variant.size, variant.color].filter(Boolean).join(" • ") || "Pure Unit"}</td>
                    <td className="px-6 py-4">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 border-brand-border focus:border-[#315243]"
                        value={variant.price === 0 ? "" : variant.price}
                        onChange={(event) => {
                          const edited = [...variants];
                          edited[index].price = Number(event.target.value);
                          setVariants(edited);
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Input
                        type="number"
                        step="1"
                        className="h-9 border-brand-border focus:border-[#315243]"
                        value={variant.stock === 0 ? "" : variant.stock}
                        onChange={(event) => {
                          const edited = [...variants];
                          edited[index].stock = Number(event.target.value);
                          setVariants(edited);
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => setRemovedVariants([...removedVariants, `${variant.size}:${variant.color}`])}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-10 border-t border-brand-border mt-10">
          <Button type="button" variant="ghost" className="text-[#6B5A64] mr-4" onClick={() => router.push(`/${locale}/admin/products`)}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#315243] hover:bg-[#1A3026] text-white px-12 h-14 rounded-2xl shadow-xl shadow-[#315243]/20 transition-all hover:scale-105 active:scale-95 text-lg font-bold"
          >
            {loading ? <RefreshCw className="w-5 h-5 mr-3 animate-spin" /> : <Tag className="w-5 h-5 mr-3" />}
            {loading ? "Saving..." : isEdit ? "Save Product" : "Publish Product to Store"}
          </Button>
        </div>
      </form>
    </div>
  );
}
