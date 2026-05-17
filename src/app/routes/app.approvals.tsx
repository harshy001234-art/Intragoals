import { createFileRoute } from "@tanstack/react-router";
import { useApp, userById } from "@/intragoals/workspace/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/goal-primitives";
import { Check, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { workspaceApi } from "@/intragoals/workspace/workspace-api";

export const Route = createFileRoute("/app/approvals")({
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const user = useApp((s) => s.user)!;
  const authSource = useApp((s) => s.authSource);
  const people = useApp((s) => s.people);
  const goals = useApp((s) => s.goals);
  const setWorkspaceData = useApp((s) => s.setWorkspaceData);
  const setStatus = useApp((s) => s.setGoalStatus);
  const upsertGoal = useApp((s) => s.upsertGoal);
  const pushAudit = useApp((s) => s.pushAudit);
  const [comments, setComments] = useState<Record<string, string>>({});
  const managers = people.filter((person) => person.role === "manager");
  const visibleReportIds = new Set(
    people
      .filter((person) => {
        if (person.role !== "employee") return false;
        if (person.managerId === user.id) return true;
        return user.role === "manager" && managers.length >= 1 && !person.managerId;
      })
      .map((person) => person.id),
  );
  const pendingGoals = goals.filter(
    (goal) =>
      goal.status === "Pending Approval" &&
      (user.role === "admin" || visibleReportIds.has(goal.ownerId)),
  );

  const act = async (id: string, status: "Approved" | "Rejected" | "Returned") => {
    const goal = useApp.getState().goals.find((item) => item.id === id);
    if (!goal) return;
    setStatus(id, status, comments[id]);
    const auditEntry = {
      userId: user.id,
      userName: user.name,
      action: `${status} goal`,
      entityType: "Goal",
      entityId: id,
      previousValue: "Pending Approval",
      newValue: status,
    };
    pushAudit(auditEntry);
    try {
      if (authSource === "account") {
        await workspaceApi.setGoalStatus(id, status, comments[id]);
        await workspaceApi.createAudit(auditEntry);
        const workspace = await workspaceApi.loadWorkspace();
        if (workspace) setWorkspaceData(workspace);
      }
      toast.success(`Goal ${status.toLowerCase()}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sync approval.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Approval queue</h1>
        <div className="text-sm text-muted-foreground">
          {pendingGoals.length} goal(s) awaiting your review
        </div>
      </div>
      <div className="space-y-3">
        {pendingGoals.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            All caught up. No pending approvals.
          </div>
        )}
        {pendingGoals.map((g) => {
          const owner = userById(g.ownerId);
          return (
            <div key={g.id} className="rounded-2xl glass p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">
                    {owner?.name} � {g.thrustArea}
                  </div>
                  <div className="text-base font-medium">{g.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>
                </div>
                <StatusBadge status={g.status} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <Field label="UoM" value={g.uom} />
                <EditableNum
                  label="Target"
                  value={g.target}
                  onChange={(v) => {
                    const next = { ...g, target: v, updatedAt: new Date().toISOString() };
                    upsertGoal(next);
                    if (authSource === "account")
                      void workspaceApi
                        .saveGoal(next)
                        .catch((error) =>
                          toast.error(
                            error instanceof Error ? error.message : "Unable to sync goal.",
                          ),
                        );
                  }}
                />
                <EditableNum
                  label="Weightage (%)"
                  value={g.weightage}
                  onChange={(v) => {
                    const next = { ...g, weightage: v, updatedAt: new Date().toISOString() };
                    upsertGoal(next);
                    if (authSource === "account")
                      void workspaceApi
                        .saveGoal(next)
                        .catch((error) =>
                          toast.error(
                            error instanceof Error ? error.message : "Unable to sync goal.",
                          ),
                        );
                  }}
                />
                <Field label="Direction" value={g.direction} />
              </div>
              <div className="mt-3 space-y-1.5">
                <label className="text-xs text-muted-foreground">Approval comment</label>
                <Textarea
                  rows={2}
                  value={comments[g.id] ?? ""}
                  onChange={(e) => setComments({ ...comments, [g.id]: e.target.value })}
                />
              </div>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-border"
                  onClick={() => void act(g.id, "Returned")}
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" /> Return for rework
                </Button>
                <Button variant="destructive" onClick={() => void act(g.id, "Rejected")}>
                  <X className="mr-1.5 h-4 w-4" /> Reject
                </Button>
                <Button
                  className="bg-brand-gradient text-background hover:opacity-90"
                  onClick={() => void act(g.id, "Approved")}
                >
                  <Check className="mr-1.5 h-4 w-4" /> Approve
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}
function EditableNum({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <Input
        type="number"
        className="mt-1 h-8"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
