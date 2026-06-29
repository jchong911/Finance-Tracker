import { NextResponse } from "next/server";

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

type ChatRequest = {
  question: string;
  context: BudgetContext;
};

function formatPhp(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

function localAnswer(req: ChatRequest): string {
  const q = req.question.toLowerCase();
  const { context } = req;
  const remaining = context.remaining;
  const savingsTarget40 = context.moneyPool * 0.4;
  const savingsAlready = context.goalSetAside;
  const canHit40 = savingsAlready >= savingsTarget40;
  const top = context.topCategories?.[0];

  // Detect simple "can I afford X" questions.
  const amountMatch = req.question.match(/([0-9][0-9,]{2,})(?:\.\d+)?/);
  const amount = amountMatch
    ? Number(amountMatch[1].replace(/,/g, ""))
    : null;

  if (amount != null && /afford|can i|can we|buy|spend|trip/.test(q)) {
    const after = remaining - amount;
    const ok = after >= 0;
    if (ok) {
      const savingsNote = canHit40
        ? "You’re already on track for a 40% savings goal."
        : `If you still want a 40% savings goal, try to increase goal set-aside by about ${formatPhp(
            Math.max(0, savingsTarget40 - savingsAlready)
          )} this month.`;
      return `Yes. You have about ${formatPhp(
        remaining
      )} remaining this month, so after ${formatPhp(amount)} you’d have ${formatPhp(
        after
      )} left. ${savingsNote}`;
    }

    const short = Math.abs(after);
    const suggestion = top
      ? `Consider cutting back on “${top.name}” (currently ${formatPhp(
          top.total
        )}) to free up ${formatPhp(short)}.`
      : `Consider reducing variable spending by ${formatPhp(short)}.`;

    return `No. You have about ${formatPhp(
      remaining
    )} remaining this month, so you’re short by ${formatPhp(
      short
    )}. ${suggestion}`;
  }

  return [
    `Here are your current numbers for ${context.month}:`,
    `Income: ${formatPhp(context.income)}`,
    `Spent: ${formatPhp(context.expenses)} (fixed ${formatPhp(
      context.fixedExpenses
    )}, variable ${formatPhp(context.variableExpenses)})`,
    `Set aside to goals: ${formatPhp(context.goalSetAside)}`,
    `Remaining money: ${formatPhp(context.remaining)}`,
    top
      ? `Top category: ${top.name} at ${formatPhp(top.total)}`
      : "Top category: —",
    "",
    "Ask something like: “Can I afford Php 5,000 this weekend?”",
  ].join("\n");
}

async function aiAnswer(req: ChatRequest): Promise<string | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  const prompt = [
    "You are a finance assistant for a Philippine user.",
    "Rules:",
    "- Use the provided numbers as the only source of truth.",
    "- Give a direct answer first (Yes/No when applicable).",
    "- Keep it short: 3-6 sentences max.",
    "- Use PHP currency formatting (₱ / Php).",
    `Context JSON: ${JSON.stringify(req.context)}`,
    `User question: ${req.question}`,
  ].join("\n");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationConfig: { temperature: 0.3 },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!res.ok) return null;
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("\n");
  if (!text || typeof text !== "string") return null;

  return text.trim();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    if (!body?.question || !body?.context) {
      return NextResponse.json({ error: "Missing question/context." }, { status: 400 });
    }

    const answer = (await aiAnswer(body)) ?? localAnswer(body);
    return NextResponse.json({
      answer,
      source: process.env.GOOGLE_API_KEY ? "gemini_or_local" : "local",
    });
  } catch {
    return NextResponse.json({ error: "Could not answer question." }, { status: 400 });
  }
}

