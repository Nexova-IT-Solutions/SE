import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ALLOWED_BANNER_KEYS = ["promo_1", "promo_2"] as const;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "STOREFRONT_ADMIN", "ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const banners = await db.promoBanner.findMany({
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "STOREFRONT_ADMIN", "ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const normalizedKey = String(body?.key ?? "").trim().toLowerCase();
    const imageUrl = String(body?.imageUrl ?? "").trim();
    const isActive = body?.isActive;

    if (!normalizedKey || !imageUrl) {
      return NextResponse.json({ message: "Key and imageUrl are required" }, { status: 400 });
    }

    if (!ALLOWED_BANNER_KEYS.includes(normalizedKey as (typeof ALLOWED_BANNER_KEYS)[number])) {
      return NextResponse.json(
        { message: "Invalid banner key. Allowed keys: promo_1, promo_2" },
        { status: 400 }
      );
    }

    // Check if banner with this key already exists
    const existingBanner = await db.promoBanner.findUnique({
      where: { key: normalizedKey }
    });

    if (existingBanner) {
      return NextResponse.json({ message: "Banner with this key already exists" }, { status: 409 });
    }

    const newBanner = await db.promoBanner.create({
      data: {
        key: normalizedKey,
        imageUrl,
        isActive: isActive ?? true
      }
    });

    return NextResponse.json(newBanner, { status: 201 });
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
