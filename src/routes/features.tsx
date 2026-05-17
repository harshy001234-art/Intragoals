import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Workflow, CheckCircle2, Layers, LineChart, Zap, Bell, ShieldCheck, Users } from "lucide-react";

export const Route = createFileRoute("/features")({
  component: FeaturesPage,
});

const fs = [
  { i: Workflow, t: "Goal Sheet Authoring", d: "Up to 8 goals per employee. Numeric, Percentage, Timeline, and Zero-based UoMs. Min 10% per goal, 100% total weightage." },
  { i: CheckCircle2, t: "Manager Approval Workflow", d: "Approve, return, or reject. Inline edits to targets and weightages. Approved goals lock automatically." },
  { i: Layers, t: "Shared Departmental KPIs", d: "Push KPIs to many recipients with locked title and target. Achievement updates from primary owner sync." },
  { i: LineChart, t: "Quarterly Check-ins", d: "Q1, Q2, Q3, and annual windows with planned vs actual review and structured manager comments." },
  { i: Zap, t: "Auto Progress Scoring", d: "Built-in engine for Min/Max ratios, Timeline progress, and Zero-based achievement." },
  { i: Bell, t: "Notifications + Webhooks", d: "In-app, email via n8n, and Microsoft Teams webhook placeholder integration." },
  { i: ShieldCheck, t: "Audit-grade Logging", d: "Every edit, approval, rejection, unlock, and check-in is captured with previous and new values." },
  { i: Users, t: "RBAC", d: "Employee, Manager, and Admin roles with strict policies enforced server-side." },
];

function FeaturesPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-white/92 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="hidden border-[color:var(--brand-purple)]/25 bg-white text-[color:var(--brand-ink)] hover:bg-cyan-50 sm:inline-flex">
              <Link to="/">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-brand-gradient text-white hover:opacity-95"><Link to="/login">Get Started</Link></Button>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="max-w-2xl">
          <div className="text-brand-gradient text-xs font-black uppercase tracking-[0.18em]">Features</div>
          <h1 className="display-font mt-3 text-4xl text-[color:var(--brand-ink)] md:text-6xl">A complete goal operating system</h1>
          <p className="mt-3 text-muted-foreground">Everything required to run an annual cycle end-to-end, with the controls HR and security teams need.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {fs.map((f) => (
            <div key={f.t} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-[color:var(--brand-purple)]">
                <f.i className="h-5 w-5" />
              </div>
              <div className="mt-4 text-base font-black text-slate-950">{f.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
