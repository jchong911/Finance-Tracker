import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-3xl">🔐</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Choose a new password
        </h1>
        <p className="text-sm text-muted">
          This page only works if you opened it from your reset email.
        </p>
      </div>

      <ResetPasswordForm />

      <Link
        href="/login"
        className="block w-full text-center text-sm text-muted hover:text-foreground"
      >
        Back to sign in
      </Link>
    </div>
  );
}

