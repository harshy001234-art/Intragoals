import { createFileRoute, Link } from "@tanstack/react-router";
import { IntragoalsLogo } from "@/components/shared/intragoals-logo";

export const Route = createFileRoute("/privacy")({
  component: () => (
    <LegalShell title="Privacy Policy" updated="May 2026">
      <p>
        Intragoals processes personal data on behalf of your employer to operate the goal-setting
        and tracking workflow. We collect work identity, goal content, quarterly check-in entries,
        approval activity, and audit metadata.
      </p>
      <p>
        We do not sell personal data. Customer data is stored in encrypted databases and accessed
        only by authorized administrators with role-based controls. Audit logs are append-only and
        retained for the duration of the contract.
      </p>
      <p>
        You may request access, correction, or deletion of your personal data through your HR
        administrator. For privacy questions, contact privacy@intragoals.com.
      </p>
    </LegalShell>
  ),
});

function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      <header className="border-b border-border bg-white/92 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
          <Link to="/">
            <IntragoalsLogo />
          </Link>
          <Link
            to="/"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Back to home
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-5 py-16">
        <div className="text-brand-gradient text-xs font-black uppercase tracking-[0.18em]">
          {updated}
        </div>
        <h1 className="display-font mt-3 text-4xl text-[color:var(--brand-ink)] md:text-5xl">
          {title}
        </h1>
        <div className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-7 text-sm leading-relaxed text-muted-foreground shadow-sm">
          {children}
        </div>
      </article>
    </div>
  );
}

export { LegalShell };
