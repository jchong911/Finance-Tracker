import { MfaEnrollForm } from "@/components/auth/MfaEnrollForm";

export default function EnrollMfaPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-3xl">🔐</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Set up authenticator
        </h1>
        <p className="text-sm text-muted">
          Required for every sign-in. Use any TOTP authenticator app.
        </p>
      </div>
      <MfaEnrollForm />
    </div>
  );
}
