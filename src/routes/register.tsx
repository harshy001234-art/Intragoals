import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { useApp } from "@/lib/store";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const setAuthUser = useApp((s) => s.setAuthUser);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  return (
    <div className="grid min-h-screen place-items-center bg-[#f7f9ff] p-6">
      <div className="w-full max-w-md">
        <Link to="/"><Logo withTagline /></Link>
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-black text-slate-950">Create your Intragoals account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use your work email. Your admin will assign a role.</p>
          <form
            className="mt-5 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!form.name || !form.email || !form.password) return toast.error("All fields are required.");
              if (form.password !== form.confirm) return toast.error("Passwords don't match.");
              if (form.password.length < 8) return toast.error("Password must be at least 8 characters.");
              setLoading(true);
              try {
                const result = await authApi.register({ name: form.name, email: form.email, password: form.password });
                if (result.needsEmailConfirmation) {
                  toast.success("Account created. Check your email to confirm your sign-in.");
                  navigate({ to: "/login" });
                  return;
                }
                if (!result.user) throw new Error("Account created, but no session was returned.");
                setAuthUser(result.user);
                toast.success("Account created. Welcome!");
                navigate({ to: "/app/dashboard" });
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to create account.");
              } finally {
                setLoading(false);
              }
            }}
          >
            <Field label="Full name" id="name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Work email" id="email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Password" id="pwd" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
            <Field label="Confirm password" id="cpwd" type="password" value={form.confirm} onChange={(v) => setForm({ ...form, confirm: v })} />
            <Button type="submit" disabled={loading} className="h-11 w-full bg-brand-gradient font-bold text-white hover:opacity-95">
              {loading ? "Creating..." : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-xs text-muted-foreground">
            Already have an account? <Link to="/login" className="text-foreground hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
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
