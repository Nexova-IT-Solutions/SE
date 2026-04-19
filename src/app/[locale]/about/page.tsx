import { Header, Footer, CartDrawer, SectionHeading } from "@/components/giftbox";
import Image from "next/image";
import { Sparkles, Heart, Leaf, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartDrawer />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 bg-[#1A3026] overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#9B854A] rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#315243] rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>
          </div>
          
          <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10 relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tighter uppercase">
              Skyish & Earthly
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto font-medium leading-relaxed">
              Curating elegance for the modern individual. A fusion of celestial inspiration and grounded craftsmanship.
            </p>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20 px-4 md:px-8 lg:px-10 max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-2 border-brand-border group">
              <Image 
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2670&auto=format&fit=crop" 
                alt="Our Boutique Story" 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-[#315243]/20 mix-blend-overlay"></div>
            </div>
            
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#315243]/5 border border-[#315243]/10 text-[#315243] font-bold text-sm uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                Our Story
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[#1F1720] leading-tight tracking-tighter">
                Born from a passion for <span className="text-[#315243]">Timeless Style</span>
              </h2>
              <p className="text-lg text-[#6B5A64] leading-relaxed">
                Skyish & Earthly was founded in Colombo with a simple vision: to bridge the gap between high-end luxury and wearable art. We believe that what you wear is a reflection of your journey—a balance between your highest aspirations (Skyish) and your authentic self (Earthly).
              </p>
              <p className="text-lg text-[#6B5A64] leading-relaxed">
                Every piece in our collection is hand-selected and curated with meticulous attention to detail. From our signature accessories to our premium gift boxes, we prioritize quality, sustainability, and the unique stories our customers tell.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-4">
                <div>
                  <h4 className="text-3xl font-black text-[#315243]">5000+</h4>
                  <p className="text-sm font-bold text-[#6B5A64] uppercase tracking-wider">Happy Customers</p>
                </div>
                <div>
                  <h4 className="text-3xl font-black text-[#315243]">100%</h4>
                  <p className="text-sm font-bold text-[#6B5A64] uppercase tracking-wider">Curated Goods</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-[#FDF9E8]/30">
          <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-[#1F1720] uppercase tracking-tighter">Our Core Values</h2>
              <div className="w-24 h-1 bg-[#9B854A] mx-auto mt-4 rounded-full"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Star className="w-8 h-8" />,
                  title: "Excellence",
                  text: "We never compromise on quality. Every stitch, every box, and every interaction is handled with the highest standards of boutique service."
                },
                {
                  icon: <Heart className="w-8 h-8" />,
                  title: "Personal Touch",
                  text: "Style is personal. Our team is dedicated to helping you find the perfect expression of yourself through our personalized collections."
                },
                {
                  icon: <Leaf className="w-8 h-8" />,
                  title: "Conscious Choice",
                  text: "We support ethical craftsmanship and strive to source materials that are as kind to the Earth as they are beautiful."
                }
              ].map((value, i) => (
                <div key={i} className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-brand-border hover:translate-y-[-8px] transition-all duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-[#315243]/5 flex items-center justify-center text-[#315243] mb-6">
                    {value.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-[#1F1720] mb-4">{value.title}</h3>
                  <p className="text-[#6B5A64] leading-relaxed font-medium">
                    {value.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4">
          <div className="max-w-[1200px] mx-auto bg-[#315243] rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#FDF9E8]/5 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2"></div>
             <h2 className="text-3xl md:text-5xl font-black text-white mb-8 leading-tight tracking-tighter">
               Experience the <span className="text-[#9B854A]">Skyish & Earthly</span> Lifestyle
             </h2>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <Button asChild className="h-14 px-10 bg-white text-[#315243] hover:bg-[#FDF9E8] rounded-2xl text-lg font-bold">
                 <Link href="/categories">Shop Collections</Link>
               </Button>
               <Button asChild variant="outline" className="h-14 px-10 border-2 border-white/30 bg-transparent text-white hover:bg-white hover:text-[#315243] rounded-2xl text-lg font-bold transition-all">
                 <Link href="/contact">Contact Us</Link>
               </Button>
             </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
