import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !["SUPER_ADMIN", "ADMIN", "STOREFRONT_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  const pendingOrders = await db.order.count({ where: { orderStatus: "PENDING" } });

  return NextResponse.json({ success: true, pendingOrders });
}
