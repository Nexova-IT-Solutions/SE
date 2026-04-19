"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header, Footer, CartDrawer } from "@/components/giftbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCartStore } from "@/store";
import { paymentMethods, sriLankanCities } from "@/data";
import { 
  ArrowLeft, 
  CreditCard, 
  Building, 
  Banknote, 
  Truck, 
  Shield, 
  Sparkles,
  Check,
  AlertCircle,
  Gift,
  UserRound
} from "lucide-react";

const REQUIRED_FIELD_MESSAGE = "This field is required.";

const checkoutSchema = z.object({
  addressLine1: z.string().trim().min(1, REQUIRED_FIELD_MESSAGE),
  city: z.string().trim().min(1, REQUIRED_FIELD_MESSAGE),
  paymentMethod: z.string().trim().min(1, REQUIRED_FIELD_MESSAGE),
});

interface ShippingConfig {
  id: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  expressDeliveryFee: number;
  isDeliveryEnabled: boolean;
  deliveryNote?: string;
}

interface GiftWrapOption {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { data: session, status } = useSession();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { toast } = useToast();
  
  const subtotal = getSubtotal();
  
  // Shipping config state
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  
  // Form fields
  const [city, setCity] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [contactName, setContactName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [selectedWrapId, setSelectedWrapId] = useState("");
  const [wrapOptions, setWrapOptions] = useState<GiftWrapOption[]>([]);
  const [revealSender, setRevealSender] = useState(true);
  const [suppressInvoice, setSuppressInvoice] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("COD");
  const [isProcessing, setIsProcessing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});

  // Fetch shipping config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoadingConfig(true);
        const [shippingResponse, wrapsResponse] = await Promise.all([
          fetch("/api/shipping-config"),
          fetch("/api/wrappings"),
        ]);

        const data = await shippingResponse.json();
        
        if (data.success && data.data) {
          setShippingConfig(data.data);
        }

