import type { BudgetRatioBucket, Transaction } from "@/types/database";

export const DEFAULT_BUCKETS: BudgetRatioBucket[] = [
  { id: "needs", name: "Necessary expenditures", percent: 50 },
  { id: "wants", name: "Wants", percent: 30 },
  { id: "savings", name: "Savings", percent: 20 },
];

const NEEDS_CATEGORY_NAMES = new Set([
  "groceries",
  "housing",
  "utilities",
  "transport",
  "health",
  "other expense",
]);

const WANTS_CATEGORY_NAMES = new Set([
  "dining out",
  "entertainment",
  "shopping",
]);

export function bucketColor(bucketId: string): string {
  if (bucketId === "savings") return "#a78bfa";
  if (bucketId === "needs") return "#f87171";
  if (bucketId === "wants") return "#3dd68c";
  return "#64748b";
}

export function resolveBuckets(saved?: BudgetRatioBucket[] | null): BudgetRatioBucket[] {
  if (saved && saved.length >= 2) return saved;
  return DEFAULT_BUCKETS;
}

function defaultExpenseBucketId(
  isFixed: boolean,
  buckets: BudgetRatioBucket[]
): string {
  const preferred = isFixed ? "needs" : "wants";
  if (buckets.some((b) => b.id === preferred)) return preferred;
  return buckets.find((b) => b.id !== "savings")?.id ?? preferred;
}

/** Pick which bucket an expense belongs to. Savings is only from goals, not expenses. */
export function resolveExpenseBucketId(
  categoryId: string | null,
  categoryName: string | undefined,
  isFixed: boolean,
  categoryMap: Record<string, string>,
  buckets: BudgetRatioBucket[]
): string {
  if (categoryId && categoryMap[categoryId]) {
    const mapped = categoryMap[categoryId];
    if (mapped !== "savings" && buckets.some((b) => b.id === mapped)) {
      return mapped;
    }
  }

  const name = (categoryName ?? "").trim().toLowerCase();
  if (NEEDS_CATEGORY_NAMES.has(name) && buckets.some((b) => b.id === "needs")) {
    return "needs";
  }
  if (WANTS_CATEGORY_NAMES.has(name) && buckets.some((b) => b.id === "wants")) {
    return "wants";
  }

  return defaultExpenseBucketId(isFixed, buckets);
}

export function computeBucketTotals(
  transactions: Transaction[],
  buckets: BudgetRatioBucket[],
  categoryMap: Record<string, string>,
  goalSetAside: number
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const b of buckets) {
    totals[b.id] = b.id === "savings" ? goalSetAside : 0;
  }

  for (const t of transactions) {
    if (t.type !== "expense") continue;

    let bucketId: string;
    if (t.budget_bucket === "needs" || t.budget_bucket === "wants") {
      bucketId = t.budget_bucket;
    } else {
      bucketId = resolveExpenseBucketId(
        t.category_id,
        t.categories?.name,
        t.is_fixed,
        categoryMap,
        buckets
      );
    }

    if (bucketId === "savings") continue;
    if (totals[bucketId] != null) {
      totals[bucketId] += Number(t.amount);
    }
  }

  return totals;
}

export function bucketLimits(
  income: number,
  buckets: BudgetRatioBucket[]
): Record<string, number> {
  const limits: Record<string, number> = {};
  for (const b of buckets) {
    limits[b.id] = Math.max(0, (income * b.percent) / 100);
  }
  return limits;
}

export type RatioChartSegment = {
  label: string;
  value: number;
  color: string;
  bucketId: string;
};

/** Always returns one segment per bucket (3 by default). */
export function buildRatioDonutSegments(
  income: number,
  buckets: BudgetRatioBucket[],
  actualByBucket: Record<string, number>
): RatioChartSegment[] {
  const limits = bucketLimits(income, buckets);
  const expenseTotal = buckets
    .filter((b) => b.id !== "savings")
    .reduce((sum, b) => sum + (actualByBucket[b.id] ?? 0), 0);
  const hasIncome = income > 0;
  const hasSpending =
    expenseTotal > 0 || (actualByBucket.savings ?? 0) > 0;

  return buckets.map((b) => {
    const actual = actualByBucket[b.id] ?? 0;
    const limit = limits[b.id] ?? 0;
    const value = hasIncome ? limit : hasSpending ? actual : 0;

    return {
      bucketId: b.id,
      label: b.name,
      value,
      color: bucketColor(b.id),
    };
  });
}
