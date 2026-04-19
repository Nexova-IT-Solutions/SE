"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Occasion } from "@/types";

interface OccasionCardProps {
  occasion: Occasion;
  variant?: "default" | "compact" | "wide";
}

export function OccasionCard({ occasion, variant = "default" }: OccasionCardProps) {
  if (variant === "wide") {
    return (
      <Link
        href={`/occasion/${occasion.slug}`}
        className="relative overflow-hidden rounded-2xl aspect-[21/9] group"
      >
        <Image
          src={occasion.image || "/placeholder.jpg"}
          alt={occasion.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
          style={{ 
            background: `linear-gradient(to top, ${occasion.color}CC, ${occasion.color}40, transparent)` 
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-2xl font-bold text-white">{occasion.name}</h3>
          {occasion.description && (
            <p className="text-white/90 mt-1">{occasion.description}</p>
          )}
          <div className="flex items-center gap-1 text-white mt-2 group-hover:translate-x-1 transition-transform">
            <span className="text-sm font-medium">Shop Gifts</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        href={`/occasion/${occasion.slug}`}
        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-brand-border hover:border-[#CFB53B] hover:shadow-md transition-all group"
      >
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-[#FDF9E8]">
          <Image
            src={occasion.image || "/placeholder.jpg"}
            alt={occasion.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        <span className="text-sm font-medium text-[#1F1720] group-hover:text-[#CFB53B] transition-colors text-center">
          {occasion.name}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={`/occasion/${occasion.slug}`}
      className="block relative overflow-hidden rounded-2xl aspect-[4/5] group"
    >
      <Image
        src={occasion.image || "/placeholder.jpg"}
        alt={occasion.name}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div 
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
        style={{ 
          background: `linear-gradient(to top, ${occasion.color || '#315243'}CC, transparent)` 
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-lg font-bold text-white">{occasion.name}</h3>
        {occasion.description && (
          <p className="text-sm text-white/90 mt-1 line-clamp-2">{occasion.description}</p>
        )}
      </div>
    </Link>
  );
}
