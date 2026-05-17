import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useApp, scoreForGoal, quarterScore, type Quarter, type CheckinStatus } from "@/lib/store";
import { ProgressRing, StatusBadge } from "@/components/common/Bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/goals/$id")({
  component: GoalDetail,
});

function GoalDetail() {
  const { id } = useParams({ from: "/app/goals/$id" });
  const goal = useApp((s) => s.goals.find((g) => g.id === id));
  const updateQuarter = useApp((s) => s.updateQuarter);
  const user = useApp((s) => s.user)!;
  const pushAudit = useApp((s) => s.pushAudit);

  if (!goal) {
    return (
      <div className="rounded-2xl glass p-8 text-center">
        <div>This goal could not be found.</div>
        <Button asChild variant="outline" className="mt-3 border-border"><Link to="/app/goals">Back to goals</Link></Button>
      </div>
    );
  }

  const editable = goal.status !== "Approved" && goal.status !== "Locked";

  return (
    <div className="space-y-6">
      <Link to="/app/goals" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to goals
      </Link>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl glass p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">{goal.thrustArea}</div>
              <h1 className="mt-1 text-2xl font-semibold">{goal.title}</h1>
            </div>
            <StatusBadge status={goal.status} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{goal.description}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <Meta label="UoM" value={goal.uom} />
            <Meta label="Direction" value={goal.direction} />
            <Meta label="Target" value={String(goal.target)} />
            <Meta label="Weightage" value={`${goal.weightage}%`} />
          </div>
          {goal.managerComment && (
            <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-3 text-sm">
              <div className="text-xs text-muted-foreground">Manager comment</div>
              <div className="mt-1">{goal.managerComment}</div>
            </div>
          )}
        </div>
        <div className="rounded-2xl glass p-6 flex flex-col items-center justify-center">
          <ProgressRing value={scoreForGoal(goal)} size={140} stroke={11} label="Score" />
          <div className="mt-3 text-xs text-muted-foreground">Weighted contribution: {Math.round(scoreForGoal(goal) * goal.weightage / 100)}%</div>
        </div>
      </div>

      <div className="rounded-2xl glass p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Quarterly check-ins</div>
            <div className="text-xs text-muted-foreground">Update achievement and status each quarter</div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {goal.quarterly.map((q) => (
            <div key={q.quarter} className="rounded-xl border border-border bg-secondary/40 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{q.quarter} update</div>
                <div className="text-xs text-muted-foreground">Score: {q.achievement !== null ? quarterScore(goal, q.achievement) : "—"}%</div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Actual achievement</label>
                  <Input
                    type="number"
                    value={q.achievement ?? ""}
                    disabled={!editable && goal.status === "Locked"}
                    onChange={(e) => updateQuarter(goal.id, q.quarter, { achievement: e.target.value === "" ? null : Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Status</label>
                  <Select value={q.status} onValueChange={(v: CheckinStatus) => updateQuarter(goal.id, q.quarter, { status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["Not Started","On Track","Completed"] as CheckinStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <label className="text-xs text-muted-foreground">Comment</label>
                <Textarea
                  rows={2}
                  value={q.comment}
                  onChange={(e) => updateQuarter(goal.id, q.quarter, { comment: e.target.value })}
                  placeholder="What progressed this quarter? Any blockers?"
                />
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    updateQuarter(goal.id, q.quarter, { submittedAt: new Date().toISOString() });
                    pushAudit({ userId: user.id, userName: user.name, action: `Submitted ${q.quarter} check-in`, entityType: "QuarterlyUpdate", entityId: `${goal.id}:${q.quarter}`, newValue: String(q.achievement ?? "") });
                    toast.success(`${q.quarter} check-in submitted.`);
                  }}
                >
                  <Save className="mr-1.5 h-4 w-4" /> Submit {q.quarter}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}
