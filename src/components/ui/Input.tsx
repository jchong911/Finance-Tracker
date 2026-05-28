import type { InputHTMLAttributes } from "react";

export function Input({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && <span className="text-muted">{label}</span>}
      <input
        className={`rounded-xl border border-card-border bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent ${className}`}
        {...props}
      />
    </label>
  );
}
