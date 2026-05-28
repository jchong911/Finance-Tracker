"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { validatePassword } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordHints, setPasswordHints] = useState<string[]>([]);

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setLoading(false);
      if (!data.session) {
        setError("Open this page using the link from your email.");
      }
    }
    checkSession();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    const check = validatePassword(password);
    if (!check.valid) {
      setPasswordHints(check.errors);
      setError("Password does not meet security requirements.");
      setSaving(false);
      return;
    }
    setPasswordHints([]);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return <p className="text-center text-sm text-muted">Loading…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        placeholder="••••••••••"
        onChange={(e) => {
          const check = validatePassword(e.currentTarget.value);
          setPasswordHints(check.errors);
        }}
      />

      <Input
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        placeholder="••••••••••"
      />

      {passwordHints.length > 0 && (
        <ul className="space-y-1 text-xs text-muted">
          {passwordHints.map((hint) => (
            <li key={hint}>• {hint}</li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}

