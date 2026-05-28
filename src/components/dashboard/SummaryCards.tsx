import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/finance";
import type { MonthSummary } from "@/types/database";

export function SummaryCards({
  summary,
  fixedExpenses,
}: {
  summary: MonthSummary;
  fixedExpenses: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card>
        <p className="text-xs text-muted">Income</p>
        <p className="mt-1 text-xl font-semibold text-income">
          {formatMoney(summary.income)}
        </p>
      </Card>
      <Card>
        <p className="text-xs text-muted">Spent</p>
        <p className="mt-1 text-xl font-semibold text-expense">
          {formatMoney(summary.expenses)}
        </p>
      </Card>
      <Card>
        <p className="text-xs text-muted">Fixed spent</p>
        <p className="mt-1 text-xl font-semibold text-foreground">
          {formatMoney(fixedExpenses)}
        </p>
        <p className="mt-1 text-xs text-muted">Rent, subscriptions, bills</p>
      </Card>
      <Card>
        <p className="text-xs text-muted">Variable spent</p>
        <p className="mt-1 text-xl font-semibold text-foreground">
          {formatMoney(Math.max(0, summary.expenses - fixedExpenses))}
        </p>
        <p className="mt-1 text-xs text-muted">Food, shopping, etc.</p>
      </Card>
      <Card className="col-span-2">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted">Net this month</p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                summary.net >= 0 ? "text-income" : "text-expense"
              }`}
            >
              {formatMoney(summary.net)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Savings rate</p>
            <p className="mt-1 text-lg font-medium text-accent">
              {summary.income > 0
                ? `${summary.savingsRate.toFixed(0)}%`
                : "—"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
