import Link from "next/link";
import { AttachmentLink } from "@/components/transactions/AttachmentLink";
import { formatMoney } from "@/lib/finance";
import type { Transaction } from "@/types/database";

export function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  if (transactions.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-card-border p-6 text-center text-sm text-muted">
        No activity yet.{" "}
        <Link href="/income" className="text-accent underline">
          Log income
        </Link>{" "}
        or{" "}
        <Link href="/expenditures" className="text-accent underline">
          add spending
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="divide-y divide-card-border rounded-2xl border border-card-border bg-card">
      {transactions.map((t) => {
        const isIncome = t.type === "income";
        return (
          <li key={t.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {t.categories?.icon}{" "}
                  {t.description || t.categories?.name || "Transaction"}
                </p>
                <p className="text-xs text-muted">
                  {t.accounts?.name ?? "No account"} ·{" "}
                  {new Date(t.occurred_on + "T12:00:00").toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" }
                  )}
                </p>
                {t.attachment_path && t.attachment_name && (
                  <AttachmentLink
                    path={t.attachment_path}
                    name={t.attachment_name}
                  />
                )}
              </div>
              <p
                className={`shrink-0 font-semibold ${
                  isIncome ? "text-income" : "text-expense"
                }`}
              >
                {isIncome ? "+" : "−"}
                {formatMoney(Number(t.amount))}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
