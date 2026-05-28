import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/finance";

export function CategoryBreakdown({
  items,
}: {
  items: { name: string; icon: string; total: number }[];
}) {
  if (items.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">
          No spending recorded this month yet.
        </p>
      </Card>
    );
  }

  const max = items[0]?.total ?? 1;

  return (
    <Card>
      <h2 className="mb-3 text-sm font-medium text-muted">Top spending</h2>
      <ul className="space-y-3">
        {items.slice(0, 6).map((item) => (
          <li key={item.name}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>
                {item.icon} {item.name}
              </span>
              <span className="font-medium">{formatMoney(item.total)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-card-border">
              <div
                className="h-full rounded-full bg-expense/80"
                style={{ width: `${(item.total / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
