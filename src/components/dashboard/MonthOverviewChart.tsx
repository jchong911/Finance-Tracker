import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/finance";

export type OverviewSegment = {
  label: string;
  value: number;
  color: string;
};

const SIZE = 200;
const STROKE = 28;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function buildArcs(segments: OverviewSegment[]) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return [];

  let offset = 0;
  return segments.map((segment) => {
    const fraction = segment.value / total;
    const length = fraction * CIRCUMFERENCE;
    const arc = {
      ...segment,
      dasharray: `${length} ${CIRCUMFERENCE - length}`,
      dashoffset: -offset,
    };
    offset += length;
    return arc;
  });
}

export function MonthOverviewChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: OverviewSegment[];
  centerLabel: string;
  centerValue: string;
}) {
  const active = segments.filter((s) => s.value > 0);
  const arcs = buildArcs(active);
  const hasData = arcs.length > 0;

  return (
    <Card>
      <h2 className="mb-4 text-sm font-medium text-muted">This month at a glance</h2>

      {!hasData ? (
        <p className="text-center text-sm text-muted py-8">
          Add income and spending to see your money-pool chart.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:justify-center">
          <div className="relative shrink-0">
            <svg
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="-rotate-90"
              role="img"
              aria-label="Monthly money pool chart"
            >
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="var(--card-border)"
                strokeWidth={STROKE}
              />
              {arcs.map((arc) => (
                <circle
                  key={arc.label}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={STROKE}
                  strokeDasharray={arc.dasharray}
                  strokeDashoffset={arc.dashoffset}
                  strokeLinecap="butt"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <p className="text-xs text-muted">{centerLabel}</p>
              <p className="text-lg font-semibold leading-tight">{centerValue}</p>
            </div>
          </div>

          <ul className="w-full space-y-2.5 sm:w-auto sm:min-w-[160px]">
            {active.map((segment) => {
              const total = active.reduce((sum, s) => sum + s.value, 0);
              const pct = total > 0 ? Math.round((segment.value / total) * 100) : 0;
              return (
                <li key={segment.label} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="flex-1 text-muted">{segment.label}</span>
                  <span className="font-medium">{formatMoney(segment.value)}</span>
                  <span className="text-xs text-muted w-9 text-right">{pct}%</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
