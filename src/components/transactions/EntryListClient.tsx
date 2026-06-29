"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AttachmentLink } from "@/components/transactions/AttachmentLink";
import { formatMoney } from "@/lib/finance";
import { createClient } from "@/lib/supabase/client";
import type { Transaction } from "@/types/database";

export function EntryListClient({
  entries,
  type,
  addHref,
  addLabel,
}: {
  entries: Transaction[];
  type: "income" | "expense";
  addHref: string;
  addLabel: string;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isIncome = type === "income";

  async function deleteEntry(entry: Transaction) {
    if (!confirm("Delete this entry?")) return;

    setDeletingId(entry.id);
    const supabase = createClient();

    // Best-effort: delete attachment first (if any)
    if (entry.attachment_path) {
      await supabase.storage.from("attachments").remove([entry.attachment_path]);
    }

    await supabase.from("transactions").delete().eq("id", entry.id);
    setDeletingId(null);
    router.refresh();
  }

  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-card-border p-6 text-center text-sm text-muted">
        Nothing recorded yet.{" "}
        <Link href={addHref} className="text-accent underline">
          {addLabel}
        </Link>
      </p>
    );
  }

  return (
    <ul className="divide-y divide-card-border rounded-2xl border border-card-border bg-card">
      {entries.map((entry) => (
        <li key={entry.id} className="px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">
                {entry.categories?.icon}{" "}
                {entry.description ||
                  entry.categories?.name ||
                  (isIncome ? "Income" : "Expense")}
              </p>
              {!isIncome && entry.is_fixed && (
                <p className="mt-1 inline-flex items-center rounded-full bg-accent-dim px-2 py-0.5 text-[11px] font-medium text-accent">
                  Fixed
                </p>
              )}
              {!isIncome && entry.budget_bucket && (
                <p
                  className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    entry.budget_bucket === "needs"
                      ? "bg-expense/15 text-expense"
                      : "bg-income/15 text-income"
                  }`}
                >
                  {entry.budget_bucket === "needs" ? "Need" : "Want"}
                </p>
              )}
              <p className="text-xs text-muted">
                {entry.categories?.name && entry.description
                  ? `${entry.categories.name} · `
                  : ""}
                {entry.accounts?.name ?? "No account"} ·{" "}
                {new Date(entry.occurred_on + "T12:00:00").toLocaleDateString(
                  "en-PH",
                  { month: "short", day: "numeric", year: "numeric" }
                )}
              </p>
              {entry.attachment_path && entry.attachment_name && (
                <AttachmentLink
                  path={entry.attachment_path}
                  name={entry.attachment_name}
                />
              )}

              <div className="mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="px-0 py-0 text-xs text-danger hover:text-danger"
                  disabled={deletingId === entry.id}
                  onClick={() => deleteEntry(entry)}
                >
                  {deletingId === entry.id ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </div>

            <p
              className={`shrink-0 font-semibold ${
                isIncome ? "text-income" : "text-expense"
              }`}
            >
              {isIncome ? "+" : "−"}
              {formatMoney(Number(entry.amount))}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

