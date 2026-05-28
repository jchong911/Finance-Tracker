import { NextResponse } from "next/server";

type RuleType = "50-30-20" | "60-20-20" | "zero-based";

type BudgetInput = {
  income: number;
  expenses: number;
  fixedExpenses: number;
  savingsGoals: number;
  topCategories: { name: string; total: number }[];
  rule: RuleType;
};

function formatPhp(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

function buildRuleTargets(income: number, rule: RuleType) {
  if (rule === "60-20-20") {
    return {
      needs: income * 0.6,
      wants: income * 0.2,
      savings: income * 0.2,
      label: "60/20/20 (needs/wants/savings)",
    };
  }
  if (rule === "zero-based") {
    return {
      needs: income * 0.55,
      wants: income * 0.2,
      savings: income * 0.25,
      label: "Zero-based starter split",
    };
  }
  return {
    needs: income * 0.5,
    wants: income * 0.3,
    savings: income * 0.2,
    label: "50/30/20 (needs/wants/savings)",
  };
}

function localAdvice(input: BudgetInput): string[] {
  const { income, expenses, fixedExpenses, savingsGoals, topCategories, rule } = input;
  if (income <= 0) {
    return [
      "No income detected this month yet. Log income first, then run Budget Coach again.",
      "Until then, keep spending to essential fixed expenses only.",
    ];
  }

  const net = income - expenses;
  const targets = buildRuleTargets(income, rule);
  const variableExpenses = Math.max(0, expenses - fixedExpenses);
  const fixedRatio = fixedExpenses / income;

  const lines: string[] = [
    `Rule selected: ${targets.label}.`,
    `Current net is ${formatPhp(net)} from income ${formatPhp(income)} and expenses ${formatPhp(expenses)}.`,
    `Target savings by this rule is about ${formatPhp(targets.savings)} this month.`,
  ];

  if (fixedRatio > 0.5) {
    lines.push(
      `Fixed expenses are high at ${Math.round(
        fixedRatio * 100
      )}% of income. Prioritize trimming rent/subscription obligations first.`
    );
  } else {
    lines.push(
      `Fixed expenses are ${Math.round(
        fixedRatio * 100
      )}% of income; keep them under 50% to protect savings flexibility.`
    );
  }

  if (savingsGoals > 0) {
    if (targets.savings >= savingsGoals) {
      lines.push(
        `Your active goals total ${formatPhp(
          savingsGoals
        )} and can fit the current rule's savings target.`
      );
    } else {
      lines.push(
        `Active goals total ${formatPhp(
          savingsGoals
        )}, above the rule target. Consider extending timeline or reducing variable spending by ${formatPhp(
          savingsGoals - targets.savings
        )}.`
      );
    }
  }

  const worst = topCategories[0];
  if (worst) {
    lines.push(
      `Top spending category is "${worst.name}" at ${formatPhp(
        worst.total
      )}. Start optimization there for fastest impact.`
    );
  }

  lines.push(
    `Suggested monthly cap for variable expenses: ${formatPhp(
      Math.max(0, targets.needs + targets.wants - fixedExpenses)
    )} (current variable: ${formatPhp(variableExpenses)}).`
  );

  return lines;
}

async function aiAdvice(input: BudgetInput): Promise<string[] | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  const prompt = [
    "You are a personal budgeting coach for a Philippine user.",
    "Give concise practical advice in 5 bullet points max.",
    "Use the chosen budgeting rule and user's numbers.",
    `Data: ${JSON.stringify(input)}`,
  ].join("\n");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.4,
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    }),
    }
  );

  if (!res.ok) return null;
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("\n");
  if (!text || typeof text !== "string") return null;

  return text
    .split(/\r?\n/)
    .map((line: string) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 6);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BudgetInput;
    const ai = await aiAdvice(body);
    const advice = ai ?? localAdvice(body);
    return NextResponse.json({ advice, source: ai ? "gemini" : "local" });
  } catch {
    return NextResponse.json(
      { error: "Could not generate budget advice." },
      { status: 400 }
    );
  }
}

