import { MfaVerifyForm } from "@/components/auth/MfaVerifyForm";

export default function VerifyMfaPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-3xl">🔐</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Two-step verification
        </h1>
        <p className="text-sm text-muted">
          Enter the code from your authenticator app.
        </p>
      </div>
      <MfaVerifyForm />
    </div>
  );
}
