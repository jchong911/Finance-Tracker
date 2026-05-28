"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

type ChallengeLike = { id?: string; data?: { id: string } };

export function MfaEnrollForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  useEffect(() => {
    async function enroll() {
      const supabase = createClient();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const existing = factors?.totp?.find((f) => f.status === "verified");
      if (existing) {
        router.replace("/");
        router.refresh();
        return;
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Finance Tracker",
      });

      setLoading(false);

      if (enrollError) {
        setError(enrollError.message);
        return;
      }

      if (data?.id && data.totp) {
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
      }
    }

    enroll();
  }, [router]);

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!factorId) return;

    setVerifying(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const code = String(form.get("code")).replace(/\s/g, "");

    const supabase = createClient();
    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeError) {
      setError(challengeError.message);
      setVerifying(false);
      return;
    }

    const c = challenge as unknown as ChallengeLike;
    const challengeId = c.id ?? c.data?.id;
    if (!challengeId) {
      setError("Could not start MFA challenge.");
      setVerifying(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    setVerifying(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <p className="text-center text-sm text-muted">Setting up authenticator…</p>;
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <p className="text-sm text-muted">
        Scan this QR code with Google Authenticator, Microsoft Authenticator, or
        any TOTP app. You will need a code from that app every time you sign in.
      </p>

      {qrCode && (
        <div className="flex justify-center rounded-2xl border border-card-border bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="Authenticator QR code" className="h-48 w-48" />
        </div>
      )}

      {secret && (
        <p className="break-all text-center text-xs text-muted">
          Manual key: <span className="font-mono text-foreground">{secret}</span>
        </p>
      )}

      <Input
        label="6-digit code from your app"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        placeholder="000000"
        required
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" className="w-full" disabled={verifying || !factorId}>
        {verifying ? "Verifying…" : "Enable two-step login"}
      </Button>
    </form>
  );
}
