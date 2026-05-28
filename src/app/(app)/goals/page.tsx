import { GoalForm } from "@/components/goals/GoalForm";
import { GoalList } from "@/components/goals/GoalList";
import { AppShell } from "@/components/layout/AppShell";
import { getGoalContributions, getSavingsGoals } from "@/lib/queries";

export default async function GoalsPage() {
  const [goals, contributions] = await Promise.all([
    getSavingsGoals(),
    getGoalContributions(),
  ]);

  return (
    <AppShell title="Savings goals">
      <div className="space-y-6">
        <GoalList goals={goals} contributions={contributions} />
        <GoalForm />
      </div>
    </AppShell>
  );
}
