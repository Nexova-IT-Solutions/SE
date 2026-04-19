import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "STOREFRONT_ADMIN", "ADMIN"].includes(session.user.role as string)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const giftCards = await db.giftCard.findMany({
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(giftCards);
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "STOREFRONT_ADMIN", "ADMIN"].includes(session.user.role as string)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { code, initialValue, currency, image, expiresAt } = body;

    if (!code || !initialValue) {
      return NextResponse.json({ message: "Code and initial value are required" }, { status: 400 });
    }

    const newGiftCard = await db.giftCard.create({
      data: {
        code,
        initialValue: parseFloat(initialValue),
        balance: parseFloat(initialValue),
        currency: currency || "LKR",
        image: image || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }
    });

    return NextResponse.json(newGiftCard, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "Gift card with this code already exists" }, { status: 409 });
    }
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "STOREFRONT_ADMIN", "ADMIN"].includes(session.user.role as string)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id, code, balance, isActive, image, expiresAt } = await req.json();
    if (!id) return NextResponse.json({ message: "Missing gift card ID" }, { status: 400 });

    const updated = await db.giftCard.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(balance !== undefined && { balance: parseFloat(balance) }),
        ...(isActive !== undefined && { isActive }),
        ...(image !== undefined && { image }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "STOREFRONT_ADMIN", "ADMIN"].includes(session.user.role as string)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) return NextResponse.json({ message: "Missing gift card ID" }, { status: 400 });

    await db.giftCard.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
