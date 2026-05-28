import type { MonthSummary, Transaction } from "@/types/database";

export function formatMoney(amount: number, currency = "PHP"): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function monthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });
}

export function summarizeMonth(transactions: Transaction[]): MonthSummary {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const net = income - expenses;
  const savingsRate = income > 0 ? (net / income) * 100 : 0;

  return { income, expenses, net, savingsRate };
}

export function spendingByCategory(
  transactions: Transaction[]
): { name: string; icon: string; total: number }[] {
  const map = new Map<string, { name: string; icon: string; total: number }>();

  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const name = t.categories?.name ?? "Uncategorized";
    const icon = t.categories?.icon ?? "•";
    const existing = map.get(name) ?? { name, icon, total: 0 };
    existing.total += Number(t.amount);
    map.set(name, existing);
  }

  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function accountBalance(
  initialBalance: number,
  transactions: Pick<Transaction, "type" | "amount">[]
): number {
  return transactions.reduce((balance, t) => {
    const amount = Number(t.amount);
    if (t.type === "income") return balance + amount;
    if (t.type === "expense") return balance - amount;
    return balance;
  }, initialBalance);
}
