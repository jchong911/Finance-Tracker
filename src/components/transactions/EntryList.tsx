import Link from "next/link";
import { AttachmentLink } from "@/components/transactions/AttachmentLink";
import { formatMoney } from "@/lib/finance";
import type { Transaction } from "@/types/database";

export function EntryList({
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
  const isIncome = type === "income";

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
              <p className="text-xs text-muted">
                {entry.categories?.name && entry.description
                  ? `${entry.categories.name} · `
                  : ""}
                {entry.accounts?.name ?? "No account"} ·{" "}
                {new Date(entry.occurred_on + "T12:00:00").toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                )}
              </p>
              {entry.attachment_path && entry.attachment_name && (
                <AttachmentLink
                  path={entry.attachment_path}
                  name={entry.attachment_name}
                />
              )}
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
