import { createClient } from "@/lib/supabase/server";
import type {
  Account,
  BudgetRatios,
  Category,
  GoalContribution,
  SavingsGoal,
  Transaction,
} from "@/types/database";

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("accounts")
    .select("*")
    .order("created_at", { ascending: true });
  return (data ?? []) as Account[];
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("kind")
    .order("name");
  return (data ?? []) as Category[];
}

export async function getTransactionsForMonth(
  month: string
): Promise<Transaction[]> {
  const [year, mon] = month.split("-").map(Number);
  const start = `${month}-01`;
  const lastDay = new Date(year, mon, 0).getDate();
  const end = `${month}-${String(lastDay).padStart(2, "0")}`;

  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*, categories(name, icon, color, kind), accounts(name, color)")
    .gte("occurred_on", start)
    .lte("occurred_on", end)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []) as Transaction[];
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*, categories(name, icon, color, kind), accounts(name, color)")
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []) as Transaction[];
}

export async function getTransactionsByType(
  type: "income" | "expense"
): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*, categories(name, icon, color, kind), accounts(name, color)")
    .eq("type", type)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []) as Transaction[];
}

export async function getAllTransactionsForBalances(): Promise<
  Pick<Transaction, "account_id" | "type" | "amount">[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("account_id, type, amount");

  return (data ?? []) as Pick<Transaction, "account_id" | "type" | "amount">[];
}

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("savings_goals")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []) as SavingsGoal[];
}

export async function getActiveSavingsGoals(): Promise<SavingsGoal[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (data ?? []) as SavingsGoal[];
}

export async function getGoalContributions(): Promise<GoalContribution[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("goal_contributions")
    .select("*")
    .order("contributed_on", { ascending: false });

  return (data ?? []) as GoalContribution[];
}

export async function getGoalContributionsForMonth(
  month: string
): Promise<GoalContribution[]> {
  const [year, mon] = month.split("-").map(Number);
  const start = `${month}-01`;
  const lastDay = new Date(year, mon, 0).getDate();
  const end = `${month}-${String(lastDay).padStart(2, "0")}`;

  const supabase = await createClient();
  const { data } = await supabase
    .from("goal_contributions")
    .select("*")
    .gte("contributed_on", start)
    .lte("contributed_on", end)
    .order("contributed_on", { ascending: false });

  return (data ?? []) as GoalContribution[];
}

export async function getCarryoverBeforeMonth(month: string): Promise<number> {
  const start = `${month}-01`;
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("type, amount")
    .lt("occurred_on", start);

  const rows = (data ?? []) as Pick<Transaction, "type" | "amount">[];

  return rows.reduce((sum, row) => {
    const amount = Number(row.amount);
    if (row.type === "income") return sum + amount;
    if (row.type === "expense") return sum - amount;
    return sum;
  }, 0);
}

export async function getBudgetRatios(): Promise<BudgetRatios | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("budget_ratios").select("*").single();
  return (data ?? null) as BudgetRatios | null;
}
