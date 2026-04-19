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

    const categories = await db.category.findMany({
      include: {
        children: true, 
        parent: true
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(categories);
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
    const { name, description, image, parentId } = body;

    if (!name) {
      return NextResponse.json({ message: "Category name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const newCategory = await db.category.create({
      data: {
        name,
        slug,
        description,
        image,
        parentId: parentId || null
      },
      include: {
        parent: true,
        children: true
      }
    });

    revalidateStorefront();

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "Category with this name or slug already exists" }, { status: 409 });
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

    const { id, name, description, image, parentId, isActive, isPopular } = await req.json();
    if (!id) return NextResponse.json({ message: "Missing category ID" }, { status: 400 });

    const updated = await db.category.update({
      where: { id },
      data: {
        ...(name && { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(isActive !== undefined && { isActive }),
        ...(isPopular !== undefined && { isPopular }),
      },
      include: {
        parent: true,
        children: true
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
    if (!id) return NextResponse.json({ message: "Missing category ID" }, { status: 400 });

    await db.category.delete({ where: { id } });
    revalidateStorefront();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
