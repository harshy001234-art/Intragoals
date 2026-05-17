import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp, type Role } from "@/lib/store";
import { authApi } from "@/lib/api";
import { ArrowRight, Briefcase, ChevronDown, ShieldCheck, User2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const demoRoles: { role: Role; icon: any; title: string; sub: string; color: string }[] = [
  { role: "employee", icon: User2, title: "Employee workspace", sub: "Aarav Mehta - Senior SWE", color: "#075dff" },
  { role: "manager", icon: Briefcase, title: "Manager workspace", sub: "Priya Iyer - Engineering Manager", color: "#F97316" },
  { role: "admin", icon: ShieldCheck, title: "Admin workspace", sub: "Rohan Kapoor - HR Operations", color: "#19d88f" },
];

function LoginPage() {
  const setAuthUser = useApp((s) => s.setAuthUser);
  const loginDemo = useApp((s) => s.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);

  const signIn = async (inputEmail: string, inputPassword: string) => {
    setLoading(true);
    try {
      const user = await authApi.login(inputEmail, inputPassword);
      setAuthUser(user);
      toast.success(`Signed in as ${user.name}`);
      navigate({ to: user.role === "admin" ? "/app/admin" : "/app/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const enterAs = (role: Role) => {
    loginDemo(role);
    const title = role === "admin" ? "Admin" : role === "manager" ? "Manager" : "Employee";
    toast.success(`Opened ${title} sample workspace`);
    navigate({ to: role === "admin" ? "/app/admin" : "/app/dashboard" });
  };

  const continueWithMicrosoft = async () => {
    setSsoLoading(true);
    try {
      await authApi.signInWithMicrosoft();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start Microsoft sign-in.");
      setSsoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      <header className="border-b border-border bg-white/92 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
          <Link to="/"><Logo withTagline /></Link>
          <Button asChild className="bg-brand-gradient text-white hover:opacity-95"><Link to="/register">Create account</Link></Button>
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-2 md:items-center md:py-20">
        <section className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <div className="absolute inset-0 blueprint-grid opacity-60" />
          <div className="relative">
            <div className="text-brand-gradient text-sm font-black uppercase tracking-[0.22em]">Intragoals</div>
            <h1 className="hero-title mt-5 max-w-xl text-5xl text-slate-950 md:text-6xl">
              Run your entire goal cycle in one place
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
              Sign in to manage goals, approvals, check-ins, escalations, and audit reporting from one workspace.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {["Draft", "Approve", "Report"].map((item) => (
                <div key={item} className="rounded-lg border border-[color:var(--brand-cyan)]/25 bg-cyan-50/70 p-4 text-sm font-black text-[color:var(--brand-ink)]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-black text-slate-950">Sign in to Intragoals</h2>
          <p className="mt-2 text-sm text-muted-foreground">Use your work email and password to access your workspace.</p>

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
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Forgot?</Link>
              </div>
              <Input id="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="h-12 w-full bg-brand-gradient font-bold text-white hover:opacity-95">
              {loading ? "Signing in..." : "Sign in"} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> Enterprise sign-in <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={ssoLoading}
            onClick={continueWithMicrosoft}
            className="h-11 w-full border-[color:var(--brand-purple)]/25 bg-white font-bold text-[color:var(--brand-ink)] hover:bg-cyan-50/70"
          >
            <ShieldCheck className="mr-2 h-4 w-4 text-[color:var(--brand-purple)]" />
            {ssoLoading ? "Opening Microsoft..." : "Continue with Microsoft"}
          </Button>

          <div className="mt-6 rounded-lg border border-dashed border-[color:var(--brand-purple)]/25 bg-cyan-50/40 p-4">
            <button
              type="button"
              aria-expanded={sampleOpen}
              aria-controls="sample-workspaces"
              onClick={() => setSampleOpen((open) => !open)}
              className="group flex w-full items-center justify-between gap-3 text-left"
            >
              <span>
                <span className="text-sm font-black text-[color:var(--brand-ink)]">Explore sample workspace</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  Preview Intragoals with preloaded employee, manager, and admin data.
                </span>
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[color:var(--brand-purple)] shadow-sm ring-1 ring-[color:var(--brand-purple)]/15">
                <ChevronDown className={`h-4 w-4 transition ${sampleOpen ? "rotate-180" : ""}`} />
              </span>
            </button>

            {sampleOpen && (
              <div id="sample-workspaces" className="mt-4 grid gap-2 animate-slide-in-soft">
                {demoRoles.map((d) => {
                  const Icon = d.icon;
                  return (
                    <button
                      key={d.role}
                      disabled={loading}
                      onClick={() => enterAs(d.role)}
                      className="group flex items-center gap-3 rounded-lg border border-border bg-white p-3 text-left transition hover:border-[color:var(--brand-purple)]/35 hover:bg-white"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-lg text-white" style={{ background: d.color }}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-950">{d.title}</div>
                        <div className="text-xs text-muted-foreground">{d.sub}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            New here? <Link to="/register" className="font-bold text-foreground hover:underline">Create an account</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
