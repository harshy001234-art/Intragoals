import { createFileRoute, Link } from "@tanstack/react-router";
import { ProgressRing } from "@/components/shared/goal-primitives";
import { useApp, scoreForGoal, overallScore } from "@/intragoals/workspace/store";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/app/team")({
  component: TeamPage,
});

function TeamPage() {
  const user = useApp((s) => s.user);
  const people = useApp((s) => s.people);
  const goals = useApp((s) => s.goals);
  const members = people.filter(
    (person) =>
      person.role === "employee" &&
      (!person.managerId || person.managerId === user?.id || user?.role === "manager"),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">My Team</h1>
          <div className="text-sm text-muted-foreground">
            {members.length} direct reports - FY26 cycle
          </div>
        </div>
        <Button asChild className="bg-brand-gradient text-background hover:opacity-90">
          <Link to="/app/manager-shared-kpis">
            <Plus className="mr-1.5 h-4 w-4" />
            Publish KPI
          </Link>
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => {
          const myGoals = goals.filter((g) => g.ownerId === m.id);
          const score = overallScore(myGoals);
          const pending = myGoals.filter((g) => g.status === "Pending Approval").length;
          return (
            <Link
              key={m.id}
              to="/app/people/$personId"
              params={{ personId: m.id }}
              className="block"
            >
              <div className="rounded-2xl glass p-5 transition-colors hover:bg-secondary/30">
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-lg text-sm font-semibold text-background"
                    style={{ background: m.avatarColor }}
                  >
                    {m.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <div>
                    <div className="text-sm font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.title}</div>
                  </div>
                  <div className="ml-auto">
                    <ProgressRing value={score} size={48} stroke={6} />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {myGoals.length} goals - {pending} pending
                  </span>
                  <span className="text-foreground hover:underline">View profile</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
