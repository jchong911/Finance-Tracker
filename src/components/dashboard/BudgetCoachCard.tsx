"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type RuleType = "50-30-20" | "60-20-20" | "zero-based";

type Props = {
  income: number;
  expenses: number;
  fixedExpenses: number;
  savingsGoals: number;
  topCategories: { name: string; total: number }[];
};

export function BudgetCoachCard(props: Props) {
  const [rule, setRule] = useState<RuleType>("50-30-20");
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [source, setSource] = useState<"gemini" | "local" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(
    () => ({
      income: props.income,
      expenses: props.expenses,
      fixedExpenses: props.fixedExpenses,
      savingsGoals: props.savingsGoals,
      topCategories: props.topCategories.slice(0, 5),
      rule,
    }),
    [props, rule]
  );

  async function generateAdvice() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/budget-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Could not generate suggestions.");
        setLoading(false);
        return;
      }
      setLines(Array.isArray(json.advice) ? json.advice : []);
      setSource(json.source === "gemini" ? "gemini" : "local");
    } catch {
      setError("Could not generate suggestions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted">AI Budget Coach</h2>
        {source && (
          <span className="text-xs text-muted">
            {source === "gemini" ? "Gemini mode" : "Smart local mode"}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {(["50-30-20", "60-20-20", "zero-based"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRule(r)}
            className={`rounded-lg px-2 py-2 text-xs transition ${
              rule === r
                ? "bg-accent-dim text-accent"
                : "bg-background text-muted hover:text-foreground"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <Button
          type="button"
          onClick={generateAdvice}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Analyzing..." : "Generate budget suggestions"}
        </Button>
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {lines.length > 0 && (
        <ul className="mt-3 space-y-2 text-sm">
          {lines.map((line, idx) => (
            <li key={`${idx}-${line}`} className="text-foreground">
              • {line}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

