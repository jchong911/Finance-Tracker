import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/finance";

export type OverviewSegment = {
  label: string;
  value: number;
  color: string;
  /** Shown in legend when different from value (e.g. actual spent vs limit arc). */
  detail?: string;
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
  emptyMessage = "Add income and spending to see your money-pool chart.",
}: {
  segments: OverviewSegment[];
  centerLabel: string;
  centerValue: string;
  emptyMessage?: string;
}) {
  const arcs = buildArcs(segments);
  const hasData = arcs.length > 0;
  const legendSegments = segments.filter((s) => s.value > 0 || s.detail);

  return (
    <Card>
      <h2 className="mb-4 text-sm font-medium text-muted">This month at a glance</h2>

      {!hasData ? (
        <p className="py-8 text-center text-sm text-muted">{emptyMessage}</p>
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
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
              <p className="text-xs text-muted">{centerLabel}</p>
              <p className="text-lg font-semibold leading-tight">{centerValue}</p>
            </div>
          </div>

          <ul className="w-full space-y-2.5 sm:w-auto sm:min-w-[180px]">
            {legendSegments.map((segment) => {
              const total = segments.reduce((sum, s) => sum + s.value, 0);
              const pct =
                total > 0 ? Math.round((segment.value / total) * 100) : 0;
              return (
                <li
                  key={segment.label}
                  className="flex items-start gap-2 text-sm"
                >
                  <span
                    className="mt-1 h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-muted">{segment.label}</p>
                    {segment.detail ? (
                      <p className="text-xs text-muted">{segment.detail}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium">{formatMoney(segment.value)}</p>
                    <p className="text-xs text-muted">{pct}%</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
