import { Header, Footer, SectionHeading, CartDrawer } from "@/components/giftbox";

export default function GiftBoxesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartDrawer />
      <main className="flex-1 py-12 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto w-full">
        <SectionHeading title="Gift Boxes" subtitle="Curated gift boxes for every occasion" />
        <div className="py-20 text-center text-[#6B5A64]">
          Gift Boxes Coming Soon
        </div>
      </main>
      <Footer />
    </div>
  );
}
