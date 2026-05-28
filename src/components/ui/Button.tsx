import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-background font-semibold hover:opacity-90 disabled:opacity-50",
  secondary:
    "bg-card border border-card-border text-foreground hover:bg-card-border/40",
  ghost: "text-muted hover:text-foreground hover:bg-card-border/30",
  danger: "bg-danger/15 text-danger hover:bg-danger/25",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
