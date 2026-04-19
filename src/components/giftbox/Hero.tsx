"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Shirt, Heart, Tag } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-white to-[#F4FAF8]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-[#49A389]/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-[#CFB53B]/10 blur-3xl" />
        <div className="absolute top-40 right-1/4 w-24 h-24 rounded-full bg-[#49A389]/10 blur-2xl" />
      </div>

      <div className="relative max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 2xl:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 2xl:gap-20 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#315243]/10 text-[#315243] text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Sri Lanka&apos;s Premium Fashion Destination
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl 2xl:text-7xl font-bold text-[#1F1720] leading-tight">
              Elevate Your Every{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#315243] to-[#9B854A]">
                Style & Look
              </span>
            </h1>
            
            <p className="mt-6 text-lg text-[#6B5A64] max-w-xl 2xl:max-w-2xl mx-auto lg:mx-0">
              Discover curated menswear, elegant womenswear, and exclusive accessories. 
              Find the perfect outfit that expresses exactly who you are.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-[#315243] to-[#9B854A] hover:opacity-90 text-white rounded-full px-10"
              >
                <Link href="/categories" className="gap-2">
                  Shop Collection
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#F4FAF8] flex items-center justify-center">
                  <Shirt className="w-5 h-5 text-[#315243]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#1F1720]">1000+</p>
                  <p className="text-xs text-[#6B5A64]">Styles Available</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#F4FAF8] flex items-center justify-center">
                  <Heart className="w-5 h-5 text-[#315243]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#1F1720]">5,000+</p>
                  <p className="text-xs text-[#6B5A64]">Happy Clients</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#F4FAF8] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#315243]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#1F1720]">Island-wide</p>
                  <p className="text-xs text-[#6B5A64]">Delivery</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Fashion Image Collage */}
          <div className="relative hidden lg:block">
            <div className="relative w-full aspect-square">
              {/* Main Image */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <Image
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=1000&fit=crop"
                  alt="Elegant Fashion"
                  fill
                  priority
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Secondary Images */}
              <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-2xl overflow-hidden shadow-xl transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                <Image
                  src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=400&fit=crop"
                  alt="Womenswear"
                  fill
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-40 h-40 rounded-2xl overflow-hidden shadow-xl transform rotate-6 hover:rotate-0 transition-transform duration-300">
                <Image
                  src="https://images.unsplash.com/photo-1491336477066-31156b5e4f35?w=400&h=400&fit=crop"
                  alt="Menswear"
                  fill
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating Badge */}
              <div className="absolute bottom-12 right-12 bg-white rounded-full px-6 py-3 shadow-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#315243]" />
                <span className="font-semibold text-[#1F1720]">Curated Looks</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
