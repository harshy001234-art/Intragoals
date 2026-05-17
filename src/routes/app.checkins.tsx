import { createFileRoute } from "@tanstack/react-router";
import { useApp, scoreForGoal, type Quarter, type CheckinStatus } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgressRing } from "@/components/common/Bits";
import { toast } from "sonner";
import { workspaceApi } from "@/lib/workspace-api";

export const Route = createFileRoute("/app/checkins")({
  component: CheckinsPage,
});

const QUARTERS: { q: Quarter; window: string }[] = [
  { q: "Q1", window: "July 1 – July 21" },
  { q: "Q2", window: "October 1 – October 21" },
  { q: "Q3", window: "January 1 – January 21" },
  { q: "Q4", window: "March 15 – April 15 (Annual)" },
];

function CheckinsPage() {
  const user = useApp((s) => s.user)!;
  const authSource = useApp((s) => s.authSource);
  const goals = useApp((s) => s.goals).filter((g) => g.ownerId === user.id && (g.status === "Approved" || g.status === "Locked"));
  const updateQuarter = useApp((s) => s.updateQuarter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Quarterly check-ins</h1>
        <div className="text-sm text-muted-foreground">FY26 cycle · update planned vs actual for each approved goal</div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {QUARTERS.map((q) => (
          <div key={q.q} className="rounded-2xl glass p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{q.q}</div>
            <div className="mt-1 text-sm font-medium">{q.window}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {goals.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            You have no approved goals yet. Submit your goal sheet to start quarterly check-ins.
          </div>
        )}
        {goals.map((g) => (
          <div key={g.id} className="rounded-2xl glass p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{g.thrustArea}</div>
                <div className="text-base font-medium">{g.title}</div>
              </div>
              <ProgressRing value={scoreForGoal(g)} size={48} stroke={6} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {g.quarterly.map((u) => (
                <div key={u.quarter} className="rounded-xl border border-border bg-secondary/40 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium">{u.quarter}</div>
                  </div>
                  <Input
                    type="number"
                    className="mt-2"
                    placeholder="Actual"
                    value={u.achievement ?? ""}
                    onChange={(e) => updateQuarter(g.id, u.quarter, { achievement: e.target.value === "" ? null : Number(e.target.value) })}
                  />
                  <Select value={u.status} onValueChange={(v: CheckinStatus) => updateQuarter(g.id, u.quarter, { status: v })}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["Not Started","On Track","Completed"] as CheckinStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Textarea rows={2} className="mt-2" placeholder="Comment" value={u.comment} onChange={(e) => updateQuarter(g.id, u.quarter, { comment: e.target.value })} />
                  <Button
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => {
                      const submittedAt = new Date().toISOString();
                      const next = { ...u, submittedAt };
                      updateQuarter(g.id, u.quarter, next);
                      if (authSource === "account") {
                        void workspaceApi
                          .updateQuarter(g.id, u.quarter, next)
                          .then(() => toast.success(`${u.quarter} update saved.`))
                          .catch((error) => toast.error(error instanceof Error ? error.message : "Unable to sync check-in."));
                      } else {
                        toast.success(`${u.quarter} update saved.`);
                      }
                    }}
                  >
                    Save {u.quarter}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
