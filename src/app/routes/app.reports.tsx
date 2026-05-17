import { createFileRoute } from "@tanstack/react-router";
import { useApp, scoreForGoal, userById } from "@/intragoals/workspace/store";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const people = useApp((s) => s.people);
  const goals = useApp((s) => s.goals);
  const data = people
    .filter((person) => person.role === "employee")
    .map((m) => {
      const mg = goals.filter((g) => g.ownerId === m.id);
      const avg = mg.length
        ? Math.round(mg.reduce((a, g) => a + scoreForGoal(g), 0) / mg.length)
        : 0;
      return { name: m.name.split(" ")[0], score: avg, goals: mg.length };
    });

  const exportCsv = (label: string) => {
    const rows = [
      ["Employee", "Goal", "Status", "Target", "Weightage", "Score"],
      ...goals.map((g) => [
        userById(g.ownerId)?.name ?? "",
        g.title,
        g.status,
        g.target,
        g.weightage,
        scoreForGoal(g),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `intragoals-${label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${label} exported.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
          <div className="text-sm text-muted-foreground">
            Export CSV / Excel snapshots of your cycle
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          "Achievement report",
          "Planned vs actual",
          "Employee completion",
          "Manager check-in",
          "Department progress",
        ].map((r) => (
          <div key={r} className="rounded-2xl glass p-5 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{r}</div>
              <div className="text-xs text-muted-foreground">CSV export � current cycle</div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-border"
              onClick={() => exportCsv(r)}
            >
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
          </div>
        ))}
      </div>

      <div className="rounded-2xl glass p-5">
        <div className="text-sm font-medium">Team performance</div>
        <div className="mt-3 h-72">
          <ResponsiveContainer>
            <BarChart data={data}>
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
              <Bar dataKey="score" fill="#00d8ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
