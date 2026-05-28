import type { InputHTMLAttributes } from "react";

export function FileInput({
  label,
  hint,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && <span className="text-muted">{label}</span>}
      <input
        type="file"
        className={`rounded-xl border border-dashed border-card-border bg-background px-3 py-3 text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-accent-dim file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent ${className}`}
        {...props}
      />
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}
