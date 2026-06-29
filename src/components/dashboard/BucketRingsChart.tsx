import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/finance";
import type { BucketProgress } from "@/lib/budgetProgress";

const SIZE = 108;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function BucketRing({ bucket }: { bucket: BucketProgress }) {
  const { limit, spent, remaining, color, isOver, name, targetPercent, id } =
    bucket;

  const hasLimit = limit > 0;
  const fillRatio = hasLimit ? Math.min(spent / limit, 1) : 0;
  const filledLength = fillRatio * CIRCUMFERENCE;
  const ringColor = isOver ? "#f87171" : color;

  const centerValue = hasLimit
    ? isOver
      ? formatMoney(spent - limit)
      : formatMoney(Math.max(0, remaining))
    : spent > 0
      ? formatMoney(spent)
      : "—";

  const centerLabel = hasLimit
    ? isOver
      ? "Over"
      : "Left"
    : spent > 0
      ? "Spent"
      : "No limit";

  const usageLabel =
    id === "savings"
      ? `${formatMoney(spent)} set aside`
      : `${formatMoney(spent)} spent`;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative shrink-0">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          role="img"
          aria-label={`${name} budget ring`}
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--card-border)"
            strokeWidth={STROKE}
          />
          {(hasLimit || spent > 0) && (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth={STROKE}
              strokeDasharray={`${filledLength} ${CIRCUMFERENCE - filledLength}`}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
          <p className="text-[10px] leading-tight text-muted">{centerLabel}</p>
          <p
            className={`text-sm font-semibold leading-tight ${
              isOver ? "text-danger" : ""
            }`}
          >
            {centerValue}
          </p>
        </div>
      </div>

      <p className="mt-2 text-xs font-medium leading-snug">{name}</p>
      <p className="mt-0.5 text-[11px] text-muted">{targetPercent}% target</p>
      <p className="mt-1 text-[11px] text-muted">
        {usageLabel}
        {hasLimit ? ` · ${formatMoney(limit)} limit` : ""}
      </p>
    </div>
  );
}

export function BucketRingsChart({
  buckets,
  hasIncome,
}: {
  buckets: BucketProgress[];
  hasIncome: boolean;
}) {
  if (buckets.length === 0) return null;

  return (
    <Card>
      <h2 className="mb-1 text-sm font-medium text-muted">Budget buckets</h2>
      <p className="mb-4 text-xs text-muted">
        Each ring is separate — needs and wants spending only affect their own
        bucket.
      </p>

      {!hasIncome ? (
        <p className="mb-4 text-center text-sm text-muted">
          Log income this month to see your limits. Spending still counts toward
          each bucket below.
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        {buckets.map((bucket) => (
          <BucketRing key={bucket.id} bucket={bucket} />
        ))}
      </div>
    </Card>
  );
}
