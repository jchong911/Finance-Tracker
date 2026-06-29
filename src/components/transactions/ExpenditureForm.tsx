"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FileInput } from "@/components/ui/FileInput";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";
import { uploadAttachment } from "@/lib/storage";
import type { Account, Category } from "@/types/database";

export function ExpenditureForm({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expenseCategories = categories.filter((c) => c.kind === "expense");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setLoading(true);
    setError(null);

    const form = new FormData(formEl);
    const amount = Number(form.get("amount"));
    const accountId = String(form.get("account_id") ?? "");
    const categoryName = String(form.get("category_name") ?? "").trim();
    const description = String(form.get("description") ?? "");
    const occurredOn = String(form.get("occurred_on"));
    const receipt = form.get("receipt");
    const isFixed = form.get("is_fixed") === "on";
    const budgetBucket = form.get("budget_bucket") === "wants" ? "wants" : "needs";

    if (!amount || amount <= 0) {
      setError("Enter a valid amount.");
      setLoading(false);
      return;
    }

    if (!categoryName) {
      setError("Pick a category tag for this expense.");
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

    let categoryId: string | null = null;
    const match = expenseCategories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (match) {
      categoryId = match.id;
    } else {
      const { data: inserted, error: insertCategoryError } = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          name: categoryName,
          kind: "expense",
          icon: "•",
          color: "#64748b",
        })
        .select("id")
        .single();

      if (!insertCategoryError && inserted?.id) {
        categoryId = inserted.id as string;
      } else {
        const { data: found } = await supabase
          .from("categories")
          .select("id, name")
          .eq("kind", "expense");
        const foundMatch = (found ?? []).find(
          (c) => String(c.name).toLowerCase() === categoryName.toLowerCase()
        );
        categoryId = foundMatch ? String(foundMatch.id) : null;
      }
    }

    if (!categoryId) {
      setError("Could not save/find that category tag. Try again.");
      setLoading(false);
      return;
    }

    let attachment: { path: string; name: string; mime: string } | null = null;

    if (receipt instanceof File && receipt.size > 0) {
      try {
        attachment = await uploadAttachment(supabase, user.id, receipt);
      } catch (uploadError) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Could not upload attachment."
        );
        setLoading(false);
        return;
      }
    }

    const { error: insertError } = await supabase.from("transactions").insert({
      user_id: user.id,
      account_id: accountId || null,
      category_id: categoryId,
      type: "expense",
      amount,
      description,
      occurred_on: occurredOn,
      is_fixed: isFixed,
      budget_bucket: budgetBucket,
      attachment_path: attachment?.path ?? null,
      attachment_name: attachment?.name ?? null,
      attachment_mime: attachment?.mime ?? null,
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
      <h2 className="text-sm font-medium">Log expenditure</h2>

      <Input
        label="Amount spent"
        name="amount"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0.01"
        placeholder="0.00"
        required
      />

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Category tag</span>
        <input
          name="category_name"
          list="expense-tags"
          placeholder="Groceries, Transport, Food…"
          className="rounded-xl border border-card-border bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent"
          required
        />
        <datalist id="expense-tags">
          {expenseCategories.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
        <span className="text-xs text-muted">
          Type to search. New tags will be saved automatically.
        </span>
      </label>

      {accounts.length > 0 ? (
        <Select label="Account (optional)" name="account_id" defaultValue="">
          <option value="">No account yet</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      ) : (
        <p className="text-xs text-muted">
          No accounts yet — you can add one later on the Accounts tab.
        </p>
      )}

      <Input
        label="Description"
        name="description"
        placeholder="Lunch, gas, groceries…"
      />

      <label className="flex items-start gap-3 rounded-2xl border border-card-border bg-background px-3 py-3">
        <input
          type="checkbox"
          name="is_fixed"
          className="mt-1 h-4 w-4 accent-[var(--accent)]"
        />
        <span className="text-sm">
          <span className="font-medium">Fixed expense</span>
          <span className="block text-xs text-muted">
            Turn this on for recurring bills like rent and subscriptions.
          </span>
        </span>
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm text-muted">Need or want?</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-card-border bg-background px-3 py-2.5 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-dim">
            <input
              type="radio"
              name="budget_bucket"
              value="needs"
              defaultChecked
              className="accent-[var(--accent)]"
            />
            <span>Need</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-card-border bg-background px-3 py-2.5 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-dim">
            <input
              type="radio"
              name="budget_bucket"
              value="wants"
              className="accent-[var(--accent)]"
            />
            <span>Want</span>
          </label>
        </div>
        <p className="text-xs text-muted">
          Needs go toward your necessary budget. Wants go toward discretionary
          spending.
        </p>
      </fieldset>

      <Input
        label="Date"
        name="occurred_on"
        type="date"
        required
        defaultValue={new Date().toISOString().slice(0, 10)}
      />

      <FileInput
        label="Receipt or proof"
        name="receipt"
        accept="application/pdf,image/*"
        hint="Optional — PDF or image, up to 10 MB"
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving…" : "Save expenditure"}
      </Button>
    </form>
  );
}
