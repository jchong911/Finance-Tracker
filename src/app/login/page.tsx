import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-3xl">💰</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Finance Tracker
        </h1>
        <p className="text-sm text-muted">
          Your personal money dashboard. Only you can access your data.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
