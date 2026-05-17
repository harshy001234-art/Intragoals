import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ProgressRing, StatusBadge } from "@/components/shared/goal-primitives";
import { useApp, overallScore, scoreForGoal, userById } from "@/intragoals/workspace/store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, FolderKanban, Target, Users } from "lucide-react";

export const Route = createFileRoute("/app/people/$personId")({
  component: PersonProfilePage,
});

function PersonProfilePage() {
  const { personId } = Route.useParams();
  const currentUser = useApp((s) => s.user);
  const people = useApp((s) => s.people);
  const goals = useApp((s) => s.goals);
  const notifications = useApp((s) => s.notifications);
  const person = people.find((item) => item.id === personId);

  const personGoals = useMemo(
    () => goals.filter((goal) => goal.ownerId === personId),
    [goals, personId],
  );
  const unreadNotifications = notifications.filter(
    (notification) => notification.userId === personId && !notification.read,
  ).length;
  const manager = person?.managerId ? userById(person.managerId) : null;

  if (!person) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Profile not found in this workspace.
      </div>
    );
  }

  const canViewGoals =
    currentUser?.role === "admin" ||
    currentUser?.id === person.id ||
    person.managerId === currentUser?.id ||
    (currentUser?.role === "manager" && person.role === "employee" && !person.managerId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="grid h-12 w-12 place-items-center rounded-xl text-sm font-semibold text-background"
            style={{ background: person.avatarColor }}
          >
            {person.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </span>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {person.role}
            </div>
            <h1 className="text-2xl font-semibold">{person.name}</h1>
            <div className="text-sm text-muted-foreground">
              {person.title} � {person.department}
            </div>
          </div>
        </div>
        <Button asChild variant="outline" className="border-border">
          <Link to={currentUser?.role === "admin" ? "/app/admin/users" : "/app/team"}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <ProfileStat
          icon={Target}
          label="Goals"
          value={String(personGoals.length)}
          hint="Current cycle"
        />
        <ProfileStat
          icon={FolderKanban}
          label="Shared KPIs"
          value={String(personGoals.filter((goal) => goal.isShared).length)}
          hint="Assigned or published"
        />
        <ProfileStat
          icon={Bell}
          label="Unread alerts"
          value={String(unreadNotifications)}
          hint="Pending attention"
        />
        <ProfileStat
          icon={Users}
          label="Manager"
          value={manager?.name ?? "Unassigned"}
          hint={manager ? manager.title : "No reporting line set"}
        />
      </div>

      <section className="rounded-2xl glass p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Profile snapshot</div>
            <div className="text-xs text-muted-foreground">
              Workspace identity, ownership, and current cycle visibility.
            </div>
          </div>
          <ProgressRing value={overallScore(personGoals)} size={84} stroke={8} label="Score" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InfoBox label="Email" value={person.email} />
          <InfoBox label="Department" value={person.department} />
          <InfoBox label="Title" value={person.title} />
          <InfoBox label="Reports to" value={manager?.name ?? "No manager assigned"} />
        </div>
      </section>

      <section className="rounded-2xl glass p-5">
        <div className="text-sm font-medium">Goal sheets</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Open any goal to review progress, approvals, and check-ins.
        </div>
        {!canViewGoals ? (
          <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Goal details are only visible to the owner, their manager, or admins.
          </div>
        ) : personGoals.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No goals available for this person yet.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {personGoals.map((goal) => (
              <Link key={goal.id} to="/app/goals/$id" params={{ id: goal.id }} className="block">
                <div className="flex items-center gap-4 rounded-xl border border-border bg-background/70 p-4 transition-colors hover:bg-secondary/40">
                  <ProgressRing value={scoreForGoal(goal)} size={46} stroke={5} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-medium">{goal.title}</div>
                      {goal.isShared ? (
                        <span className="rounded-full border border-[color:var(--brand-purple)]/20 bg-[color:var(--brand-purple)]/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--brand-purple)]">
                          Shared KPI
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {goal.thrustArea} � Target {goal.target} � {goal.weightage}% weight
                    </div>
                  </div>
                  <StatusBadge status={goal.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProfileStat({
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
      <div className="mt-3 text-lg font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/70 p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
