"use client";

import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/finance";
import type { BudgetRatioBucket } from "@/types/database";

export function RatioLimitsCard({
  income,
  buckets,
  actualByBucketId,
}: {
  income: number;
  buckets: BudgetRatioBucket[];
  actualByBucketId?: Record<string, number>;
}) {
  if (buckets.length < 2) return null;

  return (
    <Card>
      <h2 className="mb-3 text-sm font-medium text-muted">Your ratio limits</h2>
      <ul className="space-y-2 text-sm">
        {buckets.map((b) => {
          const limit = income > 0 ? (income * b.percent) / 100 : 0;
          const actual = actualByBucketId?.[b.id] ?? 0;
          const delta = income > 0 ? limit - actual : null;
          return (
            <li key={b.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-muted">
                  {b.name}{" "}
                  <span className="text-xs text-muted">({b.percent}%)</span>
                </p>
                <p className="text-xs text-muted">
                  Spent {formatMoney(actual)}
                  {delta != null && (
                    <>
                      {" "}
                      · {delta >= 0 ? "Left" : "Over"}{" "}
                      {formatMoney(Math.abs(delta))}
                    </>
                  )}
                </p>
              </div>
              <span className="shrink-0 font-medium">
                {income > 0 ? formatMoney(limit) : "—"}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

