import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp, scoreForGoal } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ProgressRing, StatusBadge } from "@/components/common/Bits";
import { Plus, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export const Route = createFileRoute("/app/goals/")({
  component: GoalsList,
});

function GoalsList() {
  const user = useApp((s) => s.user);
  const goals = useApp((s) => s.goals).filter((g) => g.ownerId === user?.id);
  const [q, setQ] = useState("");
  const filtered = goals.filter((g) => g.title.toLowerCase().includes(q.toLowerCase()) || g.thrustArea.toLowerCase().includes(q.toLowerCase()));

  const totalWeight = goals.reduce((a, g) => a + g.weightage, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">My Goals</h1>
          <div className="text-sm text-muted-foreground">{goals.length} of 8 goals · {totalWeight}% total weightage</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9 w-64 bg-secondary/50 border-border" placeholder="Search goals…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button asChild className="bg-brand-gradient text-background hover:opacity-90"><Link to="/app/goals/new"><Plus className="mr-1.5 h-4 w-4" /> New goal sheet</Link></Button>
        </div>
      </div>

      {totalWeight !== 100 && (
        <div className="rounded-xl border border-[color:var(--brand-orange)]/40 bg-[color:var(--brand-orange)]/10 p-3 text-sm text-[color:var(--brand-orange)]">
          Total weightage is {totalWeight}%. It must equal 100% before you can submit for approval.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((g) => (
          <Link key={g.id} to="/app/goals/$id" params={{ id: g.id }} className="group block">
            <div className="rounded-2xl glass p-5 transition group-hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{g.thrustArea}</div>
                  <div className="mt-0.5 text-base font-medium leading-snug">{g.title}</div>
                </div>
                <StatusBadge status={g.status} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{g.description}</p>
              <div className="mt-4 flex items-center gap-4">
                <ProgressRing value={scoreForGoal(g)} size={56} stroke={6} label="Score" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>UoM: <span className="text-foreground">{g.uom}</span></div>
                  <div>Target: <span className="text-foreground">{g.target}</span></div>
                  <div>Weightage: <span className="text-foreground">{g.weightage}%</span></div>
                </div>
              </div>
            </div>
          </Link>
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
