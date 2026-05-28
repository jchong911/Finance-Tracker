import { AppShell } from "@/components/layout/AppShell";
import { EntryListClient } from "@/components/transactions/EntryListClient";
import { ExpenditureForm } from "@/components/transactions/ExpenditureForm";
import { getAccounts, getCategories, getTransactionsByType } from "@/lib/queries";

export default async function ExpendituresPage() {
  const [accounts, categories, expenses] = await Promise.all([
    getAccounts(),
    getCategories(),
    getTransactionsByType("expense"),
  ]);

  return (
    <AppShell title="Expenditures">
      <div className="space-y-6">
        <EntryListClient
          entries={expenses}
          type="expense"
          addHref="#add-expense"
          addLabel="Log your first expense"
        />
        <div id="add-expense">
          <ExpenditureForm accounts={accounts} categories={categories} />
        </div>
      </div>
    </AppShell>
  );
}
