import { GoalCard } from "@/components/goals/GoalCard";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/finance";
import type { GoalContribution, SavingsGoal } from "@/types/database";

function toAmount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthsBetweenInclusive(startIso: string, now: Date): number {
  const start = new Date(startIso);
  const years = now.getFullYear() - start.getFullYear();
  const months = now.getMonth() - start.getMonth();
  return Math.max(1, years * 12 + months + 1);
}

export function GoalList({
  goals,
  contributions,
}: {
  goals: SavingsGoal[];
  contributions: GoalContribution[];
}) {
  if (goals.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">
          No savings goals yet. Add one below to track what you are working toward.
        </p>
      </Card>
    );
  }

  const active = goals.filter((g) => g.status === "active");
  const completed = goals.filter((g) => g.status !== "active");
  const now = new Date();
  const currentMonth = monthKey(now);

  const total = active.reduce((sum, goal) => {
    const manualTotal = contributions
      .filter((c) => c.goal_id === goal.id)
      .reduce((acc, c) => acc + toAmount(c.amount), 0);
    const autoTotal =
      toAmount(goal.monthly_auto_amount) *
      monthsBetweenInclusive(goal.created_at, now);
    const saved = manualTotal + autoTotal;
    return sum + Math.max(0, toAmount(goal.target_amount) - saved);
  }, 0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {active.length} active · {formatMoney(total)} total target
      </p>
      <ul className="space-y-3">
        {active.map((goal) => (
          <li key={goal.id}>
            <GoalCard
              goal={goal}
              savedTotal={
                contributions
                  .filter((c) => c.goal_id === goal.id)
                  .reduce((acc, c) => acc + toAmount(c.amount), 0) +
                toAmount(goal.monthly_auto_amount) *
                  monthsBetweenInclusive(goal.created_at, now)
              }
              thisMonthSetAside={
                contributions
                  .filter(
                    (c) =>
                      c.goal_id === goal.id &&
                      monthKey(new Date(c.contributed_on + "T12:00:00")) ===
                        currentMonth
                  )
                  .reduce((acc, c) => acc + toAmount(c.amount), 0) +
                toAmount(goal.monthly_auto_amount)
              }
              remaining={Math.max(
                0,
                toAmount(goal.target_amount) -
                  (contributions
                    .filter((c) => c.goal_id === goal.id)
                    .reduce((acc, c) => acc + toAmount(c.amount), 0) +
                    toAmount(goal.monthly_auto_amount) *
                      monthsBetweenInclusive(goal.created_at, now))
              )}
              progressPct={
                toAmount(goal.target_amount) > 0
                  ? ((contributions
                      .filter((c) => c.goal_id === goal.id)
                      .reduce((acc, c) => acc + toAmount(c.amount), 0) +
                      toAmount(goal.monthly_auto_amount) *
                        monthsBetweenInclusive(goal.created_at, now)) /
                      toAmount(goal.target_amount)) *
                    100
                  : 0
              }
            />
          </li>
        ))}
      </ul>

      {completed.length > 0 && (
        <div className="pt-2">
          <p className="text-sm font-medium text-muted">Archived</p>
          <ul className="mt-3 space-y-3 opacity-80">
            {completed.map((goal) => (
              <li key={goal.id}>
                <GoalCard
                  goal={goal}
                  savedTotal={
                    contributions
                      .filter((c) => c.goal_id === goal.id)
                      .reduce((acc, c) => acc + toAmount(c.amount), 0) +
                    toAmount(goal.monthly_auto_amount) *
                      monthsBetweenInclusive(goal.created_at, now)
                  }
                  thisMonthSetAside={
                    contributions
                      .filter(
                        (c) =>
                          c.goal_id === goal.id &&
                          monthKey(new Date(c.contributed_on + "T12:00:00")) ===
                            currentMonth
                      )
                      .reduce((acc, c) => acc + toAmount(c.amount), 0) +
                    toAmount(goal.monthly_auto_amount)
                  }
                  remaining={Math.max(
                    0,
                    toAmount(goal.target_amount) -
                      (contributions
                        .filter((c) => c.goal_id === goal.id)
                        .reduce((acc, c) => acc + toAmount(c.amount), 0) +
                        toAmount(goal.monthly_auto_amount) *
                          monthsBetweenInclusive(goal.created_at, now))
                  )}
                  progressPct={
                    toAmount(goal.target_amount) > 0
                      ? ((contributions
                          .filter((c) => c.goal_id === goal.id)
                          .reduce((acc, c) => acc + toAmount(c.amount), 0) +
                          toAmount(goal.monthly_auto_amount) *
                            monthsBetweenInclusive(goal.created_at, now)) /
                          toAmount(goal.target_amount)) *
                        100
                      : 0
                  }
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
