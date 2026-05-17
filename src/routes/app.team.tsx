import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp, scoreForGoal, overallScore } from "@/lib/store";
import { ProgressRing } from "@/components/common/Bits";

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
      <div>
        <h1 className="text-2xl font-semibold">My Team</h1>
        <div className="text-sm text-muted-foreground">{members.length} direct reports - FY26 cycle</div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => {
          const myGoals = goals.filter((g) => g.ownerId === m.id);
          const score = overallScore(myGoals);
          const pending = myGoals.filter((g) => g.status === "Pending Approval").length;
          return (
            <div key={m.id} className="rounded-2xl glass p-5">
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
                <Link to="/app/approvals" className="text-foreground hover:underline">
                  View
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
