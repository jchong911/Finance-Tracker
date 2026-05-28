"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { validatePassword } from "@/lib/auth/password";
import { MfaVerifyForm } from "@/components/auth/MfaVerifyForm";

type Step = "credentials" | "mfa";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState<Step>("credentials");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordHints, setPasswordHints] = useState<string[]>([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);

  async function handleCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setConfirmPasswordError(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (mode === "signup") {
      const check = validatePassword(password);
      if (!check.valid) {
        setPasswordHints(check.errors);
        setError("Password does not meet security requirements.");
        setLoading(false);
        return;
      }
      setPasswordHints([]);

      if (password !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match.");
        setLoading(false);
        return;
      }
    }

    const supabase = createClient();

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      setMessage("Account created. Sign in to set up your authenticator app.");
      setMode("signin");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    const { data: aal, error: aalError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aalError) {
      setLoading(false);
      setError(aalError.message);
      return;
    }

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const hasVerifiedTotp = !!factors?.totp?.some(
      (f) => f.status === "verified"
    );

    setLoading(false);

    if (!hasVerifiedTotp) {
      router.push("/login/enroll-mfa");
      router.refresh();
      return;
    }

    if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      router.push("/login/verify-mfa");
      router.refresh();
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (step === "mfa") {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium">Two-step verification</p>
        <MfaVerifyForm />
        <button
          type="button"
          className="w-full text-center text-sm text-muted hover:text-foreground"
          onClick={() => setStep("credentials")}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleCredentials} className="space-y-4">
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@example.com"
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        required
        minLength={10}
        placeholder="••••••••••"
        onChange={(e) => {
          if (mode === "signup") {
            const check = validatePassword(e.currentTarget.value);
            setPasswordHints(check.errors);
            setConfirmPasswordError(null);
          }
        }}
      />

      {mode === "signup" && (
        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          placeholder="••••••••••"
          onChange={() => setConfirmPasswordError(null)}
        />
      )}

      {mode === "signup" && passwordHints.length > 0 && (
        <ul className="space-y-1 text-xs text-muted">
          {passwordHints.map((hint) => (
            <li key={hint}>• {hint}</li>
          ))}
        </ul>
      )}

      {mode === "signup" && (
        <p className="text-xs text-muted">
          Passwords are hashed by Supabase (never stored as plain text). After signup,
          you will set up an authenticator app for login codes.
        </p>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
      {confirmPasswordError && (
        <p className="text-sm text-danger">{confirmPasswordError}</p>
      )}
      {message && <p className="text-sm text-accent">{message}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? "Please wait…"
          : mode === "signin"
            ? "Sign in"
            : "Create account"}
      </Button>

      {mode === "signin" && (
        <button
          type="button"
          className="w-full text-center text-sm text-muted hover:text-foreground"
          onClick={() => router.push("/login/forgot")}
        >
          Forgot password?
        </button>
      )}

      <button
        type="button"
        className="w-full text-center text-sm text-muted hover:text-foreground"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setPasswordHints([]);
          setError(null);
          setConfirmPasswordError(null);
        }}
      >
        {mode === "signin"
          ? "First time? Create an account"
          : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
