import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function isAllowedAttachment(file: File): boolean {
  if (ALLOWED_MIME.has(file.type)) return true;
  return file.type.startsWith("image/");
}

export async function uploadAttachment(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<{ path: string; name: string; mime: string }> {
  if (file.size > MAX_BYTES) {
    throw new Error("File must be 10 MB or smaller.");
  }

  if (!isAllowedAttachment(file)) {
    throw new Error("Upload a PDF or image file.");
  }

  const ext = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf("."))
    : "";
  const path = `${userId}/${crypto.randomUUID()}${ext}`;

  const { error } = await supabase.storage
    .from("attachments")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw error;

  return { path, name: file.name, mime: file.type };
}
