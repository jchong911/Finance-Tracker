import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { BudgetCoachCard } from "@/components/dashboard/BudgetCoachCard";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { MonthOverviewChart } from "@/components/dashboard/MonthOverviewChart";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { AppShell } from "@/components/layout/AppShell";
import { TransactionList } from "@/components/transactions/TransactionList";
import { formatMoney, monthKey, monthLabel, spendingByCategory, summarizeMonth } from "@/lib/finance";
import {
  getActiveSavingsGoals,
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
  const [transactions, goals, carryover, monthContributions] = await Promise.all([
    getTransactionsForMonth(month),
    getActiveSavingsGoals(),
    getCarryoverBeforeMonth(month),
    getGoalContributionsForMonth(month),
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

  const chartSegments = [
    { label: "Spent", value: Math.min(summary.expenses, moneyPool), color: "#f87171" },
    {
      label: "Set aside to goals",
      value: Math.min(monthlyGoalSetAside, Math.max(0, moneyPool - summary.expenses)),
      color: "#a78bfa",
    },
    { label: "Remaining money", value: remainingPool, color: "#3dd68c" },
  ];

  return (
    <AppShell
      title={monthLabel(month)}
      action={<SignOutButton />}
    >
      <div className="space-y-6">
        <MonthOverviewChart
          segments={chartSegments}
          centerLabel="Money remaining"
          centerValue={formatMoney(remainingPool)}
        />
        <BudgetCoachCard
          income={summary.income}
          expenses={summary.expenses}
          fixedExpenses={fixedExpenses}
          savingsGoals={goalsTotal}
          topCategories={topCategories}
        />
        <SummaryCards summary={summary} fixedExpenses={fixedExpenses} />
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
