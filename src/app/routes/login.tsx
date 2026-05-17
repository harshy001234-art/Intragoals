import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { IntragoalsLogo } from "@/components/shared/intragoals-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi, isMicrosoftAuthEnabled } from "@/intragoals/auth/auth-api";
import { useApp } from "@/intragoals/workspace/store";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const setAuthUser = useApp((s) => s.setAuthUser);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedRemember = window.localStorage.getItem("intragoals-remember-me") === "true";
    const storedEmail = window.localStorage.getItem("intragoals-remembered-email") || "";
    setRememberMe(storedRemember);
    if (storedRemember && storedEmail) setEmail(storedEmail);
  }, []);

  const signIn = async (inputEmail: string, inputPassword: string) => {
    setLoading(true);
    try {
      const user = await authApi.login(inputEmail, inputPassword);
      if (typeof window !== "undefined") {
        if (rememberMe) {
          window.localStorage.setItem("intragoals-remember-me", "true");
          window.localStorage.setItem("intragoals-remembered-email", inputEmail.trim());
        } else {
          window.localStorage.removeItem("intragoals-remember-me");
          window.localStorage.removeItem("intragoals-remembered-email");
        }
      }
      setAuthUser(user);
      toast.success(`Signed in as ${user.name}`);
      navigate({ to: user.role === "admin" ? "/app/admin" : "/app/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const continueWithMicrosoft = async () => {
    setSsoLoading(true);
    try {
      const { url } = await authApi.signInWithMicrosoft();
      window.location.assign(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start Microsoft sign-in.");
      setSsoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      <header className="border-b border-border bg-white/92 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
          <Link to="/">
            <IntragoalsLogo withTagline />
          </Link>
          <Button asChild className="bg-brand-gradient text-white hover:opacity-95">
            <Link to="/register">Create account</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-2 md:items-center md:py-20">
        <section className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <div className="absolute inset-0 blueprint-grid opacity-60" />
          <div className="relative">
            <div className="text-brand-gradient text-sm font-black uppercase tracking-[0.22em]">
              Intragoals
            </div>
            <h1 className="hero-title mt-5 max-w-xl text-5xl text-slate-950 md:text-6xl">
              Run your entire goal cycle in one place
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
              Sign in to manage goals, approvals, check-ins, escalations, and audit reporting from
              one workspace.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {["Draft", "Approve", "Report"].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-[color:var(--brand-cyan)]/25 bg-cyan-50/70 p-4 text-sm font-black text-[color:var(--brand-ink)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-black text-slate-950">Sign in to Intragoals</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your work email and password to access your workspace.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!email || !password) {
                toast.error("Please enter your email and password.");
                return;
              }
              void signIn(email, password);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="remember-me"
                className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700"
              >
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border border-[color:var(--brand-purple)]/50 accent-[color:var(--brand-purple)]"
                />
                <span>Remember me</span>
              </label>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full bg-brand-gradient font-bold text-white hover:opacity-95"
            >
              {loading ? "Signing in..." : "Sign in"} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> Enterprise sign-in{" "}
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={ssoLoading || !isMicrosoftAuthEnabled}
            onClick={continueWithMicrosoft}
            className="h-11 w-full border-[color:var(--brand-purple)]/25 bg-white font-bold text-[color:var(--brand-ink)] hover:bg-cyan-50/70"
            title={
              isMicrosoftAuthEnabled
                ? "Sign in with Microsoft Azure."
                : "Microsoft Azure sign-in is disabled for this workspace."
            }
          >
            <ShieldCheck className="mr-2 h-4 w-4 text-[color:var(--brand-purple)]" />
            {ssoLoading ? "Opening Microsoft..." : "Continue with Microsoft"}
          </Button>
          {!isMicrosoftAuthEnabled ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Microsoft sign-in is currently disabled for this workspace.
            </p>
          ) : null}
          <p className="mt-6 text-xs text-muted-foreground">
            New here?{" "}
            <Link to="/register" className="font-bold text-foreground hover:underline">
              Create an account
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
