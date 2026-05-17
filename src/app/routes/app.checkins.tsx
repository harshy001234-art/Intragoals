import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  useApp,
  scoreForGoal,
  type Quarter,
  type CheckinStatus,
} from "@/intragoals/workspace/store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgressRing } from "@/components/shared/goal-primitives";
import { toast } from "sonner";
import { workspaceApi } from "@/intragoals/workspace/workspace-api";

export const Route = createFileRoute("/app/checkins")({
  component: CheckinsPage,
});

const QUARTERS: { q: Quarter; window: string }[] = [
  { q: "Q1", window: "July 1 - July 21" },
  { q: "Q2", window: "October 1 - October 21" },
  { q: "Q3", window: "January 1 - January 21" },
  { q: "Q4", window: "March 15 - April 15 (Annual)" },
];

function CheckinsPage() {
  const user = useApp((s) => s.user)!;
  const authSource = useApp((s) => s.authSource);
  const people = useApp((s) => s.people);
  const allGoals = useApp((s) => s.goals);
  const updateQuarter = useApp((s) => s.updateQuarter);
  const [selectedOwnerId, setSelectedOwnerId] = useState(user.id);

  const visibleProfiles = useMemo(() => {
    if (user.role === "admin") return people;
    if (user.role === "manager") {
      return people.filter(
        (person) =>
          person.id === user.id ||
          (person.role === "employee" && (person.managerId === user.id || !person.managerId)),
      );
    }
    return people.filter((person) => person.id === user.id);
  }, [people, user.id, user.role]);

  useEffect(() => {
    if (!visibleProfiles.some((person) => person.id === selectedOwnerId)) {
      setSelectedOwnerId(visibleProfiles[0]?.id ?? user.id);
    }
  }, [selectedOwnerId, user.id, visibleProfiles]);

  const selectedProfile = visibleProfiles.find((person) => person.id === selectedOwnerId) ?? user;

  const goals = allGoals.filter(
    (g) => g.ownerId === selectedProfile.id && (g.status === "Approved" || g.status === "Locked"),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Quarterly check-ins</h1>
          <div className="text-sm text-muted-foreground">
            FY26 cycle � update planned vs actual for approved goals
          </div>
        </div>
        {visibleProfiles.length > 1 ? (
          <div className="w-full max-w-xs space-y-1.5">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Profile</div>
            <Select value={selectedProfile.id} onValueChange={setSelectedOwnerId}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibleProfiles.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name} � {person.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl glass p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Active profile
        </div>
        <div className="mt-1 text-base font-medium">{selectedProfile.name}</div>
        <div className="text-sm text-muted-foreground">
          {selectedProfile.title} � {selectedProfile.department}
        </div>
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
            No approved goals yet for {selectedProfile.name}. Submit a goal sheet to start quarterly
            check-ins.
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
                <div
                  key={u.quarter}
                  className="rounded-xl border border-border bg-secondary/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium">{u.quarter}</div>
                  </div>
                  <Input
                    type="number"
                    className="mt-2"
                    placeholder="Actual"
                    value={u.achievement ?? ""}
                    onChange={(e) =>
                      updateQuarter(g.id, u.quarter, {
                        achievement: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                  <Select
                    value={u.status}
                    onValueChange={(v: CheckinStatus) =>
                      updateQuarter(g.id, u.quarter, { status: v })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["Not Started", "On Track", "Completed"] as CheckinStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    rows={2}
                    className="mt-2"
                    placeholder="Comment"
                    value={u.comment}
                    onChange={(e) => updateQuarter(g.id, u.quarter, { comment: e.target.value })}
                  />
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
                          .then(() =>
                            toast.success(`${selectedProfile.name} � ${u.quarter} update saved.`),
                          )
                          .catch((error) =>
                            toast.error(
                              error instanceof Error ? error.message : "Unable to sync check-in.",
                            ),
                          );
                      } else {
                        toast.success(`${selectedProfile.name} � ${u.quarter} update saved.`);
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
