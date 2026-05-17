import { createFileRoute } from "@tanstack/react-router";
import { useApp, userById } from "@/lib/store";

export const Route = createFileRoute("/app/admin/escalations")({
  component: EscalationsPage,
});

const rules = [
  { trigger: "Employee has not submitted goals within 10 days of cycle open", chain: "Employee → Manager" },
  { trigger: "Manager has not approved within 5 days of submission", chain: "Manager → HR/Admin" },
  { trigger: "Quarterly check-in not completed within active window", chain: "Employee → Manager → HR" },
  { trigger: "Returned goal not resubmitted within 3 days", chain: "Employee → Manager → Skip-level" },
];

function EscalationsPage() {
  const escalations = useApp((s) => s.escalations);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Escalation rules</h1>
        <div className="text-sm text-muted-foreground">Triggered via n8n webhooks. Logs surface here automatically.</div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {rules.map((r) => (
          <div key={r.trigger} className="rounded-2xl glass p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Trigger</div>
            <div className="mt-1 text-sm">{r.trigger}</div>
            <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Chain</div>
            <div className="mt-1 text-sm">{r.chain}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Active escalation logs</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {escalations.map((e) => (
            <div key={e.id} className="rounded-2xl glass p-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[color:var(--brand-orange)]">{e.level}</span>
                <span className="text-muted-foreground">{userById(e.ownerId)?.name}</span>
              </div>
              <div className="mt-1 text-sm">{e.reason}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
