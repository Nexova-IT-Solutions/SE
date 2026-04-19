import { Header, Footer, SectionHeading, CartDrawer } from "@/components/giftbox";
import { db } from "@/lib/db";
import { CreditCard, ShoppingCart, Sparkles } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function GiftCardPage() {
  const giftCards = await db.giftCard.findMany({
    where: { isActive: true },
    orderBy: { initialValue: "asc" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartDrawer />
      <main className="flex-1 py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto w-full">
        <SectionHeading title="Gift Cards" subtitle="Give the gift of choice" />
        
        {giftCards.length === 0 ? (
          <div className="py-20 text-center text-[#6B5A64]">
            Gift Cards Coming Soon. Check back later!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {giftCards.map((gc) => (
              <div key={gc.id} className="group bg-white rounded-2xl border border-brand-border hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col relative h-full">
                
                {/* Image Section */}
                <div className="relative aspect-[16/10] bg-gradient-to-br from-[#FCEAF4] to-[#fde2ee] overflow-hidden flex items-center justify-center p-6">
                  {gc.image ? (
                    <Image
                      src={gc.image}
                      alt={`Gift Card ${gc.initialValue}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-center">
                      <CreditCard className="w-16 h-16 text-[#A7066A] opacity-40 mx-auto mb-2" />
                      <div className="font-bold text-[#A7066A] text-xl opacity-80">{gc.currency} {gc.initialValue.toLocaleString()}</div>
                    </div>
                  )}
                  
                  {/* Decorative Sparkles */}
                  <Sparkles className="absolute top-4 right-4 text-[#A7066A] opacity-20 w-5 h-5" />
                  <Sparkles className="absolute bottom-4 left-4 text-[#A7066A] opacity-20 w-4 h-4" />
                </div>

                {/* Content Section */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-bold text-[#1F1720] text-xl group-hover:text-[#A7066A] transition-colors">
                    {gc.currency} {gc.initialValue.toLocaleString()} Digital Gift Card
                  </h3>
                  <p className="text-sm text-[#6B5A64] mt-2 mb-6 line-clamp-2">
                    Give them the perfect gift of choice. This premium digital gift card can be used across any items at Giftbox.lk.
                  </p>
                  
                  {/* Bottom Action Area */}
                  <div className="mt-auto flex items-center justify-between border-t border-brand-border pt-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-[#6B5A64] uppercase font-bold tracking-wider">Price</span>
                      <span className="text-xl font-bold text-[#A7066A]">
                        {gc.currency} {gc.initialValue.toLocaleString()}
                      </span>
                    </div>
                    {/* Note: The functionality to add Gift Cards to Cart might require a client-side wrapper in the future */}
                    <Button
                      className="bg-[#1F1720] hover:bg-[#A7066A] text-white rounded-full transition-colors flex items-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Purchase
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