        const wrapsData = await wrapsResponse.json();
        if (wrapsData.success && Array.isArray(wrapsData.data)) {
          setWrapOptions(wrapsData.data);
        }
      } catch (error) {
        console.error("Error fetching shipping config:", error);
        toast({
          title: "Error",
          description: "Failed to load shipping configuration",
          variant: "destructive",
        });
      } finally {
        setIsLoadingConfig(false);
      }
    };

    fetchConfig();
  }, [toast]);

  useEffect(() => {
    if (session?.user?.name) {
      setContactName((prev) => prev || session.user.name || "");
      setSenderName((prev) => prev || session.user.name || "");
    }
  }, [session?.user?.name]);

  // Calculate delivery fee and totals
  const deliveryFee = shippingConfig && city ? 
    (subtotal >= shippingConfig.freeDeliveryThreshold ? 0 : shippingConfig.deliveryFee) : 0;

  const selectedWrap = wrapOptions.find((wrap) => wrap.id === selectedWrapId);
  const wrappingFee = isGift && selectedWrap ? selectedWrap.price : 0;
  
  const total = subtotal + deliveryFee + wrappingFee;
  
  // Calculate free delivery nudge
  const remainingForFreeDelivery = shippingConfig && subtotal < shippingConfig.freeDeliveryThreshold
    ? Math.ceil(shippingConfig.freeDeliveryThreshold - subtotal)
    : null;

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

  const getPaymentIcon = (icon: string) => {
    switch (icon) {
      case "credit-card":
        return <CreditCard className="w-5 h-5" />;
      case "building":
        return <Building className="w-5 h-5" />;
      default:
        return <Banknote className="w-5 h-5" />;
    }
  };

  const handlePlaceOrder = async () => {
    setFieldErrors({});

    // Validate form
    const parsed = checkoutSchema.safeParse({
      addressLine1,
      city,
      paymentMethod: selectedPayment,
    });

    if (!parsed.success) {
      const nextErrors: Partial<Record<string, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      return;
    }

    const nextErrors: Partial<Record<string, string>> = {};

    if (isGift) {
      if (!recipientName.trim()) nextErrors.recipientName = REQUIRED_FIELD_MESSAGE;
      if (!recipientPhone.trim()) nextErrors.recipientPhone = REQUIRED_FIELD_MESSAGE;
      if (!senderName.trim()) nextErrors.senderName = REQUIRED_FIELD_MESSAGE;
      if (!senderPhone.trim()) nextErrors.senderPhone = REQUIRED_FIELD_MESSAGE;
    } else {
      if (!contactName.trim()) nextErrors.contactName = REQUIRED_FIELD_MESSAGE;
      if (!customerPhone.trim()) nextErrors.customerPhone = REQUIRED_FIELD_MESSAGE;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    // Check if delivery is enabled
    if (!shippingConfig?.isDeliveryEnabled) {
      toast({
        title: "Error",
        description: "Delivery is currently disabled",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      const normalizedItems = items
        .map((item) => {
          const productId = item.product?.id || item.giftBox?.id || (item as any).productId || (item as any).id;

          if (!productId) return null;

          return {
            productId,
            quantity: item.quantity,
            price: item.quantity > 0 ? item.subtotal / item.quantity : item.subtotal,
            discountId: (item as any).discountId || undefined,
          };
        })
        .filter(Boolean) as Array<{ productId: string; quantity: number; price: number; discountId?: string }>;

      if (normalizedItems.length === 0) {
        toast({
          title: "Invalid cart",
          description: "Invalid cart items: Missing Product IDs",
          variant: "destructive",
        });
        return;
      }

      if (normalizedItems.length !== items.length) {
        toast({
          title: "Invalid cart",
          description: "Some cart items could not be processed. Please review your cart and try again.",
          variant: "destructive",
        });
        return;
      }

      // Prepare checkout payload
      const checkoutPayload = {
        items: normalizedItems,
        shippingAddress: {
          contactName: isGift ? recipientName : contactName,
          phoneNumber: isGift ? recipientPhone : customerPhone,
          addressLine1,
          addressLine2: addressLine2 || undefined,
          city,
          postalCode: postalCode || undefined,
        },
        billingAddress: {
          contactName: isGift ? senderName : contactName,
          phoneNumber: isGift ? senderPhone : customerPhone,
          addressLine1,
          addressLine2: addressLine2 || undefined,
          city,
          postalCode: postalCode || undefined,
        },
        customerPhone: isGift ? senderPhone : customerPhone,
        isGift,
        giftMessage: isGift ? giftMessage : undefined,
        giftWrapId: isGift && selectedWrapId ? selectedWrapId : undefined,
        sender: isGift ? { name: senderName, phone: senderPhone } : undefined,
        recipient: isGift ? { name: recipientName, phone: recipientPhone } : undefined,
        revealSender,
        suppressInvoice,
        paymentMethod: selectedPayment as "COD" | "DIRECTPAY" | "MINTPAY",
      };

      // Call checkout API
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.message || "Failed to place order",
          variant: "destructive",
        });
        return;
      }

      // Success - clear cart and navigate
      clearCart();
      
      if (data.redirectUrl) {
        // Future: payment gateway integration
        window.location.href = data.redirectUrl;
      } else {
        // Navigate to order confirmation
        router.push(`/${locale}/orders/${data.orderId}`);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push(`/${locale}/sign-in?callbackUrl=/${locale}/checkout`);
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <CartDrawer />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#1F1720]">Your Cart is Empty</h1>
            <p className="text-[#6B5A64] mt-2">Add some items to checkout</p>
            <Button asChild className="mt-4 bg-[#315243]">
              <Link href="/">Continue Shopping</Link>
            </Button>
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
          <Link href="/" className="inline-flex items-center gap-2 text-[#6B5A64] hover:text-[#A7066A] mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Shopping
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#1F1720] mb-6">Checkout</h1>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Status Alert */}
              {isLoadingConfig ? (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <p className="text-blue-800">Loading shipping configuration...</p>
                  </CardContent>
                </Card>
              ) : !shippingConfig?.isDeliveryEnabled && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="flex gap-3 items-start pt-6">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-800">Delivery is currently disabled. Please try again later.</p>
                  </CardContent>
                </Card>
              )}

              {/* Contact Information */}
              <Card className="border-brand-border">
                <CardHeader>
                  <CardTitle className="text-lg text-[#1F1720]">Checkout Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 rounded-xl border border-brand-border p-3">
                    <Checkbox
                      id="isGift"
                      checked={isGift}
                      onCheckedChange={(checked) => setIsGift(checked as boolean)}
                    />
                    <Label htmlFor="isGift" className="font-normal">
                      This order is a gift
                    </Label>
                  </div>

                  {!isGift ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="contactName" required>Your Name</Label>
                        <Input
                          id="contactName"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Your full name"
                          className="border-brand-border"
                        />
                        {fieldErrors.contactName && <p className="text-sm text-destructive">{fieldErrors.contactName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customerPhone" required>Contact Phone Number</Label>
                        <Input
                          id="customerPhone"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="+94 XX XXX XXXX"
                          className="border-brand-border"
                        />
                        {fieldErrors.customerPhone && <p className="text-sm text-destructive">{fieldErrors.customerPhone}</p>}
                      </div>
                    </>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-4 rounded-xl border border-brand-border p-4">
                        <p className="flex items-center gap-2 text-sm font-semibold text-[#1F1720]"><UserRound className="size-4 text-[#315243]" />Recipient</p>
                        <div className="space-y-2">
                          <Label htmlFor="recipientName" required>Recipient Name</Label>
                          <Input id="recipientName" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Who receives this gift?" />
                          {fieldErrors.recipientName && <p className="text-sm text-destructive">{fieldErrors.recipientName}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="recipientPhone" required>Recipient Phone</Label>
                          <Input id="recipientPhone" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="+94 XX XXX XXXX" />
                          {fieldErrors.recipientPhone && <p className="text-sm text-destructive">{fieldErrors.recipientPhone}</p>}
                        </div>
                      </div>

                      <div className="space-y-4 rounded-xl border border-brand-border p-4">
                        <p className="flex items-center gap-2 text-sm font-semibold text-[#1F1720]"><Gift className="size-4 text-[#315243]" />Sender</p>
                        <div className="space-y-2">
                          <Label htmlFor="senderName" required>Sender Name</Label>
                          <Input id="senderName" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Your name" />
                          {fieldErrors.senderName && <p className="text-sm text-destructive">{fieldErrors.senderName}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="senderPhone" required>Sender Phone</Label>
                          <Input id="senderPhone" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="+94 XX XXX XXXX" />
                          {fieldErrors.senderPhone && <p className="text-sm text-destructive">{fieldErrors.senderPhone}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Delivery Address */}
              <Card className="border-brand-border">
                <CardHeader>
                  <CardTitle className="text-lg text-[#1F1720]">Delivery Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address" required>Address Line 1</Label>
                    <Textarea 
                      id="address" 
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="Street address, apartment, building name..." 
                      className="border-brand-border min-h-[80px]"
                    />
                    {fieldErrors.addressLine1 && <p className="text-sm text-destructive">{fieldErrors.addressLine1}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                    <Input
                      id="addressLine2"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Additional address details"
                      className="border-brand-border"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" required>City</Label>
                      <Select value={city} onValueChange={setCity}>
                        <SelectTrigger className="border-brand-border">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {sriLankanCities.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.city && <p className="text-sm text-destructive">{fieldErrors.city}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code (Optional)</Label>
                      <Input 
                        id="postalCode" 
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="00000" 
                        className="border-brand-border" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gift Options */}
              <Card className="border-brand-border">
                <CardHeader>
                  <CardTitle className="text-lg text-[#1F1720]">Gift Experience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isGift && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="giftMessage">Gift Message</Label>
                        <Textarea
                          id="giftMessage"
                          value={giftMessage}
                          onChange={(e) => setGiftMessage(e.target.value)}
                          placeholder="Write your personal message..."
                          className="border-brand-border min-h-[100px]"
                          maxLength={300}
                        />
                        <p className="text-xs text-[#6B5A64]">{giftMessage.length}/300 characters</p>
                      </div>

                      <div className="space-y-3">
                        <Label>Select Wrapping (Optional)</Label>
                        {wrapOptions.length === 0 ? (
                          <p className="text-sm text-[#6B5A64]">No wrapping options are active right now.</p>
                        ) : (
                          <div className="flex gap-3 overflow-x-auto pb-1">
                            {wrapOptions.map((wrap) => {
                              const selected = selectedWrapId === wrap.id;
                              return (
                                <button
                                  key={wrap.id}
                                  type="button"
                                  onClick={() => setSelectedWrapId((current) => (current === wrap.id ? "" : wrap.id))}
                                  className={`w-52 shrink-0 rounded-xl border p-3 text-left transition-all ${selected ? "border-[#315243] bg-[#FDF9E8]" : "border-brand-border hover:border-[#315243]/50"}`}
                                >
                                  <div className="relative mb-2 h-28 w-full overflow-hidden rounded-lg bg-[#F5F5F5]">
                                    {wrap.imageUrl ? (
                                      <Image src={wrap.imageUrl} alt={wrap.name} fill className="object-cover" />
                                    ) : (
                                      <div className="flex h-full items-center justify-center text-xs text-[#6B5A64]">No image</div>
                                    )}
                                  </div>
                                  <p className="font-medium text-[#1F1720]">{wrap.name}</p>
                                  <p className="text-sm text-[#315243]">{formatPrice(wrap.price)}</p>
                                  {wrap.description ? <p className="mt-1 text-xs text-[#6B5A64] line-clamp-2">{wrap.description}</p> : null}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 rounded-xl border border-brand-border p-3">
                        <label className="flex items-center gap-2 text-sm text-[#1F1720]">
                          <Checkbox checked={revealSender} onCheckedChange={(checked) => setRevealSender(checked as boolean)} />
                          Reveal sender name to recipient
                        </label>
                        <label className="flex items-center gap-2 text-sm text-[#1F1720]">
                          <Checkbox checked={suppressInvoice} onCheckedChange={(checked) => setSuppressInvoice(checked as boolean)} />
                          Do not include invoice in the box
                        </label>
                      </div>
                    </div>
                  )}

                  {!isGift ? <p className="text-sm text-[#6B5A64]">Enable gift mode to add message, sender details, and premium wrapping.</p> : null}
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="border-brand-border">
                <CardHeader>
                  <CardTitle className="text-lg text-[#1F1720]">Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label required className="mb-3 block">Select Payment Method</Label>
                  <RadioGroup
                    value={selectedPayment}
                    onValueChange={setSelectedPayment}
                    className="space-y-3"
                  >
                    {paymentMethods.map((method) => (
                      <Label
                        key={method.id}
                        htmlFor={method.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedPayment === method.id
                            ? "border-[#315243] bg-[#FDF9E8]"
                            : "border-brand-border hover:border-[#315243]/50"
                        }`}
                      >
                        <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                        <div className="w-10 h-10 rounded-full bg-[#FDF9E8] flex items-center justify-center text-[#315243]">
                          {getPaymentIcon(method.icon || "banknote")}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[#1F1720]">{method.name}</p>
                          <p className="text-sm text-[#6B5A64]">{method.description}</p>
                        </div>
                        {selectedPayment === method.id && (
                          <div className="w-6 h-6 rounded-full bg-[#315243] flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </Label>
                    ))}
                  </RadioGroup>
                  {fieldErrors.paymentMethod && <p className="mt-3 text-sm text-destructive">{fieldErrors.paymentMethod}</p>}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-brand-border">
                <CardHeader>
                  <CardTitle className="text-lg text-[#1F1720]">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar mb-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#FCEAF4] flex-shrink-0">
                          <Image
                            src={getItemImage(item) || "/placeholder.jpg"}
                            alt={getItemName(item) || "Product"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-[#1F1720] line-clamp-1">
                            {getItemName(item)}
                          </p>
                          <p className="text-xs text-[#6B5A64]">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-sm font-medium text-[#1F1720]">
                          {formatPrice(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Free Delivery Nudge */}
                  {remainingForFreeDelivery && remainingForFreeDelivery > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-xs text-green-800">
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        Add <strong>{formatPrice(remainingForFreeDelivery)}</strong> more for free delivery!
                      </p>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#6B5A64]">Subtotal</span>
                      <span className="text-[#1F1720]">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B5A64]">Delivery</span>
                      <span className="text-[#1F1720]">
                        {!city ? "Select city" : deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                      </span>
                    </div>
                    {isGift ? (
                      <div className="flex justify-between">
                        <span className="text-[#6B5A64]">Gift Wrapping</span>
                        <span className="text-[#1F1720]">{wrappingFee === 0 ? "Not selected" : formatPrice(wrappingFee)}</span>
                      </div>
                    ) : null}
                    <Separator />
                    <div className="flex justify-between text-base font-semibold">
                      <span className="text-[#1F1720]">Total</span>
                      <span className="text-[#315243]">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-6 bg-gradient-to-r from-[#315243] to-[#9B854A] hover:opacity-90"
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={isProcessing || isLoadingConfig || !shippingConfig?.isDeliveryEnabled}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      `Place Order - ${formatPrice(total)}`
                    )}
                  </Button>

                  {/* Trust Badges */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-[#6B5A64]">
                      <Shield className="w-4 h-4 text-[#315243]" />
                      <span>Secure checkout</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#6B5A64]">
                      <Truck className="w-4 h-4 text-[#315243]" />
                      <span>Island-wide delivery</span>
                    </div>
                  </div>

                  {/* Shipping Note */}
                  {shippingConfig?.deliveryNote && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">{shippingConfig.deliveryNote}</p>
                    </div>
                  )}
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
