import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <AppShell title="Password">
      <Card className="space-y-3">
        <p className="text-sm text-muted">
          Use this if you’re logged in and want to change your password.
        </p>
        <ChangePasswordForm />
      </Card>
    </AppShell>
  );
}

