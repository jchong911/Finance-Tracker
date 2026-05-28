export type AccountType =
  | "checking"
  | "savings"
  | "credit"
  | "cash"
  | "investment"
  | "other";

export type CategoryKind = "income" | "expense";

export type TransactionType = "income" | "expense" | "transfer";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  currency: string;
  initial_balance: number;
  color: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  occurred_on: string;
  is_fixed: boolean;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
  created_at: string;
  categories?: Pick<Category, "name" | "icon" | "color" | "kind"> | null;
  accounts?: Pick<Account, "name" | "color"> | null;
}

export interface MonthSummary {
  income: number;
  expenses: number;
  net: number;
  savingsRate: number;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  notes: string;
  target_amount: number;
  monthly_auto_amount: number;
  status: "active" | "achieved" | "diverted";
  created_at: string;
}

export interface GoalContribution {
  id: string;
  user_id: string;
  goal_id: string;
  amount: number;
  contributed_on: string;
  created_at: string;
}
