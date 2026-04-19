import Image from "next/image";
import { db } from "@/lib/db";

interface PromoBannerProps {
  bannerKey: "promo_1" | "promo_2";
}

export async function PromoBanner({ bannerKey }: PromoBannerProps) {
  try {
    const banner = await db.promoBanner.findUnique({
      where: { key: bannerKey },
    });

    // If banner doesn't exist or is inactive, render nothing
    if (!banner || !banner.isActive) {
      return null;
    }

    return (
      <section className="py-8 px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto">
        <div className="relative overflow-hidden rounded-3xl h-48 md:h-64 lg:h-72">
          <Image
            src={banner.imageUrl}
            alt={banner.key}
            fill
            className="object-cover"
            priority={false}
          />
        </div>
      </section>
    );
  } catch (error) {
    console.error(`Error fetching promotional banner ${bannerKey}:`, error);
    return null;
  }
}
