import { AccountForm } from "@/components/accounts/AccountForm";
import { AccountList } from "@/components/accounts/AccountList";
import { AppShell } from "@/components/layout/AppShell";
import { getAccounts, getAllTransactionsForBalances } from "@/lib/queries";
import type { Transaction } from "@/types/database";

export default async function AccountsPage() {
  const [accounts, allTx] = await Promise.all([
    getAccounts(),
    getAllTransactionsForBalances(),
  ]);

  const transactionsByAccount: Record<
    string,
    Pick<Transaction, "type" | "amount">[]
  > = {};

  for (const tx of allTx) {
    if (!tx.account_id) continue;
    const list = transactionsByAccount[tx.account_id] ?? [];
    list.push({ type: tx.type, amount: tx.amount });
    transactionsByAccount[tx.account_id] = list;
  }

  return (
    <AppShell title="Accounts">
      <div className="space-y-6">
        <AccountList
          accounts={accounts}
          transactionsByAccount={transactionsByAccount}
        />
        <AccountForm />
      </div>
    </AppShell>
  );
}
