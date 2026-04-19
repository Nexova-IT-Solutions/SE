import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function revalidateStorefront() {
  revalidatePath("/");
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "STOREFRONT_ADMIN", "ADMIN"].includes(session.user.role as string)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const occasions = await db.occasion.findMany({
      orderBy: { name: "asc" }
    });

    return NextResponse.json(occasions);
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

    const { name, description, image } = await req.json();

    if (!name) {
      return NextResponse.json({ message: "Occasion name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const newOccasion = await db.occasion.create({
      data: {
        name,
        slug,
        description,
        image
      }
    });

    revalidateStorefront();

    return NextResponse.json(newOccasion, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "Occasion with this name or slug already exists" }, { status: 409 });
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

    const { id, name, description, image, isActive, isPopular } = await req.json();
    if (!id) return NextResponse.json({ message: "Missing occasion ID" }, { status: 400 });

    const updated = await db.occasion.update({
      where: { id },
      data: {
        ...(name && { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image: image || null }),
        ...(isActive !== undefined && { isActive }),
        ...(isPopular !== undefined && { isPopular }),
      }
    });

    revalidateStorefront();

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
    if (!id) return NextResponse.json({ message: "Missing occasion ID" }, { status: 400 });

    await db.occasion.delete({ where: { id } });
    revalidateStorefront();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
