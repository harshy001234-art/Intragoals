import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const user = useApp((s) => s.user)!;
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <div className="text-sm text-muted-foreground">Profile, notifications, and integrations</div>
      </div>

      <section className="rounded-2xl glass p-5 space-y-3">
        <div className="text-sm font-medium">Profile</div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Full name" value={user.name} />
          <Field label="Email" value={user.email} />
          <Field label="Title" value={user.title} />
          <Field label="Department" value={user.department} />
        </div>
      </section>

      <section className="rounded-2xl glass p-5 space-y-3">
        <div className="text-sm font-medium">Notifications</div>
        {[
          ["In-app notifications", true],
          ["Email via n8n webhook", true],
          ["Microsoft Teams webhook", false],
        ].map(([l, d]) => (
          <div key={String(l)} className="flex items-center justify-between border-t border-border first:border-0 pt-3 first:pt-0">
            <div className="text-sm">{l as string}</div>
            <Switch defaultChecked={Boolean(d)} />
          </div>
        ))}
      </section>

      <Button onClick={() => toast.success("Settings saved.")} className="bg-brand-gradient text-background hover:opacity-90">Save changes</Button>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input defaultValue={value} />
    </div>
  );
}
