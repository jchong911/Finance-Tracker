import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-3xl">🔑</p>
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="text-sm text-muted">
          We’ll email you a link to set a new password.
        </p>
      </div>

      <ForgotPasswordForm />

      <Link
        href="/login"
        className="block w-full text-center text-sm text-muted hover:text-foreground"
      >
        Back to sign in
      </Link>
    </div>
  );
}

