import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: {
        parentId: null, // Top-level categories only for the main navigation
      },
      include: {
        children: true,
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
