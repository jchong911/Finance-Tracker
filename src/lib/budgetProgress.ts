import type { BudgetRatioBucket } from "@/types/database";
import { bucketColor } from "./budgetRatios";

export type BucketProgress = {
  id: string;
  name: string;
  targetPercent: number;
  limit: number;
  spent: number;
  remaining: number;
  color: string;
  isOver: boolean;
};

export function buildBucketProgress(
  income: number,
  buckets: BudgetRatioBucket[],
  actualByBucket: Record<string, number>
): BucketProgress[] {
  const order = ["needs", "wants", "savings"];
  const sorted = [...buckets].sort((a, b) => {
    const ai = order.indexOf(a.id);
    const bi = order.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return sorted.map((b) => {
    const limit = income > 0 ? Math.max(0, (income * b.percent) / 100) : 0;
    const spent = actualByBucket[b.id] ?? 0;
    const remaining = limit - spent;

    return {
      id: b.id,
      name: b.name,
      targetPercent: b.percent,
      limit,
      spent,
      remaining,
      color: bucketColor(b.id),
      isOver: limit > 0 && spent > limit,
    };
  });
}
