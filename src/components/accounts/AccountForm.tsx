"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";
import type { AccountType } from "@/types/database";

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit", label: "Credit card" },
  { value: "cash", label: "Cash" },
  { value: "investment", label: "Investment" },
  { value: "other", label: "Other" },
];

const COLORS = ["#3b82f6", "#3dd68c", "#f59e0b", "#a78bfa", "#f87171", "#38bdf8"];

export function AccountForm() {
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
    const type = String(form.get("type")) as AccountType;
    const initialBalance = Number(form.get("initial_balance") || 0);
    const color = String(form.get("color"));

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be signed in.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("accounts").insert({
      user_id: user.id,
      name,
      type,
      currency: "PHP",
      initial_balance: initialBalance,
      color,
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-card-border bg-card p-4">
      <h2 className="text-sm font-medium">Add account</h2>

      <Input label="Name" name="name" placeholder="Main checking" required />

      <Select label="Type" name="type" defaultValue="checking">
        {ACCOUNT_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </Select>

      <Input
        label="Starting balance"
        name="initial_balance"
        type="number"
        step="0.01"
        defaultValue="0"
      />

      <Select label="Color" name="color" defaultValue={COLORS[0]}>
        {COLORS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Add account"}
      </Button>
    </form>
  );
}
