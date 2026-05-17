import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { StatusBadge } from "@/components/common/Bits";

export const Route = createFileRoute("/app/admin/shared-kpis")({
  component: SharedKpis,
});

function SharedKpis() {
  const goals = useApp((s) => s.goals).filter((g) => g.isShared);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Shared KPI management</h1>
        <div className="text-sm text-muted-foreground">Push departmental KPIs to many recipients with locked title and target</div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {goals.length === 0 && <div className="md:col-span-2 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No shared KPIs configured.</div>}
        {goals.map((g) => (
          <div key={g.id} className="rounded-2xl glass p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="text-base font-medium">{g.title}</div>
              <StatusBadge status={g.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{g.description}</p>
            <div className="mt-3 text-xs text-muted-foreground">Target: <span className="text-foreground">{g.target}</span> · UoM: <span className="text-foreground">{g.uom}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
