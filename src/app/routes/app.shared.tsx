import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { StatusBadge } from "@/components/shared/goal-primitives";
import { useApp, userById } from "@/intragoals/workspace/store";

export const Route = createFileRoute("/app/shared")({
  component: SharedPage,
});

function SharedPage() {
  const user = useApp((s) => s.user);
  const people = useApp((s) => s.people);
  const sharedGoals = useApp((s) => s.goals).filter((goal) => goal.isShared);

  const assignedToMe = useMemo(
    () => sharedGoals.filter((goal) => goal.ownerId === user?.id),
    [sharedGoals, user?.id],
  );

  const publishedByMe = useMemo(
    () =>
      user?.role === "admin" || user?.role === "manager"
        ? sharedGoals.filter((goal) => goal.sharedFromOwnerId === user.id)
        : [],
    [sharedGoals, user],
  );

  const visibleGroups = useMemo(() => {
    const groups = [
      {
        title: "Assigned to you",
        description:
          "Departmental KPIs already attached to your sheet. Title and target stay locked; you can adjust weightage.",
        items: assignedToMe,
        empty: "No shared goals assigned to you yet.",
      },
    ];

    if (user?.role === "admin" || user?.role === "manager") {
      groups.push({
        title: "Published by you",
        description: "Track which shared KPIs you pushed and who received them.",
        items: publishedByMe,
        empty: "You have not published any shared goals yet.",
      });
    }

    return groups;
  }, [assignedToMe, publishedByMe, user?.role]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Shared goals</h1>
        <div className="text-sm text-muted-foreground">
          Shared KPI visibility now works across employee, manager, and admin roles.
        </div>
      </div>

      <div className="space-y-6">
        {visibleGroups.map((group) => (
          <section key={group.title} className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">{group.title}</h2>
              <div className="text-sm text-muted-foreground">{group.description}</div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {group.items.length === 0 ? (
                <div className="md:col-span-2 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                  {group.empty}
                </div>
              ) : (
                group.items.map((goal) => (
                  <div key={goal.id} className="rounded-2xl glass p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Pushed by {userById(goal.sharedFromOwnerId ?? "")?.name ?? "HR"}
                        </div>
                        <div className="text-base font-medium">{goal.title}</div>
                        {(user?.role === "admin" || user?.role === "manager") &&
                        goal.sharedFromOwnerId === user?.id ? (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Recipient:{" "}
                            {people.find((person) => person.id === goal.ownerId)?.name ??
                              "Workspace member"}
                          </div>
                        ) : null}
                      </div>
                      <StatusBadge status={goal.status} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{goal.description}</p>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                      <Box label="Target" value={String(goal.target)} />
                      <Box label="UoM" value={goal.uom} />
                      <Box label="Weightage" value={`${goal.weightage}%`} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}
