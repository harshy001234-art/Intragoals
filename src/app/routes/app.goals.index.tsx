import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp, scoreForGoal } from "@/intragoals/workspace/store";
import { Button } from "@/components/ui/button";
import { ProgressRing, StatusBadge } from "@/components/shared/goal-primitives";
import { Filter, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { workspaceApi } from "@/intragoals/workspace/workspace-api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/goals/")({
  component: GoalsList,
});

function GoalsList() {
  const user = useApp((s) => s.user);
  const authSource = useApp((s) => s.authSource);
  const allGoals = useApp((s) => s.goals);
  const removeGoal = useApp((s) => s.removeGoal);
  const pushAudit = useApp((s) => s.pushAudit);
  const [q, setQ] = useState("");
  const isAdmin = user?.role === "admin";
  const goals = useMemo(
    () =>
      (Array.isArray(allGoals) ? allGoals : []).filter(
        (goal) => goal && (isAdmin ? true : goal.ownerId === user?.id),
      ),
    [allGoals, isAdmin, user?.id],
  );
  const filtered = useMemo(
    () =>
      goals.filter(
        (goal) =>
          String(goal.title ?? "")
            .toLowerCase()
            .includes(q.toLowerCase()) ||
          String(goal.thrustArea ?? "")
            .toLowerCase()
            .includes(q.toLowerCase()),
      ),
    [goals, q],
  );

  const totalWeight = goals.reduce((sum, goal) => sum + Number(goal.weightage ?? 0), 0);

  const handleDelete = async (goalId: string, goalTitle: string) => {
    if (!user || !isAdmin) return;
    if (!window.confirm(`Delete "${goalTitle}"?`)) return;

    const auditEntry = {
      userId: user.id,
      userName: user.name,
      action: "Deleted goal",
      entityType: "Goal",
      entityId: goalId,
      previousValue: goalTitle,
      newValue: "Soft deleted",
    };

    try {
      if (authSource === "account") {
        await workspaceApi.softDeleteGoal(goalId);
        await workspaceApi.createAudit(auditEntry);
      }
      removeGoal(goalId);
      pushAudit(auditEntry);
      toast.success("Goal deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete goal.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{isAdmin ? "Workspace Goals" : "My Goals"}</h1>
          <div className="text-sm text-muted-foreground">
            {goals.length} of 8 goals | {totalWeight}% total weightage
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="w-64 border-border bg-secondary/50 pl-9"
              placeholder="Search goals..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button asChild className="bg-brand-gradient text-background hover:opacity-90">
            <Link to="/app/goals/new">
              <Plus className="mr-1.5 h-4 w-4" /> New goal sheet
            </Link>
          </Button>
        </div>
      </div>

      {totalWeight !== 100 && !isAdmin && (
        <div className="rounded-xl border border-[color:var(--brand-orange)]/40 bg-[color:var(--brand-orange)]/10 p-3 text-sm text-[color:var(--brand-orange)]">
          Total weightage is {totalWeight}%. It must equal 100% before you can submit for approval.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((goal) => (
          <div
            key={goal.id}
            className="rounded-2xl glass p-5 transition group-hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <Link to="/app/goals/$id" params={{ id: goal.id }} className="min-w-0 flex-1">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">
                    {goal.thrustArea || "General"}
                  </div>
                  <div className="mt-0.5 text-base font-medium leading-snug">
                    {goal.title || "Untitled goal"}
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <StatusBadge status={goal.status} />
                {isAdmin && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => void handleDelete(goal.id, goal.title)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <Link to="/app/goals/$id" params={{ id: goal.id }} className="block">
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {goal.description || ""}
              </p>
              <div className="mt-4 flex items-center gap-4">
                <ProgressRing value={scoreForGoal(goal)} size={56} stroke={6} label="Score" />
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>
                    UoM: <span className="text-foreground">{goal.uom || "Numeric"}</span>
                  </div>
                  <div>
                    Target: <span className="text-foreground">{goal.target ?? 0}</span>
                  </div>
                  <div>
                    Weightage:{" "}
                    <span className="text-foreground">{Number(goal.weightage ?? 0)}%</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="md:col-span-2 rounded-2xl border border-dashed border-border p-10 text-center">
            <div className="text-sm">No goals match your search.</div>
          </div>
        )}
      </div>
    </div>
  );
}
