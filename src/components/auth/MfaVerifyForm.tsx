"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

type ChallengeLike = { id?: string; data?: { id: string } };

export function MfaVerifyForm() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function prepareChallenge() {
      const supabase = createClient();
      const { data: factors, error: listError } =
        await supabase.auth.mfa.listFactors();

      if (listError) {
        setError(listError.message);
        setLoading(false);
        return;
      }

      const verified = factors.totp?.find((f) => f.status === "verified");
      if (!verified) {
        router.replace("/login/enroll-mfa");
        router.refresh();
        return;
      }

      setFactorId(verified.id);

      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: verified.id });

      setLoading(false);

      if (challengeError) {
        setError(challengeError.message);
        return;
      }

      const c = challenge as unknown as ChallengeLike;
      const id = c.id ?? c.data?.id;
      if (!id) {
        setError("Could not start MFA challenge.");
        return;
      }

      setChallengeId(id);
    }

    prepareChallenge();
  }, [router]);

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!factorId || !challengeId) return;

    setVerifying(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const code = String(form.get("code")).replace(/\s/g, "");

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    setVerifying(false);

    if (verifyError) {
      setError(verifyError.message);
      router.refresh();
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <p className="text-center text-sm text-muted">Preparing verification…</p>;
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <p className="text-sm text-muted">
        Enter the 6-digit code from your authenticator app to finish signing in.
      </p>

      <Input
        label="Authentication code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        placeholder="000000"
        required
        autoFocus
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button
        type="submit"
        className="w-full"
        disabled={verifying || !factorId || !challengeId}
      >
        {verifying ? "Verifying…" : "Verify and continue"}
      </Button>
    </form>
  );
}
