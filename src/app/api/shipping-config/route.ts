import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureShippingConfig } from "@/lib/shipping-config";

/**
 * GET /api/shipping-config
 * Public endpoint to fetch shipping configuration
 * Guarantees a default config exists via upsert
 */
export async function GET(request: NextRequest) {
  try {
    const config = await ensureShippingConfig(db as any);

    return NextResponse.json(
      {
        success: true,
        data: config,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[shipping-config] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch shipping configuration",
      },
      { status: 500 }
    );
  }
}
