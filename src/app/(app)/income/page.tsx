import { AppShell } from "@/components/layout/AppShell";
import { EntryListClient } from "@/components/transactions/EntryListClient";
import { IncomeForm } from "@/components/transactions/IncomeForm";
import { getAccounts, getCategories, getTransactionsByType } from "@/lib/queries";

export default async function IncomePage() {
  const [accounts, categories, income] = await Promise.all([
    getAccounts(),
    getCategories(),
    getTransactionsByType("income"),
  ]);

  return (
    <AppShell title="Income">
      <div className="space-y-6">
        <EntryListClient
          entries={income}
          type="income"
          addHref="#add-income"
          addLabel="Log your first paycheck"
        />
        <div id="add-income">
          <IncomeForm accounts={accounts} categories={categories} />
        </div>
      </div>
    </AppShell>
  );
}
