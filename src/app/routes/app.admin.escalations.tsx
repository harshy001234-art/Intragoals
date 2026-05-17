import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCheck, Play, Siren, Workflow } from "lucide-react";
import {
  useApp,
  userById,
  type Escalation,
  type Goal,
  type User,
} from "@/intragoals/workspace/store";
import { workspaceApi, type EscalationRuleSetting } from "@/intragoals/workspace/workspace-api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/app/admin/escalations")({
  component: EscalationsPage,
});

type ScanResult = {
  count: number;
  summary: string;
};

function EscalationsPage() {
  const currentUser = useApp((s) => s.user)!;
  const authSource = useApp((s) => s.authSource);
  const people = useApp((s) => s.people);
  const goals = useApp((s) => s.goals);
  const escalations = useApp((s) => s.escalations);
  const addEscalations = useApp((s) => s.addEscalations);
  const resolveEscalation = useApp((s) => s.resolveEscalation);
  const addNotification = useApp((s) => s.addNotification);
  const pushAudit = useApp((s) => s.pushAudit);
  const setWorkspaceData = useApp((s) => s.setWorkspaceData);
  const [rules, setRules] = useState<EscalationRuleSetting[]>([]);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);

  useEffect(() => {
    let mounted = true;
    void workspaceApi
      .loadEscalationRules()
      .then((data) => {
        if (mounted) setRules(data);
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Unable to load escalation rules."),
      );
    return () => {
      mounted = false;
    };
  }, []);

  const openEscalations = useMemo(
    () => escalations.filter((item) => !item.resolved),
    [escalations],
  );

  const saveRules = async () => {
    setSaving(true);
    try {
      const next = await workspaceApi.saveEscalationRules(rules);
      setRules(next);
      toast.success("Escalation rules saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save escalation rules.");
    } finally {
      setSaving(false);
    }
  };

  const runScan = async () => {
    setRunning(true);
    try {
      const existingKeys = new Set(openEscalations.map((item) => `${item.ownerId}:${item.reason}`));
      const nextEvents = rules
        .filter((rule) => rule.enabled)
        .flatMap((rule) => evaluateRule(rule, people, goals))
        .filter((item) => !existingKeys.has(`${item.ownerId}:${item.reason}`));

      if (!nextEvents.length) {
        const summary =
          "Scan completed. No overdue goals, approvals, or check-ins matched the current thresholds.";
        setLastScan({ count: 0, summary });
        toast.success("No new escalations found.");
        return;
      }

      const created: Escalation[] = [];
      for (const item of nextEvents) {
        const event: Escalation = {
          id:
            authSource === "account" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `e-${Math.random().toString(36).slice(2, 9)}`,
          reason: item.reason,
          level: toDisplayLevel(item.level),
          triggeredAt: new Date().toISOString(),
          ownerId: item.ownerId,
          resolved: false,
        };
        created.push(event);
        addNotification({
          id: `n-${Math.random().toString(36).slice(2, 9)}`,
          userId: item.ownerId,
          title: "Escalation triggered",
          body: item.reason,
          type: "warning",
          read: false,
          deepLink: "/app/admin/escalations",
          createdAt: new Date().toISOString(),
        });
        pushAudit({
          userId: currentUser.id,
          userName: currentUser.name,
          action: "Triggered escalation",
          entityType: "Escalation",
          entityId: event.id,
          newValue: item.reason,
        });

        if (authSource === "account") {
          const saved = await workspaceApi.createEscalationEvent({
            ruleId: item.ruleId ?? null,
            ownerId: item.ownerId,
            goalId: item.goalId ?? null,
            reason: item.reason,
            level: item.level,
          });
          if (saved) created[created.length - 1] = saved;
          await workspaceApi.createNotification({
            userId: item.ownerId,
            title: "Escalation triggered",
            body: item.reason,
            type: "warning",
            deepLink: "/app/admin/escalations",
          });
        }
      }

      addEscalations(created);
      if (authSource === "account") {
        const workspace = await workspaceApi.loadWorkspace();
        if (workspace) setWorkspaceData(workspace);
      }
      const summary = `${created.length} escalation(s) triggered and logged successfully.`;
      setLastScan({ count: created.length, summary });
      toast.success(summary);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to run escalation scan.");
    } finally {
      setRunning(false);
    }
  };

  const markResolved = async (id: string) => {
    resolveEscalation(id);
    try {
      if (authSource === "account") {
        await workspaceApi.resolveEscalationEvent(id);
        const workspace = await workspaceApi.loadWorkspace();
        if (workspace) setWorkspaceData(workspace);
      }
      toast.success("Escalation resolved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to resolve escalation.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Escalation rules</h1>
          <div className="text-sm text-muted-foreground">
            Run escalations directly inside Intragoals with built-in rules and logs.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-border"
            onClick={() => void saveRules()}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save rules"}
          </Button>
          <Button
            onClick={() => void runScan()}
            disabled={running}
            className="bg-brand-gradient text-background hover:opacity-90"
          >
            <Play className="mr-1.5 h-4 w-4" />
            {running ? "Running..." : "Run escalation scan"}
          </Button>
        </div>
      </div>

      {lastScan ? (
        <div className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm">
          <div className="font-medium">Latest scan</div>
          <div className="mt-1 text-muted-foreground">{lastScan.summary}</div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={Siren}
          label="Open escalations"
          value={openEscalations.length}
          hint="Currently unresolved"
        />
        <MetricCard
          icon={Workflow}
          label="Active rules"
          value={rules.filter((rule) => rule.enabled).length}
          hint="Enabled for internal scans"
        />
        <MetricCard
          icon={CheckCheck}
          label="Resolved"
          value={escalations.filter((item) => item.resolved).length}
          hint="Closed after action"
        />
      </div>

      <section className="grid gap-3 md:grid-cols-2">
        {rules.map((rule) => (
          <div key={rule.name} className="rounded-2xl glass p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Trigger
                </div>
                <div className="mt-1 text-base font-medium">{rule.name}</div>
              </div>
              <Switch
                checked={rule.enabled}
                onCheckedChange={(checked) =>
                  setRules((current) =>
                    current.map((item) =>
                      item.name === rule.name ? { ...item, enabled: checked } : item,
                    ),
                  )
                }
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Threshold
                </div>
                <Input
                  type="number"
                  className="mt-2 h-9"
                  value={rule.thresholdDays}
                  onChange={(event) =>
                    setRules((current) =>
                      current.map((item) =>
                        item.name === rule.name
                          ? {
                              ...item,
                              thresholdDays: Number(event.target.value) || item.thresholdDays,
                            }
                          : item,
                      ),
                    )
                  }
                />
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Chain
                </div>
                <div className="mt-2 text-sm">{rule.chain.join(" -> ")}</div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Active escalation logs</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {escalations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No escalations yet. Run the scan to check overdue work.
            </div>
          ) : (
            escalations.map((item) => (
              <div key={item.id} className="rounded-2xl glass p-5">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[color:var(--brand-orange)]">{item.level}</span>
                  <span className="text-muted-foreground">
                    {userById(item.ownerId)?.name ?? "Owner"}
                  </span>
                </div>
                <div className="mt-2 text-sm">{item.reason}</div>
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    className="border-border"
                    disabled={item.resolved}
                    onClick={() => void markResolved(item.id)}
                  >
                    {item.resolved ? "Resolved" : "Mark resolved"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function evaluateRule(
  rule: EscalationRuleSetting,
  people: User[],
  goals: Goal[],
): Array<{
  ruleId?: string;
  ownerId: string;
  goalId?: string;
  reason: string;
  level: "employee" | "manager" | "skip_level" | "hr_admin";
}> {
  const now = Date.now();
  const level = (rule.chain[rule.chain.length - 1] ?? "manager") as
    | "employee"
    | "manager"
    | "skip_level"
    | "hr_admin";
  const ageInDays = (value: string) =>
    Math.max(0, Math.floor((now - new Date(value).getTime()) / (1000 * 60 * 60 * 24)));

  if (rule.triggerType === "goal_submission_overdue") {
    return people
      .filter((person) => person.role === "employee")
      .filter(
        (person) => !goals.some((goal) => goal.ownerId === person.id && goal.status !== "Draft"),
      )
      .map((person) => ({
        ruleId: rule.id,
        ownerId: person.id,
        reason: `${person.name} has not submitted goals within ${rule.thresholdDays} days of cycle open.`,
        level,
      }));
  }

  if (rule.triggerType === "manager_approval_overdue") {
    return goals
      .filter(
        (goal) =>
          goal.status === "Pending Approval" && ageInDays(goal.updatedAt) >= rule.thresholdDays,
      )
      .map((goal) => ({
        ruleId: rule.id,
        ownerId: goal.ownerId,
        goalId: goal.id,
        reason: `${goal.title} is still waiting for manager approval after ${rule.thresholdDays} days.`,
        level,
      }));
  }

  if (rule.triggerType === "returned_goal_stale") {
    return goals
      .filter(
        (goal) => goal.status === "Returned" && ageInDays(goal.updatedAt) >= rule.thresholdDays,
      )
      .map((goal) => ({
        ruleId: rule.id,
        ownerId: goal.ownerId,
        goalId: goal.id,
        reason: `${goal.title} was returned and has not been resubmitted within ${rule.thresholdDays} days.`,
        level,
      }));
  }

  return goals
    .filter((goal) => goal.status === "Approved" || goal.status === "Locked")
    .filter((goal) =>
      goal.quarterly.some(
        (quarter) =>
          quarter.status === "Not Started" && ageInDays(goal.updatedAt) >= rule.thresholdDays,
      ),
    )
    .map((goal) => ({
      ruleId: rule.id,
      ownerId: goal.ownerId,
      goalId: goal.id,
      reason: `${goal.title} still has an incomplete quarterly check-in after ${rule.thresholdDays} days.`,
      level,
    }));
}

function toDisplayLevel(level: "employee" | "manager" | "skip_level" | "hr_admin") {
  if (level === "hr_admin") return "HR/Admin";
  if (level === "skip_level") return "Skip-level";
  return "L1 Manager";
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Siren;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/60 text-[color:var(--brand-orange)]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
