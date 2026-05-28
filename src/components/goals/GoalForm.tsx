"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export function GoalForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setLoading(true);
    setError(null);

    const form = new FormData(formEl);
    const name = String(form.get("name"));
    const notes = String(form.get("notes") ?? "");
    const targetAmount = Number(form.get("target_amount"));
    const monthlyAutoAmount = Number(form.get("monthly_auto_amount") || 0);

    if (!targetAmount || targetAmount <= 0) {
      setError("Enter a valid target amount.");
      setLoading(false);
      return;
    }

    if (monthlyAutoAmount < 0) {
      setError("Monthly auto amount cannot be negative.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be signed in.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("savings_goals").insert({
      user_id: user.id,
      name,
      notes,
      target_amount: targetAmount,
      monthly_auto_amount: monthlyAutoAmount,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    formEl.reset();
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-card-border bg-card p-4"
    >
      <h2 className="text-sm font-medium">Add savings goal</h2>

      <Input label="Goal name" name="name" placeholder="Emergency fund" required />

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Notes</span>
        <textarea
          name="notes"
          rows={3}
          placeholder="Why you're saving, deadline, etc."
          className="rounded-xl border border-card-border bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent resize-none"
        />
      </label>

      <Input
        label="Amount to save"
        name="target_amount"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0.01"
        placeholder="1000.00"
        required
      />

      <Input
        label="Auto set-aside per month (optional)"
        name="monthly_auto_amount"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        placeholder="0.00"
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Add goal"}
      </Button>
    </form>
  );
}
