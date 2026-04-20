import type { Metadata } from "next";
export const revalidate = 3600;

import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {locales} from '@/i18n/config';
import { db } from "@/lib/db";
import { normalizeSpecialTouchProducts } from "@/lib/special-touch";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skyish & Earthly - Premium Fashion & Apparel in Sri Lanka",
  description: "Discover the perfect style at Skyish & Earthly. Shop curated clothing, build your own style bundles, and elevate your fashion game across Sri Lanka.",
  keywords: ["menswear Sri Lanka", "womenswear", "luxury fashion", "activewear", "fashion delivery Sri Lanka", "Skyish & Earthly"],
  authors: [{ name: "Skyish & Earthly" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Skyish & Earthly - Premium Fashion & Luxury Apparel",
    description: "Curated fashion collections and personalized style bundles for every occasion in Sri Lanka",
    type: "website",
    locale: "en_LK",
  },
};

import { Providers } from "@/components/Providers";
import { CartStoreHydrator } from "@/components/cart/cart-store-hydrator";
import WhatsAppFloating from "@/components/WhatsAppFloating";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = await params;
  
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  let specialTouchProducts = [];

  try {
    const rows = await db.product.findMany({
      where: {
        isActive: true,
        isSpecialTouch: true,
        stock: {
          gt: 0,
        },
      },
      orderBy: [{ specialTouchOrder: "asc" }, { createdAt: "desc" }],
      take: 4,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        salePrice: true,
        stock: true,
        categoryId: true,
        productImages: true,
        specialTouchOrder: true,
      },
    });

    specialTouchProducts = normalizeSpecialTouchProducts(rows);
  } catch (error) {
    // Temporary fallback until the Product schema change is applied in all environments.
    console.warn("Failed to load special touch products:", error);
    specialTouchProducts = [];
  }
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <NextIntlClientProvider messages={messages}>
          <NuqsAdapter>
            <Providers>
              <CartStoreHydrator specialTouchProducts={specialTouchProducts} />
              {children}
              <WhatsAppFloating />
              <Toaster />
            </Providers>
          </NuqsAdapter>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
