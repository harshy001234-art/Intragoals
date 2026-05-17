import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp, scoreForGoal, overallScore } from "@/lib/store";
import { KpiCard, ProgressRing, StatusBadge } from "@/components/common/Bits";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ArrowRight, CalendarCheck, Plus } from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const user = useApp((s) => s.user);
  const allGoals = useApp((s) => s.goals);
  const goals = allGoals.filter((g) => g.ownerId === user?.id);
  const overall = overallScore(goals);
  const completed = goals.filter((g) => scoreForGoal(g) >= 100).length;
  const pending = goals.filter((g) => g.status === "Pending Approval").length;
  const trend = ["Q1","Q2","Q3","Q4"].map((q, i) => {
    const planned = [25, 50, 75, 100][i];
    const actuals = goals.flatMap((g) => g.quarterly).filter((x) => x.quarter === q && x.achievement !== null);
    const actual = actuals.length ? Math.round(actuals.reduce((a, b) => a + ((b.achievement as number) / 1), 0) / actuals.length) : null;
    return { name: q, planned, actual };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Welcome back</div>
          <h1 className="text-2xl font-semibold">{user?.name?.split(" ")[0]}, here's your FY26 progress</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-border"><Link to="/app/checkins"><CalendarCheck className="mr-1.5 h-4 w-4" /> Check-ins</Link></Button>
          <Button asChild className="bg-brand-gradient text-background hover:opacity-90"><Link to="/app/goals/new"><Plus className="mr-1.5 h-4 w-4" /> New goal sheet</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Overall Progress" value={`${overall}%`} hint="Weighted across approved goals" accent="blue" />
        <KpiCard label="Goals" value={`${goals.length} / 8`} hint={`${pending} pending approval`} accent="purple" />
        <KpiCard label="Completed" value={completed} hint="Reached 100% score" accent="green" />
        <KpiCard label="Next Check-in" value="Q3 · Jul" hint="Window opens July 1" accent="orange" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl glass p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Quarterly progress</div>
              <div className="text-xs text-muted-foreground">Planned vs Actual achievement</div>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(148,163,184,0.6)" fontSize={12} />
                <YAxis stroke="rgba(148,163,184,0.6)" fontSize={12} />
                <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="planned" stroke="#8438ff" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="actual" stroke="#00d8ff" strokeWidth={2} dot={{ r: 3, fill: "#00d8ff" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl glass p-5">
          <div className="text-sm font-medium">Score breakdown</div>
          <div className="mt-3 flex items-center gap-5">
            <ProgressRing value={overall} size={120} stroke={10} label="Overall" />
            <div className="space-y-2 text-xs">
              {goals.slice(0, 4).map((g) => (
                <div key={g.id} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-gradient" />
                  <span className="truncate max-w-[160px]">{g.title}</span>
                  <span className="ml-auto text-muted-foreground">{scoreForGoal(g)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl glass p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">My goals</div>
            <Link to="/app/goals" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="mt-4 space-y-2">
            {goals.length === 0 && <EmptyHint />}
            {goals.map((g) => (
              <Link key={g.id} to="/app/goals/$id" params={{ id: g.id }} className="block">
                <div className="flex items-center gap-4 rounded-xl border border-border bg-secondary/40 p-3 hover:bg-secondary/60">
                  <ProgressRing value={scoreForGoal(g)} size={44} stroke={5} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{g.title}</div>
                    <div className="text-xs text-muted-foreground">{g.thrustArea} · Target {g.target} · {g.weightage}% weight</div>
                  </div>
                  <StatusBadge status={g.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl glass p-5">
          <div className="text-sm font-medium">Manager feedback</div>
          <div className="mt-3 space-y-3 text-sm">
            {goals.filter(g => g.managerComment).slice(0, 3).map(g => (
              <div key={g.id} className="rounded-lg border border-border bg-secondary/40 p-3">
                <div className="text-xs text-muted-foreground">on {g.title}</div>
                <div className="mt-1">{g.managerComment}</div>
              </div>
            ))}
            {goals.filter(g => g.managerComment).length === 0 && (
              <div className="text-xs text-muted-foreground">No feedback yet. Manager comments will appear here after reviews.</div>
            )}
          </div>
          <div className="mt-5 text-sm font-medium">Recent activity</div>
          <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
            <li>· Q2 check-in submitted on <span className="text-foreground">Reduce P95 latency</span></li>
            <li>· Manager approved <span className="text-foreground">Mentor 3 juniors</span></li>
            <li>· Shared KPI received from HR</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center">
      <div className="text-sm">You haven't created any goals yet.</div>
      <Button asChild className="mt-3 bg-brand-gradient text-background hover:opacity-90"><Link to="/app/goals/new">Create your goal sheet</Link></Button>
    </div>
  );
}
