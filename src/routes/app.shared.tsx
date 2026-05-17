import { createFileRoute } from "@tanstack/react-router";
import { useApp, userById } from "@/lib/store";
import { StatusBadge } from "@/components/common/Bits";

export const Route = createFileRoute("/app/shared")({
  component: SharedPage,
});

function SharedPage() {
  const goals = useApp((s) => s.goals).filter((g) => g.isShared);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Shared goals</h1>
        <div className="text-sm text-muted-foreground">Departmental KPIs pushed to your sheet. Title and target are locked; you can adjust weightage.</div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {goals.length === 0 && <div className="md:col-span-2 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No shared goals yet.</div>}
        {goals.map((g) => (
          <div key={g.id} className="rounded-2xl glass p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Pushed by {userById(g.sharedFromOwnerId ?? "")?.name ?? "HR"}</div>
                <div className="text-base font-medium">{g.title}</div>
              </div>
              <StatusBadge status={g.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{g.description}</p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <Box label="Target" value={String(g.target)} />
              <Box label="UoM" value={g.uom} />
              <Box label="Weightage" value={`${g.weightage}%`} />
            </div>
          </div>
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
