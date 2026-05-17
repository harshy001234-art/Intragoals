import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      <header className="border-b border-border bg-white/92 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
          <Link to="/"><Logo /></Link>
          <Button asChild size="sm" variant="outline" className="border-border"><Link to="/login">Sign in</Link></Button>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-2">
        <div>
          <div className="text-brand-gradient text-xs font-black uppercase tracking-[0.18em]">Contact</div>
          <h1 className="display-font mt-3 text-4xl text-[color:var(--brand-ink)] md:text-6xl">Talk to the Intragoals team</h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">Tell us about your cycle, your team size, and what you're trying to fix. We typically reply within one business day.</p>
          <div className="mt-8 space-y-3 text-sm">
            <div><span className="text-muted-foreground">Sales: </span>sales@intragoals.com</div>
            <div><span className="text-muted-foreground">Support: </span>support@intragoals.com</div>
            <div><span className="text-muted-foreground">Privacy: </span>privacy@intragoals.com</div>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.email || !form.message) return toast.error("Email and message are required.");
            toast.success("Thanks - we'll be in touch shortly.");
            setForm({ name: "", email: "", company: "", message: "" });
          }}
          className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <Field label="Name" id="name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Work email" id="email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Company" id="company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
          <div className="space-y-1.5">
            <Label htmlFor="msg">Message</Label>
            <Textarea id="msg" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <Button type="submit" className="h-11 w-full bg-brand-gradient font-bold text-white hover:opacity-95">Send message</Button>
        </form>
      </section>
    </div>
  );
}

function Field({ label, id, type = "text", value, onChange }: { label: string; id: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
