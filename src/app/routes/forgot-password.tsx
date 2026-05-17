import { createFileRoute, Link } from "@tanstack/react-router";
import { IntragoalsLogo } from "@/components/shared/intragoals-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/intragoals/auth/auth-api";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="grid min-h-screen place-items-center bg-[#f7f9ff] p-6">
      <div className="w-full max-w-md">
        <Link to="/">
          <IntragoalsLogo withTagline />
        </Link>
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-black text-slate-950">Reset your password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your work email and we'll send a reset link.
          </p>
          <form
            className="mt-5 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!email) return toast.error("Email is required.");
              setLoading(true);
              try {
                await authApi.resetPassword(email);
                toast.success("If that account exists, a reset link is on its way.");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to send reset link.");
              } finally {
                setLoading(false);
              }
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-brand-gradient font-bold text-white hover:opacity-95"
            >
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
          <p className="mt-4 text-xs text-muted-foreground">
            Remembered?{" "}
            <Link to="/login" className="text-foreground hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
