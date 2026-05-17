import { createFileRoute, Link } from "@tanstack/react-router";
import { KpiCard, ProgressRing, StatusBadge } from "@/components/shared/goal-primitives";
import { useApp, overallScore, scoreForGoal } from "@/intragoals/workspace/store";
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
  const people = useApp((s) => s.people);
  const notifications = useApp((s) => s.notifications);
  const isManager = user?.role === "manager";
  const managers = people.filter((person) => person.role === "manager");
  const teamMembers = people.filter((person) => {
    if (person.role !== "employee") return false;
    if (person.managerId === user?.id) return true;
    return isManager && managers.length >= 1 && !person.managerId;
  });
  const teamMemberIds = new Set(teamMembers.map((person) => person.id));
  const goals = isManager
    ? allGoals.filter((goal) => teamMemberIds.has(goal.ownerId))
    : allGoals.filter((goal) => goal.ownerId === user?.id);
  const overall = overallScore(goals);
  const completed = goals.filter((goal) => scoreForGoal(goal) >= 100).length;
  const pending = goals.filter((goal) => goal.status === "Pending Approval").length;
  const upcomingCheckins = goals.filter((goal) =>
    goal.quarterly.some(
      (quarter) => quarter.status === "Not Started" || quarter.status === "On Track",
    ),
  ).length;
  const unreadNotifications = notifications.filter(
    (notification) => !notification.read && notification.userId === user?.id,
  );
  const trend = ["Q1", "Q2", "Q3", "Q4"].map((quarter, index) => {
    const planned = [25, 50, 75, 100][index];
    const actuals = goals
      .flatMap((goal) => goal.quarterly)
      .filter((item) => item.quarter === quarter && item.achievement !== null);
    const actual = actuals.length
      ? Math.round(
          actuals.reduce((sum, item) => sum + (item.achievement as number), 0) / actuals.length,
        )
      : null;
    return { name: quarter, planned, actual };
  });

  const scoreBreakdown = isManager
    ? teamMembers.map((member) => ({
        id: member.id,
        label: member.name,
        value: `${overallScore(goals.filter((goal) => goal.ownerId === member.id))}%`,
      }))
    : goals.slice(0, 4).map((goal) => ({
        id: goal.id,
        label: goal.title,
        value: `${scoreForGoal(goal)}%`,
      }));

  const listGoals = isManager
    ? goals.filter((goal) => goal.status === "Pending Approval").slice(0, 6)
    : goals;

  const managerAlerts = unreadNotifications.slice(0, 3);
  const feedbackGoals = goals.filter((goal) => goal.managerComment).slice(0, 3);
  const recentActivity = isManager
    ? [
        `${pending} pending approvals across your team`,
        `${teamMembers.length} direct report(s) in this workspace`,
        `${upcomingCheckins} upcoming check-in(s) to review`,
      ]
    : [
        "Q2 check-in submitted on Reduce P95 latency",
        "Manager approved Mentor 3 juniors",
        "Shared KPI received from HR",
      ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Welcome back
          </div>
          <h1 className="text-2xl font-semibold">
            {user?.name?.split(" ")[0]},{" "}
            {isManager ? "here's your team view for FY26" : "here's your FY26 progress"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-border">
            <Link to={isManager ? "/app/approvals" : "/app/checkins"}>
              <CalendarCheck className="mr-1.5 h-4 w-4" /> {isManager ? "Approvals" : "Check-ins"}
            </Link>
          </Button>
          <Button asChild className="bg-brand-gradient text-background hover:opacity-90">
            <Link to={isManager ? "/app/team" : "/app/goals/new"}>
              <Plus className="mr-1.5 h-4 w-4" /> {isManager ? "Team view" : "New goal sheet"}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard
          label={isManager ? "Team Progress" : "Overall Progress"}
          value={`${overall}%`}
          hint={isManager ? "Weighted across team goals" : "Weighted across approved goals"}
          accent="blue"
        />
        <KpiCard
          label={isManager ? "Team Goals" : "Goals"}
          value={isManager ? `${goals.length}` : `${goals.length} / 8`}
          hint={isManager ? `${teamMembers.length} team member(s)` : `${pending} pending approval`}
          accent="purple"
        />
        <KpiCard
          label={isManager ? "Pending Approvals" : "Completed"}
          value={isManager ? pending : completed}
          hint={isManager ? "Awaiting your review" : "Reached 100% score"}
          accent="green"
        />
        <KpiCard
          label={isManager ? "Upcoming Check-ins" : "Next Check-in"}
          value={isManager ? `${upcomingCheckins}` : "Q3 � Jul"}
          hint={isManager ? `${unreadNotifications.length} unread alert(s)` : "Window opens July 1"}
          accent="orange"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl glass p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">
                {isManager ? "Team quarterly progress" : "Quarterly progress"}
              </div>
              <div className="text-xs text-muted-foreground">
                {isManager
                  ? "Planned vs Actual achievement across direct reports"
                  : "Planned vs Actual achievement"}
              </div>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(148,163,184,0.6)" fontSize={12} />
                <YAxis stroke="rgba(148,163,184,0.6)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#0F172A",
                    border: "1px solid rgba(148,163,184,0.2)",
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="planned"
                  stroke="#8438ff"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#00d8ff"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#00d8ff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl glass p-5">
          <div className="text-sm font-medium">Score breakdown</div>
          <div className="mt-3 flex items-center gap-5">
            <ProgressRing
              value={overall}
              size={120}
              stroke={10}
              label={isManager ? "Team" : "Overall"}
            />
            <div className="space-y-2 text-xs">
              {scoreBreakdown.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-gradient" />
                  <span className="truncate max-w-[160px]">{item.label}</span>
                  <span className="ml-auto text-muted-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl glass p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              {isManager ? "Pending approvals" : "My goals"}
            </div>
            <Link
              to={isManager ? "/app/approvals" : "/app/goals"}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {listGoals.length === 0 && <EmptyHint manager={isManager} />}
            {listGoals.map((goal) => (
              <Link key={goal.id} to="/app/goals/$id" params={{ id: goal.id }} className="block">
                <div className="flex items-center gap-4 rounded-xl border border-border bg-secondary/40 p-3 hover:bg-secondary/60">
                  <ProgressRing value={scoreForGoal(goal)} size={44} stroke={5} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{goal.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {isManager
                        ? `${people.find((person) => person.id === goal.ownerId)?.name ?? "Team member"} � ${goal.thrustArea} � Target ${goal.target}`
                        : `${goal.thrustArea} � Target ${goal.target} � ${goal.weightage}% weight`}
                    </div>
                  </div>
                  <StatusBadge status={goal.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl glass p-5">
          <div className="text-sm font-medium">
            {isManager ? "Team alerts" : "Manager feedback"}
          </div>
          <div className="mt-3 space-y-3 text-sm">
            {isManager
              ? managerAlerts.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-lg border border-border bg-secondary/40 p-3"
                  >
                    <div className="text-xs text-muted-foreground">{notification.title}</div>
                    <div className="mt-1">{notification.body}</div>
                  </div>
                ))
              : feedbackGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="rounded-lg border border-border bg-secondary/40 p-3"
                  >
                    <div className="text-xs text-muted-foreground">on {goal.title}</div>
                    <div className="mt-1">{goal.managerComment}</div>
                  </div>
                ))}
            {isManager && managerAlerts.length === 0 && (
              <div className="text-xs text-muted-foreground">
                No team alerts right now. New submissions and review reminders will appear here.
              </div>
            )}
            {!isManager && feedbackGoals.length === 0 && (
              <div className="text-xs text-muted-foreground">
                No feedback yet. Manager comments will appear here after reviews.
              </div>
            )}
          </div>
          <div className="mt-5 text-sm font-medium">Recent activity</div>
          <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
            {recentActivity.map((item) => (
              <li key={item}>� {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function EmptyHint({ manager = false }: { manager?: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center">
      <div className="text-sm">
        {manager
          ? "No team approvals are waiting right now."
          : "You haven't created any goals yet."}
      </div>
      <Button asChild className="mt-3 bg-brand-gradient text-background hover:opacity-90">
        <Link to={manager ? "/app/team" : "/app/goals/new"}>
          {manager ? "Open team dashboard" : "Create your goal sheet"}
        </Link>
      </Button>
    </div>
  );
}
