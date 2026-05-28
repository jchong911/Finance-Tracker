import type { SelectHTMLAttributes } from "react";

export function Select({
  label,
  children,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && <span className="text-muted">{label}</span>}
      <select
        className={`rounded-xl border border-card-border bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
