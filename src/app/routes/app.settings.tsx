import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BellRing, Link2, Send, ShieldCheck, UserRound } from "lucide-react";
import { useApp } from "@/intragoals/workspace/store";
import { workspaceApi, type NotificationSettings } from "@/intragoals/workspace/workspace-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const user = useApp((s) => s.user)!;
  const authSource = useApp((s) => s.authSource);
  const upsertUser = useApp((s) => s.upsertUser);
  const addNotification = useApp((s) => s.addNotification);
  const setWorkspaceData = useApp((s) => s.setWorkspaceData);
  const [profile, setProfile] = useState({
    fullName: user.name,
    email: user.email,
    title: user.title,
    department: user.department,
  });
  const [delivery, setDelivery] = useState<NotificationSettings>({
    inApp: true,
    email: true,
    teams: false,
    teamsWebhookUrl: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfile({
      fullName: user.name,
      email: user.email,
      title: user.title,
      department: user.department,
    });
  }, [user]);

  useEffect(() => {
    if (authSource !== "account") return;
    void workspaceApi
      .loadNotificationSettings()
      .then((data) => setDelivery(data))
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : "Unable to load notification settings.",
        ),
      );
  }, [authSource]);

  const save = async () => {
    setSaving(true);
    const nextUser = {
      ...user,
      name: profile.fullName.trim() || user.name,
      title: profile.title.trim() || user.title,
      department: profile.department.trim() || user.department,
    };
    upsertUser(nextUser);
    try {
      if (authSource === "account") {
        await workspaceApi.updateProfile(user.id, {
          fullName: nextUser.name,
          title: nextUser.title,
          department: nextUser.department,
        });
        await workspaceApi.saveNotificationSettings(delivery);
        const workspace = await workspaceApi.loadWorkspace();
        if (workspace) setWorkspaceData(workspace);
      }
      toast.success("Settings saved.");
    } catch (error) {
      upsertUser(user);
      toast.error(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (delivery.teams && !delivery.teamsWebhookUrl.trim()) {
      return toast.error("Add a Microsoft Teams webhook URL before testing that channel.");
    }

    const notification = {
      id: `n-${Math.random().toString(36).slice(2, 9)}`,
      userId: user.id,
      title: "Notification channels test",
      body: "In-app delivery is working. Email and Teams preferences are saved for this workspace.",
      type: "success" as const,
      read: false,
      createdAt: new Date().toISOString(),
    };
    addNotification(notification);
    try {
      if (authSource === "account") {
        await workspaceApi.createNotification({
          userId: user.id,
          title: notification.title,
          body: notification.body,
          type: notification.type,
          deepLink: "/app/notifications",
        });
        const workspace = await workspaceApi.loadWorkspace();
        if (workspace) setWorkspaceData(workspace);
      }
      toast.success("Test notification sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send test notification.");
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <div className="text-sm text-muted-foreground">
          Profile, notifications, and direct delivery integrations
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={UserRound}
          label="Role"
          value={
            user.role === "admin"
              ? "Admin workspace"
              : user.role === "manager"
                ? "Manager workspace"
                : "Employee workspace"
          }
          hint="Your current access level in this workspace"
        />
        <SummaryCard
          icon={BellRing}
          label="Delivery"
          value={delivery.inApp ? "In-app on" : "In-app off"}
          hint={delivery.email ? "Email delivery enabled" : "Email delivery disabled"}
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Profile status"
          value="Ready"
          hint="Profile and routing preferences are available"
        />
      </section>

      <section className="rounded-2xl glass space-y-4 p-5">
        <div className="text-sm font-medium">Profile</div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field
            label="Full name"
            value={profile.fullName}
            onChange={(value) => setProfile({ ...profile, fullName: value })}
          />
          <Field label="Email" value={profile.email} readOnly />
          <Field
            label="Title"
            value={profile.title}
            onChange={(value) => setProfile({ ...profile, title: value })}
          />
          <Field
            label="Department"
            value={profile.department}
            onChange={(value) => setProfile({ ...profile, department: value })}
          />
        </div>
      </section>

      <section className="rounded-2xl glass space-y-4 p-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <BellRing className="h-4 w-4 text-[color:var(--brand-purple)]" />
          Notifications
        </div>
        <PreferenceRow
          label="In-app notifications"
          description="Keep approval requests, shared KPIs, and escalations inside Intragoals."
          checked={delivery.inApp}
          onCheckedChange={(checked) => setDelivery({ ...delivery, inApp: checked })}
        />
        <PreferenceRow
          label="Email delivery"
          description="Send the same workflow alerts by email from the workspace delivery layer."
          checked={delivery.email}
          onCheckedChange={(checked) => setDelivery({ ...delivery, email: checked })}
        />
        <PreferenceRow
          label="Microsoft Teams webhook"
          description="Post workflow alerts to a Teams incoming webhook directly."
          checked={delivery.teams}
          onCheckedChange={(checked) => setDelivery({ ...delivery, teams: checked })}
        />
        {delivery.teams ? (
          <div className="space-y-1.5 rounded-xl border border-border bg-background/60 p-4">
            <Label>Teams webhook URL</Label>
            <Input
              value={delivery.teamsWebhookUrl}
              onChange={(event) =>
                setDelivery({ ...delivery, teamsWebhookUrl: event.target.value })
              }
              placeholder="https://outlook.office.com/webhook/..."
            />
          </div>
        ) : null}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-border"
            onClick={() => void sendTest()}
          >
            <Send className="mr-1.5 h-4 w-4" />
            Send test notification
          </Button>
        </div>
      </section>

      <section className="rounded-2xl glass space-y-4 p-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="h-4 w-4 text-[color:var(--brand-purple)]" />
          Quick links
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <QuickLink
            to="/app/notifications"
            title="Notification inbox"
            description="Open alerts, approvals, shared KPIs, and escalation messages."
          />
          <QuickLink
            to={
              user.role === "employee"
                ? "/app/shared"
                : user.role === "manager"
                  ? "/app/manager-shared-kpis"
                  : "/app/admin/shared-kpis"
            }
            title={user.role === "employee" ? "Shared goals" : "Shared KPI workspace"}
            description={
              user.role === "employee"
                ? "Review the KPIs assigned to your goal sheet."
                : "Publish and track shared KPIs from your workspace."
            }
          />
        </div>
      </section>

      <Button
        onClick={() => void save()}
        disabled={saving}
        className="bg-brand-gradient text-background hover:opacity-90"
      >
        {saving ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl glass p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-4 w-4 text-[color:var(--brand-purple)]" />
        {label}
      </div>
      <div className="mt-3 text-base font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function QuickLink({ to, title, description }: { to: string; title: string; description: string }) {
  return (
    <Link
      to={to}
      className="block rounded-xl border border-border bg-background/60 p-4 transition-colors hover:bg-secondary/40"
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
    </Link>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </div>
  );
}

function PreferenceRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-background/60 px-4 py-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
