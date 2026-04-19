import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

function extractStoragePathFromPublicUrl(publicUrl: string, bucket: string): string | null {
  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(url.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

export async function deleteFileByPublicUrl(publicUrl: string, bucket = "giftbox"): Promise<void> {
  // If it's a local upload path, we handle it differently (or ignore for now)
  if (publicUrl.startsWith("/uploads/")) {
    console.log("Local file deletion requested for:", publicUrl);
    // TODO: Implement local fs.unlink if needed
    return;
  }

  const existingPath = extractStoragePathFromPublicUrl(publicUrl, bucket);
  if (!existingPath) return;

  try {
    const { error } = await supabase.storage.from(bucket).remove([existingPath]);
    if (error) {
      console.warn("Supabase remove warning:", error.message);
    }
  } catch (err) {
    console.error("Delete Error:", err);
  }
}

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * @param file The File object or a string URL (if string, returns as is).
 * @param path The path/prefix within the 'public' bucket.
 */
export async function uploadFile(
  file: File | string,
  path: string,
  options?: { replacePublicUrl?: string; bucket?: string }
): Promise<string> {
  if (typeof file === "string") return file;
  
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", path);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Local upload failed");
    }

    const data = await response.json();
    return data.url;
  } catch (error: any) {
    console.error("Local Upload Error:", error);
    throw new Error(`Failed to upload file locally: ${error.message}`);
  }
}
