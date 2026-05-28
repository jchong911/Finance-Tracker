"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AttachmentLink({
  path,
  name,
}: {
  path: string;
  name: string;
}) {
  const [loading, setLoading] = useState(false);

  async function openAttachment() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("attachments")
      .createSignedUrl(path, 3600);

    setLoading(false);

    if (error || !data?.signedUrl) return;
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={openAttachment}
      disabled={loading}
      className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:underline disabled:opacity-50"
    >
      📎 {loading ? "Opening…" : name}
    </button>
  );
}
