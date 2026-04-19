import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "STOREFRONT_ADMIN", "ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { imageUrl, isActive } = body;

    // Check if banner exists
    const existingBanner = await db.promoBanner.findUnique({
      where: { id }
    });

    if (!existingBanner) {
      return NextResponse.json({ message: "Banner not found" }, { status: 404 });
    }

    const updatedBanner = await db.promoBanner.update({
      where: { id },
      data: {
        ...(imageUrl && { imageUrl }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json(updatedBanner);
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "STOREFRONT_ADMIN", "ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;

    // Check if banner exists
    const existingBanner = await db.promoBanner.findUnique({
      where: { id }
    });

    if (!existingBanner) {
      return NextResponse.json({ message: "Banner not found" }, { status: 404 });
    }

    await db.promoBanner.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
