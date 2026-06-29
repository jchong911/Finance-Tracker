"use client";

import { useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatMoney } from "@/lib/finance";

type BudgetContext = {
  month: string;
  income: number;
  expenses: number;
  fixedExpenses: number;
  variableExpenses: number;
  goalSetAside: number;
  carryover: number;
  moneyPool: number;
  remaining: number;
  topCategories: { name: string; total: number }[];
};

type Message = { role: "user" | "assistant"; text: string };

export function FinanceChatCard({
  context,
}: {
  context: BudgetContext;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: `Ask your financial data a question. For example:\n“Can I afford a Php 5,000 weekend trip right now?”`,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const summaryLine = useMemo(() => {
    return `Remaining ${formatMoney(context.remaining)} · Income ${formatMoney(
      context.income
    )} · Spent ${formatMoney(context.expenses)} · Goals ${formatMoney(
      context.goalSetAside
    )}`;
  }, [context]);

  async function ask(question: string) {
    setLoading(true);
    setError(null);

    setMessages((prev) => [...prev, { role: "user", text: question }]);

    try {
      const res = await fetch("/api/finance-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Could not answer.");
        setLoading(false);
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: String(json.answer ?? "").trim() || "—" },
      ]);
    } catch {
      setError("Could not answer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-muted">Finance Chat</h2>
          <p className="mt-1 text-xs text-muted">{summaryLine}</p>
        </div>
      </div>

      <div className="max-h-64 space-y-3 overflow-auto rounded-xl border border-card-border bg-background p-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap text-sm ${
              m.role === "user" ? "text-foreground" : "text-muted"
            }`}
          >
            <span className="font-medium">
              {m.role === "user" ? "You" : "AI"}:
            </span>{" "}
            {m.text}
          </div>
        ))}
        {loading && (
          <p className="text-sm text-muted">
            <span className="font-medium">AI:</span> Thinking…
          </p>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <form
        ref={formRef}
        className="grid grid-cols-1 gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const q = String(form.get("question") ?? "").trim();
          if (!q || loading) return;
          e.currentTarget.reset();
          void ask(q);
        }}
      >
        <Input
          label="Ask your financial data a question…"
          name="question"
          placeholder="Can I afford Php 5,000 this weekend?"
          disabled={loading}
          autoComplete="off"
        />
        <Button type="submit" disabled={loading}>
          Ask
        </Button>
      </form>
    </Card>
  );
}

