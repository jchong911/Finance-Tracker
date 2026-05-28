"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FileInput } from "@/components/ui/FileInput";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";
import { scanIncomeAmountFromFile } from "@/lib/incomeScan";
import { uploadAttachment } from "@/lib/storage";
import type { Account, Category } from "@/types/database";

export function IncomeForm({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scannedAmount, setScannedAmount] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const incomeCategories = categories.filter((c) => c.kind === "income");

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
    const payStub = form.get("pay_stub");

    // #region agent log
    fetch('http://127.0.0.1:7938/ingest/763aa543-e515-44e9-974e-e2ad48dcfc74',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ad41e4'},body:JSON.stringify({sessionId:'ad41e4',runId:'pre-fix',hypothesisId:'H2',location:'src/components/transactions/IncomeForm.tsx:44',message:'Income submit',data:{amount,isFile:payStub instanceof File,fileSize:payStub instanceof File?payStub.size:null,fileType:payStub instanceof File?payStub.type:null,hasScannedAmount:scannedAmount!==null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log

    if (!amount || amount <= 0) {
      setError("Enter a valid amount.");
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

    let attachment: { path: string; name: string; mime: string } | null = null;

    if (payStub instanceof File && payStub.size > 0) {
      try {
        attachment = await uploadAttachment(supabase, user.id, payStub);
      } catch (uploadError) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Could not upload pay stub."
        );
        setLoading(false);
        return;
      }
    }

    let categoryId: string | null = null;
    if (categoryName) {
      const match = incomeCategories.find(
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
            kind: "income",
            icon: "•",
            color: "#64748b",
          })
          .select("id")
          .single();

        if (!insertCategoryError && inserted?.id) {
          categoryId = inserted.id as string;
        } else {
          // Might be a unique constraint race; try to find it again.
          const { data: found } = await supabase
            .from("categories")
            .select("id, name")
            .eq("kind", "income");
          const foundMatch = (found ?? []).find(
            (c) => String(c.name).toLowerCase() === categoryName.toLowerCase()
          );
          categoryId = foundMatch ? String(foundMatch.id) : null;
        }
      }
    }

    const { error: insertError } = await supabase.from("transactions").insert({
      user_id: user.id,
      account_id: accountId || null,
      category_id: categoryId,
      type: "income",
      amount,
      description,
      occurred_on: occurredOn,
      attachment_path: attachment?.path ?? null,
      attachment_name: attachment?.name ?? null,
      attachment_mime: attachment?.mime ?? null,
    });

    setLoading(false);

    if (insertError) {
      if (insertError.message.includes("attachment_mime")) {
        setError(
          "Your Supabase database is missing the attachment columns. Run migration `003_transaction_attachments.sql` and then refresh the schema cache."
        );
        return;
      }
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
      <h2 className="text-sm font-medium">Log income</h2>

      <Input
        label="Amount earned"
        name="amount"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0.01"
        placeholder="0.00"
        required
        defaultValue={scannedAmount ?? undefined}
      />

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

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Income tag</span>
        <input
          name="category_name"
          list="income-tags"
          placeholder="Salary, Freelance, Allowance…"
          className="rounded-xl border border-card-border bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent"
        />
        <datalist id="income-tags">
          {incomeCategories.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
        <span className="text-xs text-muted">
          Type to search. New tags will be saved automatically.
        </span>
      </label>

      <Input
        label="Notes"
        name="description"
        placeholder="March paycheck, freelance project…"
      />

      <Input
        label="Date received"
        name="occurred_on"
        type="date"
        required
        defaultValue={new Date().toISOString().slice(0, 10)}
      />

      <FileInput
        label="Pay stub / proof (upload + scan)"
        name="pay_stub"
        accept="application/pdf,image/*"
        hint="Optional. Upload a PDF or image to auto-detect the amount, then confirm."
        onChange={(e) => {
          const f = e.currentTarget.files?.[0] ?? null;
          setScanFile(f);
          setScannedAmount(null);
        }}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={!scanFile || scanBusy || loading}
          onClick={async () => {
            if (!scanFile) return;
            setScanBusy(true);
            setError(null);
            try {
              const { amount: detected } = await scanIncomeAmountFromFile(scanFile);
              setScannedAmount(detected);
              setConfirmOpen(true);
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Could not scan the file. You can still enter the amount manually."
              );
            } finally {
              setScanBusy(false);
            }
          }}
        >
          {scanBusy ? "Scanning…" : "Scan amount"}
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={loading || scanBusy}
        >
          {loading ? "Saving…" : "Save income"}
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl border border-card-border bg-card p-4">
            <p className="text-sm font-medium">Confirm scanned amount</p>
            <p className="mt-1 text-xs text-muted">
              If this looks wrong, edit it or close and type manually.
            </p>

            <div className="mt-4">
              <Input
                label="Detected amount"
                name="__detected_amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={scannedAmount ?? ""}
                onChange={(e) => setScannedAmount(Number(e.currentTarget.value))}
              />
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setConfirmOpen(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  // Mirror into the real amount input
                  const input = document.querySelector<HTMLInputElement>(
                    'input[name="amount"]'
                  );
                  if (input && scannedAmount && scannedAmount > 0) {
                    input.value = String(scannedAmount);
                  }
                  setConfirmOpen(false);
                }}
              >
                Use this amount
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
