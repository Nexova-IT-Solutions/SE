"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header, Footer, CartDrawer } from "@/components/giftbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  boxTypes, 
  boxBuilderItems, 
  wrappingOptions, 
  noteStyles,
  getBuilderItemsByCategory 
} from "@/data";
import { useBoxBuilderStore, useCartStore } from "@/store";
import { BoxBuilderItem, CustomBoxItem } from "@/types";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  Sparkles,
  Package,
  MessageSquare,
  Gift,
  ShoppingBag
} from "lucide-react";

const steps = [
  { id: 1, name: "Select Box", icon: Package },
  { id: 2, name: "Add Items", icon: Gift },
  { id: 3, name: "Message", icon: MessageSquare },
  { id: 4, name: "Wrap & Note", icon: Sparkles },
  { id: 5, name: "Review", icon: ShoppingBag },
];

const itemCategories = [
  { id: "chocolate", name: "Chocolates", icon: "🍫" },
  { id: "gift", name: "Gifts", icon: "🎁" },
  { id: "flower", name: "Flowers", icon: "💐" },
  { id: "teddy", name: "Teddies", icon: "🧸" },
  { id: "card", name: "Cards", icon: "💌" },
  { id: "addon", name: "Add-ons", icon: "✨" },
];

export default function BoxBuilderPage() {
  const {
    currentStep,
    selectedBox,
    items,
    message,
    selectedWrapping,
    selectedNoteStyle,
    setStep,
    nextStep,
    prevStep,
    selectBox,
    addItem,
    removeItem,
    updateItemQuantity,
    setMessage,
    selectWrapping,
    selectNoteStyle,
    reset,
    getUsedCapacity,
    getRemainingCapacity,
    getTotal,
    canAddItem,
  } = useBoxBuilderStore();

  const { addCustomBox, openCart } = useCartStore();
  const [activeCategory, setActiveCategory] = useState<string>("chocolate");
  const [showSuccess, setShowSuccess] = useState(false);

  const formatPrice = (price: number) => `LKR ${price.toLocaleString()}`;
  const usedCapacity = getUsedCapacity();
  const remainingCapacity = getRemainingCapacity();
  const total = getTotal();

  const handleAddToCart = () => {
    if (!selectedBox) return;
    
    addCustomBox({
      boxType: selectedBox,
      items,
      message: message || undefined,
      wrapping: selectedWrapping || undefined,
      noteStyle: selectedNoteStyle || undefined,
    });
    
    reset();
    openCart();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedBox !== null;
      case 2:
        return items.length > 0;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const filteredItems = getBuilderItemsByCategory(activeCategory as BoxBuilderItem["category"]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartDrawer />
      
      <main className="flex-1">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10 py-6">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#315243]/10 to-[#315243/90]/10 text-[#315243] text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Create Your Perfect Gift
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1720]">Build Your Own Gift Box</h1>
            <p className="text-[#6B5A64] mt-2 max-w-xl mx-auto">
              Customize every detail to create a truly personal gift
            </p>
          </div>

          {/* Stepper */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => step.id <= currentStep && setStep(step.id)}
                    className={`flex flex-col items-center ${
                      step.id <= currentStep ? "cursor-pointer" : "cursor-not-allowed"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        step.id < currentStep
                          ? "bg-[#315243] text-white"
                          : step.id === currentStep
                          ? "bg-gradient-to-r from-[#315243] to-[#315243/90] text-white shadow-lg"
                          : "bg-[#FCEAF4] text-[#6B5A64]"
                      }`}
                    >
                      {step.id < currentStep ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs sm:text-sm mt-2 hidden sm:block ${
                        step.id === currentStep ? "text-[#315243] font-medium" : "text-[#6B5A64]"
                      }`}
                    >
                      {step.name}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded-full ${
                        step.id < currentStep ? "bg-[#315243]" : "bg-[#EBC9DB]"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Step 1: Select Box */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[#1F1720]">Choose Your Box Size</h2>
                  <p className="text-[#6B5A64]">Select the perfect box for your gift</p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {boxTypes.map((box) => (
                      <Card
                        key={box.id}
                        className={`cursor-pointer transition-all ${
                          selectedBox?.id === box.id
                            ? "ring-2 ring-[#315243] border-[#315243]"
                            : "hover:border-[#315243]/50"
                        }`}
                        onClick={() => selectBox(box)}
                      >
                        <CardContent className="p-4">
                          <div className="relative aspect-square rounded-lg overflow-hidden bg-[#FCEAF4] mb-3">
                            <Image
                              src={box.image}
                              alt={box.name}
                              fill
                              className="object-cover"
                            />
                            {selectedBox?.id === box.id && (
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-[#315243] text-white border-0">
                                  <Check className="w-3 h-3 mr-1" /> Selected
                                </Badge>
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold text-[#1F1720]">{box.name}</h3>
                          <p className="text-sm text-[#6B5A64] mt-1">{box.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-lg font-bold text-[#315243]">
                              {formatPrice(box.basePrice)}
                            </span>
                            <Badge variant="outline" className="border-brand-border">
                              {box.capacity} items
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Add Items */}
              {currentStep === 2 && selectedBox && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-[#1F1720]">Add Items to Your Box</h2>
                      <p className="text-[#6B5A64]">Capacity: {usedCapacity} / {selectedBox.capacity}</p>
                    </div>
                  </div>

                  {/* Capacity Progress */}
                  <div className="p-4 rounded-xl bg-[#FCEAF4]/50 border border-brand-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#1F1720]">Box Capacity</span>
                      <span className="text-sm text-[#6B5A64]">{remainingCapacity} slots remaining</span>
                    </div>
                    <Progress 
                      value={(usedCapacity / selectedBox.capacity) * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Category Tabs */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {itemCategories.map((cat) => (
                      <Button
                        key={cat.id}
                        variant={activeCategory === cat.id ? "default" : "outline"}
                        className={`flex-shrink-0 ${
                          activeCategory === cat.id
                            ? "bg-[#315243] hover:bg-[#315243/80]"
                            : "border-brand-border"
                        }`}
                        onClick={() => setActiveCategory(cat.id)}
                      >
                        <span className="mr-2">{cat.icon}</span>
                        {cat.name}
                      </Button>
                    ))}
                  </div>

                  {/* Items Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredItems.map((item) => {
                      const inBox = items.find(i => i.item.id === item.id);
                      const canAdd = canAddItem(item);
                      
                      return (
                        <Card
                          key={item.id}
                          className={`overflow-hidden ${
                            inBox ? "ring-1 ring-[#315243]" : ""
                          } ${!canAdd && !inBox ? "opacity-50" : ""}`}
                        >
                          <CardContent className="p-3">
                            <div className="relative aspect-square rounded-lg overflow-hidden bg-[#FCEAF4] mb-2">
                              <Image
                                src={item.images[0]}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                              <Badge className="absolute top-1 right-1 bg-white/90 text-[#315243] border-0 text-xs">
                                {item.capacityUnits} slot{item.capacityUnits > 1 ? "s" : ""}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-sm text-[#1F1720] line-clamp-1">{item.name}</h4>
                            <p className="text-xs text-[#6B5A64] line-clamp-1">{item.shortDescription}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-semibold text-[#315243] text-sm">
                                {formatPrice(item.price)}
                              </span>
                              {inBox ? (
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-7 h-7"
                                    onClick={() => updateItemQuantity(item.id, inBox.quantity - 1)}
                                    disabled={inBox.quantity <= 1}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="w-6 text-center text-sm font-medium">{inBox.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-7 h-7"
                                    onClick={() => addItem(item)}
                                    disabled={!canAdd}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  className="bg-[#315243] hover:bg-[#315243/80] text-white h-7"
                                  onClick={() => addItem(item)}
                                  disabled={!canAdd}
                                >
                                  <Plus className="w-3 h-3 mr-1" /> Add
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Message */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[#1F1720]">Add a Personal Message</h2>
                  <p className="text-[#6B5A64]">Write a heartfelt message to make your gift extra special</p>
                  
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Write your message here... (optional)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[200px] border-brand-border focus:border-[#315243] resize-none"
                      maxLength={500}
                    />
                    <p className="text-sm text-[#6B5A64] text-right">{message.length}/500 characters</p>
                    
                    {message && (
                      <div className="p-4 rounded-xl bg-[#FCEAF4] border border-brand-border">
                        <p className="text-sm font-medium text-[#6B5A64] mb-2">Preview:</p>
                        <div className="p-4 bg-white rounded-lg border border-brand-border">
                          <p className="text-[#1F1720] whitespace-pre-wrap">{message}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Wrap & Note */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-[#1F1720]">Choose Wrapping Style</h2>
                    <p className="text-[#6B5A64] mt-1">Select how you want your gift wrapped</p>
                    <div className="grid sm:grid-cols-2 gap-3 mt-4">
                      {wrappingOptions.map((wrap) => (
                        <Card
                          key={wrap.id}
                          className={`cursor-pointer transition-all ${
                            selectedWrapping?.id === wrap.id
                              ? "ring-2 ring-[#315243] border-[#315243]"
                              : "hover:border-[#315243]/50"
                          }`}
                          onClick={() => selectWrapping(wrap)}
                        >
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#FCEAF4] flex-shrink-0">
                              <Image src={wrap.image || ""} alt={wrap.name} fill className="object-cover" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-[#1F1720]">{wrap.name}</h3>
                              <p className="text-sm text-[#6B5A64]">{wrap.description}</p>
                              <span className="text-sm font-semibold text-[#315243]">
                                {formatPrice(wrap.price)}
                              </span>
                            </div>
                            {selectedWrapping?.id === wrap.id && (
                              <Check className="w-5 h-5 text-[#315243]" />
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <h2 className="text-xl font-semibold text-[#1F1720]">Select Note Style</h2>
                    <p className="text-[#6B5A64] mt-1">Choose a card style for your message</p>
                    <div className="grid sm:grid-cols-3 gap-3 mt-4">
                      {noteStyles.map((note) => (
                        <Card
                          key={note.id}
                          className={`cursor-pointer transition-all ${
                            selectedNoteStyle?.id === note.id
                              ? "ring-2 ring-[#315243] border-[#315243]"
                              : "hover:border-[#315243]/50"
                          }`}
                          onClick={() => selectNoteStyle(note)}
                        >
                          <CardContent className="p-3 text-center">
                            <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden bg-[#FCEAF4] mb-2">
                              <Image src={note.image || ""} alt={note.name} fill className="object-cover" />
                            </div>
                            <h3 className="font-medium text-sm text-[#1F1720]">{note.name}</h3>
                            <span className="text-sm text-[#315243]">{formatPrice(note.price)}</span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && selectedBox && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[#1F1720]">Review Your Gift Box</h2>
                  
                  <Card className="border-brand-border">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Box Info */}
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-xl bg-[#FCEAF4] overflow-hidden relative">
                            <Image src={selectedBox.image} alt={selectedBox.name} fill className="object-cover" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#1F1720]">{selectedBox.name}</h3>
                            <p className="text-sm text-[#6B5A64]">{selectedBox.description}</p>
                            <span className="text-sm font-medium text-[#315243]">{formatPrice(selectedBox.basePrice)}</span>
                          </div>
                        </div>

                        <Separator />

                        {/* Items */}
                        <div>
                          <h4 className="font-medium text-[#1F1720] mb-3">Items ({items.length})</h4>
                          <div className="space-y-3">
                            {items.map((item) => (
                              <div key={item.item.id} className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-[#FCEAF4] overflow-hidden relative">
                                  <Image src={item.item.images[0]} alt={item.item.name} fill className="object-cover" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-[#1F1720]">{item.item.name}</p>
                                  <p className="text-sm text-[#6B5A64]">Qty: {item.quantity}</p>
                                </div>
                                <span className="font-medium text-[#315243]">
                                  {formatPrice(item.item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Message */}
                        {message && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="font-medium text-[#1F1720] mb-2">Message</h4>
                              <p className="text-[#6B5A64] bg-[#FCEAF4] p-3 rounded-lg">{message}</p>
                            </div>
                          </>
                        )}

                        {/* Wrapping & Note */}
                        {(selectedWrapping || selectedNoteStyle) && (
                          <>
                            <Separator />
                            <div className="flex gap-6">
                              {selectedWrapping && (
                                <div>
                                  <h4 className="font-medium text-[#1F1720] mb-1">Wrapping</h4>
                                  <p className="text-sm text-[#6B5A64]">{selectedWrapping.name}</p>
                                </div>
                              )}
                              {selectedNoteStyle && (
                                <div>
                                  <h4 className="font-medium text-[#1F1720] mb-1">Note Style</h4>
                                  <p className="text-sm text-[#6B5A64]">{selectedNoteStyle.name}</p>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Sidebar - Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-brand-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-[#1F1720] mb-4">Order Summary</h3>
                  
                  {selectedBox && (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#6B5A64]">{selectedBox.name}</span>
                        <span className="text-[#1F1720]">{formatPrice(selectedBox.basePrice)}</span>
                      </div>
                      
                      {items.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-[#6B5A64]">Items ({items.reduce((sum, i) => sum + i.quantity, 0)})</span>
                          <span className="text-[#1F1720]">{formatPrice(items.reduce((sum, i) => sum + i.item.price * i.quantity, 0))}</span>
                        </div>
                      )}
                      
                      {selectedWrapping && (
                        <div className="flex justify-between">
                          <span className="text-[#6B5A64]">Wrapping</span>
                          <span className="text-[#1F1720]">{formatPrice(selectedWrapping.price)}</span>
                        </div>
                      )}
                      
                      {selectedNoteStyle && (
                        <div className="flex justify-between">
                          <span className="text-[#6B5A64]">Note Card</span>
                          <span className="text-[#1F1720]">{formatPrice(selectedNoteStyle.price)}</span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between text-base font-semibold">
                        <span className="text-[#1F1720]">Total</span>
                        <span className="text-[#315243]">{formatPrice(total)}</span>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="mt-6 space-y-3">
                    {currentStep > 1 && (
                      <Button
                        variant="outline"
                        className="w-full border-brand-border"
                        onClick={prevStep}
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>
                    )}
                    
                    {currentStep < 5 ? (
                      <Button
                        className="w-full bg-[#315243] hover:bg-[#315243/80]"
                        onClick={nextStep}
                        disabled={!canProceed()}
                      >
                        Next Step
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-gradient-to-r from-[#315243] to-[#315243/90] hover:opacity-90"
                        onClick={handleAddToCart}
                        disabled={!canProceed()}
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Add to Cart - {formatPrice(total)}
                      </Button>
                    )}
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
