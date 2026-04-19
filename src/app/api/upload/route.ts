import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const pathPrefix = formData.get("path") as string || "general";

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure the upload directory exists
    const publicDir = join(process.cwd(), "public");
    const uploadDir = join(publicDir, "uploads", pathPrefix);
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Math.random().toString(36).substring(2, 12)}_${Date.now()}.${fileExt}`;
    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/${pathPrefix}/${fileName}`;
    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("Local Upload Error:", error);
    return NextResponse.json({ message: "Upload failed", error: error.message }, { status: 500 });
  }
}
