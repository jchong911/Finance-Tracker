import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { BudgetCoachCard } from "@/components/dashboard/BudgetCoachCard";
import { BucketRingsChart } from "@/components/dashboard/BucketRingsChart";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { FinanceChatCard } from "@/components/dashboard/FinanceChatCard";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { AppShell } from "@/components/layout/AppShell";
import { TransactionList } from "@/components/transactions/TransactionList";
import { buildBucketProgress } from "@/lib/budgetProgress";
import { computeBucketTotals, resolveBuckets } from "@/lib/budgetRatios";
import { monthKey, monthLabel, spendingByCategory, summarizeMonth } from "@/lib/finance";
import {
  getActiveSavingsGoals,
  getBudgetRatios,
  getCarryoverBeforeMonth,
  getGoalContributionsForMonth,
  getTransactionsForMonth,
} from "@/lib/queries";

function toAmount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default async function DashboardPage() {
  const month = monthKey();
  const [transactions, goals, carryover, monthContributions, ratios] = await Promise.all([
    getTransactionsForMonth(month),
    getActiveSavingsGoals(),
    getCarryoverBeforeMonth(month),
    getGoalContributionsForMonth(month),
    getBudgetRatios(),
  ]);
  const summary = summarizeMonth(transactions);
  const topCategories = spendingByCategory(transactions);
  const goalsTotal = goals.reduce((sum, g) => sum + toAmount(g.target_amount), 0);
  const fixedExpenses = transactions
    .filter((t) => t.type === "expense" && t.is_fixed)
    .reduce((sum, t) => sum + toAmount(t.amount), 0);
  const monthlyAutoSetAside = goals.reduce(
    (sum, g) => sum + toAmount(g.monthly_auto_amount),
    0
  );
  const monthlyManualSetAside = monthContributions.reduce(
    (sum, c) => sum + toAmount(c.amount),
    0
  );
  const monthlyGoalSetAside = monthlyAutoSetAside + monthlyManualSetAside;
  const moneyPool = Math.max(0, carryover + summary.income);
  const totalOut = summary.expenses + monthlyGoalSetAside;
  const remainingPool = Math.max(0, moneyPool - totalOut);
  const variableExpenses = Math.max(0, summary.expenses - fixedExpenses);

  const buckets = resolveBuckets(ratios?.buckets);
  const categoryMap = ratios?.category_bucket_map ?? {};
  const bucketTotals = computeBucketTotals(
    transactions,
    buckets,
    categoryMap,
    monthlyGoalSetAside
  );
  const bucketProgress = buildBucketProgress(
    summary.income,
    buckets,
    bucketTotals
  );

  return (
    <AppShell
      title={monthLabel(month)}
      action={<SignOutButton />}
    >
      <div className="space-y-6">
        <BucketRingsChart
          buckets={bucketProgress}
          hasIncome={summary.income > 0}
        />
        <SummaryCards summary={summary} fixedExpenses={fixedExpenses} />
        <BudgetCoachCard
          income={summary.income}
          expenses={summary.expenses}
          fixedExpenses={fixedExpenses}
          savingsGoals={goalsTotal}
          topCategories={topCategories}
        />
        <FinanceChatCard
          context={{
            month: monthLabel(month),
            income: summary.income,
            expenses: summary.expenses,
            fixedExpenses,
            variableExpenses,
            goalSetAside: monthlyGoalSetAside,
            carryover,
            moneyPool,
            remaining: remainingPool,
            topCategories: topCategories.slice(0, 5),
          }}
        />
        <CategoryBreakdown items={topCategories} />

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-muted">Recent activity</h2>
            <div className="flex gap-3 text-sm">
              <Link href="/income" className="text-accent">
                Income
              </Link>
              <Link href="/expenditures" className="text-accent">
                Spending
              </Link>
            </div>
          </div>
          <TransactionList transactions={transactions.slice(0, 5)} />
        </section>
      </div>
    </AppShell>
  );
}
