import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const createWrapSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  imageUrl: z.string().trim().url("Image URL must be a valid URL").optional().or(z.literal("")),
  price: z.number().min(0, "Price cannot be negative"),
  isActive: z.boolean().optional(),
});

async function authorize() {
  const session = await getServerSession(authOptions);
  return Boolean(session && ["SUPER_ADMIN", "STOREFRONT_ADMIN", "ADMIN"].includes(session.user.role as string));
}

export async function GET() {
  try {
    if (!(await authorize())) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const wraps = await db.giftWrap.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(wraps);
  } catch {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await authorize())) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createWrapSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    const wrap = await db.giftWrap.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        imageUrl: parsed.data.imageUrl || null,
        price: parsed.data.price,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json(wrap, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
