import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET() {
  try {
    const wraps = await db.giftWrap.findMany({
      where: { isActive: true },
      orderBy: [{ price: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        price: true,
      },
    });

    return NextResponse.json({ success: true, data: wraps });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to fetch wrapping options" }, { status: 500 });
  }
}
