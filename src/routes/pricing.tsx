import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

function PricingPage() {
  const tiers = [
    { name: "Team", price: "$8", per: "user / month", desc: "For teams of 25-250", features: ["Goal sheet workflow", "Manager approvals", "Quarterly check-ins", "Email notifications"] },
    { name: "Business", price: "$14", per: "user / month", desc: "For 250-2,500 users", features: ["Everything in Team", "Shared departmental KPIs", "Escalation rules + n8n", "CSV / Excel exports"], featured: true },
    { name: "Enterprise", price: "Custom", per: "annual", desc: "For 2,500+ and regulated industries", features: ["SSO (SAML / OIDC)", "Custom audit retention", "Premium support", "Dedicated success manager"] },
  ];
  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      <header className="border-b border-border bg-white/92 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
          <Link to="/"><Logo /></Link>
          <Button asChild size="sm" className="bg-brand-gradient text-white hover:opacity-95"><Link to="/login">Get Started</Link></Button>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="max-w-2xl">
          <div className="text-brand-gradient text-xs font-black uppercase tracking-[0.18em]">Pricing</div>
          <h1 className="display-font mt-3 text-4xl text-[color:var(--brand-ink)] md:text-6xl">Simple, predictable pricing</h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">Annual billing. Volume discounts available. All plans include unlimited goals and quarterly cycles.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {tiers.map((t) => (
            <div key={t.name} className={`rounded-lg border bg-white p-6 shadow-sm ${t.featured ? "border-[color:var(--brand-cyan)]/40 ring-glow" : "border-slate-200"}`}>
              <div className="text-brand-gradient text-xs font-black uppercase tracking-[0.18em]">{t.name}</div>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-black text-slate-950">{t.price}</span>
                <span className="pb-1 text-xs text-muted-foreground">{t.per}</span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{t.desc}</div>
              <ul className="mt-6 space-y-2 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[color:var(--brand-green)]" /> {f}</li>
                ))}
              </ul>
              <Button asChild className={`mt-6 w-full ${t.featured ? "bg-brand-gradient text-white hover:opacity-95" : ""}`} variant={t.featured ? "default" : "outline"}>
                <Link to="/contact">{t.name === "Enterprise" ? "Contact sales" : "Start trial"}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
