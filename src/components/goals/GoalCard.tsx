"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/finance";
import { createClient } from "@/lib/supabase/client";
import type { SavingsGoal } from "@/types/database";

function toAmount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function GoalCard({
  goal,
  savedTotal,
  thisMonthSetAside,
  remaining,
  progressPct,
}: {
  goal: SavingsGoal;
  savedTotal: number;
  thisMonthSetAside: number;
  remaining: number;
  progressPct: number;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState<
    null | "active" | "achieved" | "diverted"
  >(null);
  const [depositing, setDepositing] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  async function handleDelete() {
    if (!confirm(`Delete "${goal.name}"?`)) return;

    setDeleting(true);
    const supabase = createClient();
    await supabase.from("savings_goals").delete().eq("id", goal.id);
    setDeleting(false);
    router.refresh();
  }

  async function setStatus(status: "achieved" | "diverted") {
    if (
      !confirm(
        status === "achieved"
          ? `Mark "${goal.name}" as achieved?`
          : `Mark "${goal.name}" as diverted?`
      )
    ) {
      return;
    }

    setUpdating(status);
    const supabase = createClient();
    await supabase.from("savings_goals").update({ status }).eq("id", goal.id);
    setUpdating(null);
    router.refresh();
  }

  async function unarchive() {
    if (!confirm(`Unarchive "${goal.name}" and mark it active again?`)) return;

    setUpdating("active");
    const supabase = createClient();
    await supabase
      .from("savings_goals")
      .update({ status: "active" })
      .eq("id", goal.id);
    setUpdating(null);
    router.refresh();
  }

  async function addManualDeposit() {
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) return;

    setDepositing(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setDepositing(false);
      return;
    }

    await supabase.from("goal_contributions").insert({
      user_id: user.id,
      goal_id: goal.id,
      amount,
    });

    setDepositAmount("");
    setDepositing(false);
    router.refresh();
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{goal.name}</p>
          {goal.notes ? (
            <p className="mt-1 text-sm text-muted whitespace-pre-wrap">{goal.notes}</p>
          ) : (
            <p className="mt-1 text-sm italic text-muted">No notes</p>
          )}
        </div>
        <p className="shrink-0 text-lg font-semibold text-accent">
          {formatMoney(toAmount(goal.target_amount))}
        </p>
      </div>

      <div className="space-y-1.5 text-xs text-muted">
        <p>
          Saved: <span className="text-foreground">{formatMoney(savedTotal)}</span>
        </p>
        <p>
          Remaining: <span className="text-foreground">{formatMoney(remaining)}</span>
        </p>
        <p>
          This month set aside:{" "}
          <span className="text-foreground">{formatMoney(thisMonthSetAside)}</span>
        </p>
        <p>
          Auto set-aside:{" "}
          <span className="text-foreground">
            {formatMoney(toAmount(goal.monthly_auto_amount))}/month
          </span>
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-card-border">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
        />
      </div>

      {goal.status !== "active" ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted">
            Status: <span className="capitalize">{goal.status}</span>
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="text-xs"
              onClick={unarchive}
              disabled={!!updating || deleting}
            >
              {updating ? "Updating…" : "Unarchive"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-xs text-danger hover:text-danger"
              onClick={handleDelete}
              disabled={deleting || !!updating}
            >
              {deleting ? "Removing…" : "Remove"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.currentTarget.value)}
              placeholder="Manual deposit amount"
              className="flex-1 rounded-xl border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
            <Button
              type="button"
              variant="secondary"
              className="text-xs"
              onClick={addManualDeposit}
              disabled={depositing || !depositAmount}
            >
              {depositing ? "Adding…" : "Deposit"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="text-xs"
            onClick={() => setStatus("achieved")}
            disabled={!!updating || deleting}
          >
            {updating === "achieved" ? "Updating…" : "Achieved"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="text-xs"
            onClick={() => setStatus("diverted")}
            disabled={!!updating || deleting}
          >
            {updating === "diverted" ? "Updating…" : "Diverted"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-xs text-danger hover:text-danger"
            onClick={handleDelete}
            disabled={deleting || !!updating}
          >
            {deleting ? "Removing…" : "Remove"}
          </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
