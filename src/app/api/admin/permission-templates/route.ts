import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const templates = await db.permissionTemplate.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Fetch templates error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, permissions } = body;

    if (!name || !permissions) {
      return NextResponse.json({ message: "Name and permissions are required" }, { status: 400 });
    }

    const existing = await db.permissionTemplate.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ message: "Template with this name already exists" }, { status: 409 });
    }

    const template = await db.permissionTemplate.create({
      data: {
        name,
        permissions,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
