import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  workspaceApi,
  type GoalCycleSettings,
  type CycleWindow,
} from "@/intragoals/workspace/workspace-api";

export const Route = createFileRoute("/app/admin/cycles")({
  component: CyclesPage,
});

function CyclesPage() {
  const [settings, setSettings] = useState<GoalCycleSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    void workspaceApi
      .loadGoalCycleSettings()
      .then((data) => {
        if (mounted) setSettings(data);
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Unable to load cycle settings."),
      );
    return () => {
      mounted = false;
    };
  }, []);

  const activeWindow = useMemo(
    () =>
      settings?.windows.find((window) => window.status === "Active") ??
      settings?.windows[0] ??
      null,
    [settings],
  );

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const next = await workspaceApi.saveGoalCycleSettings(settings);
      setSettings(next);
      toast.success("Cycle settings saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save cycle settings.");
    } finally {
      setSaving(false);
    }
  };

  const updateWindow = (id: string, patch: Partial<CycleWindow>) => {
    if (!settings) return;
    setSettings({
      ...settings,
      windows: settings.windows.map((window) =>
        window.id === id ? { ...window, ...patch } : window,
      ),
    });
  };

  const setActive = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      windows: settings.windows.map((window) => ({
        ...window,
        status:
          window.id === id ? "Active" : window.status === "Active" ? "Upcoming" : window.status,
      })),
    });
  };

  if (!settings) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Loading cycle settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Cycle management</h1>
          <div className="text-sm text-muted-foreground">
            Keep the FY calendar accessible, explicit, and easy to update for admins and employees.
          </div>
        </div>
        <Button
          onClick={() => void save()}
          disabled={saving}
          className="bg-brand-gradient text-background hover:opacity-90"
        >
          {saving ? "Saving..." : "Save cycle"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <CycleCard
          icon={CalendarDays}
          label="Cycle"
          value={`${settings.name} � ${settings.year}`}
          hint="Single source of truth for goal windows"
        />
        <CycleCard
          icon={Clock3}
          label="Active window"
          value={activeWindow?.name ?? "None"}
          hint={activeWindow?.detail ?? "No active phase"}
        />
        <CycleCard
          icon={CheckCircle2}
          label="Published windows"
          value={settings.windows.length}
          hint={`${settings.windows.filter((window) => window.status === "Closed").length} already completed`}
        />
      </div>

      <section className="rounded-2xl glass p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <Field
            label="Cycle name"
            value={settings.name}
            onChange={(value) => setSettings({ ...settings, name: value })}
          />
          <Field
            label="Fiscal year"
            type="number"
            value={String(settings.year)}
            onChange={(value) => setSettings({ ...settings, year: Number(value) || settings.year })}
          />
          <Field
            label="Opens on"
            type="date"
            value={toDateInput(settings.opensAt)}
            onChange={(value) => setSettings({ ...settings, opensAt: value })}
          />
          <Field
            label="Closes on"
            type="date"
            value={toDateInput(settings.closesAt)}
            onChange={(value) => setSettings({ ...settings, closesAt: value })}
          />
        </div>
      </section>

      <section className="rounded-2xl glass p-5">
        <div>
          <div className="text-sm font-medium">Quarter windows</div>
          <div className="text-xs text-muted-foreground">
            Every row has explicit dates and status so the page reads clearly with screen readers
            and quick scans.
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {settings.windows.map((window) => (
            <div key={window.id} className="rounded-xl border border-border bg-background/60 p-4">
              <div className="grid gap-4 md:grid-cols-[1.3fr,1fr,1fr,180px,120px] md:items-end">
                <div className="space-y-1.5">
                  <Label>{window.name}</Label>
                  <Input
                    value={window.detail ?? ""}
                    onChange={(event) => updateWindow(window.id, { detail: event.target.value })}
                    placeholder="What should people do in this window?"
                  />
                </div>
                <Field
                  label="Start date"
                  type="date"
                  value={window.start}
                  onChange={(value) => updateWindow(window.id, { start: value })}
                />
                <Field
                  label="End date"
                  type="date"
                  value={window.end}
                  onChange={(value) => updateWindow(window.id, { end: value })}
                />
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={window.status}
                    onValueChange={(value: CycleWindow["status"]) =>
                      updateWindow(window.id, { status: value })
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Closed">Closed</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Upcoming">Upcoming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-border"
                  onClick={() => setActive(window.id)}
                >
                  Set active
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CycleCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/60 text-[color:var(--brand-purple)]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}
