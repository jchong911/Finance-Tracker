import { Card } from "@/components/ui/Card";
import { accountBalance, formatMoney } from "@/lib/finance";
import type { Account, Transaction } from "@/types/database";

export function AccountList({
  accounts,
  transactionsByAccount,
}: {
  accounts: Account[];
  transactionsByAccount: Record<string, Pick<Transaction, "type" | "amount">[]>;
}) {
  if (accounts.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">
          No accounts yet. Add one below to start tracking balances.
        </p>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {accounts.map((account) => {
        const txs = transactionsByAccount[account.id] ?? [];
        const balance = accountBalance(
          Number(account.initial_balance),
          txs
        );

        return (
          <li key={account.id}>
            <Card className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: account.color }}
                />
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-xs capitalize text-muted">{account.type}</p>
                </div>
              </div>
              <p className="text-lg font-semibold">
                {formatMoney(balance, account.currency)}
              </p>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
