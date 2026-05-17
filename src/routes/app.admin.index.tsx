import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp, scoreForGoal, userById } from "@/lib/store";
import { KpiCard } from "@/components/common/Bits";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";

export const Route = createFileRoute("/app/admin/")({
  component: AdminDash,
});

function AdminDash() {
  const goals = useApp((s) => s.goals);
  const people = useApp((s) => s.people);
  const escalations = useApp((s) => s.escalations);
  const audit = useApp((s) => s.audit);

  const totalGoals = goals.length;
  const approved = goals.filter((g) => g.status === "Approved" || g.status === "Locked").length;
  const completion = Math.round((approved / Math.max(1, totalGoals)) * 100);

  const departments = Array.from(new Set(people.map((person) => person.department))).filter(Boolean);
  const deptData = departments.map((department) => {
    const departmentUsers = people.filter((person) => person.department === department);
    const departmentGoals = goals.filter((goal) => departmentUsers.some((person) => person.id === goal.ownerId));
    const score = departmentGoals.length
      ? Math.round(departmentGoals.reduce((sum, goal) => sum + scoreForGoal(goal), 0) / departmentGoals.length)
      : 0;
    return { dept: department.replace("Product Engineering", "Product Eng"), score };
  });
  const statusData = [
    { name: "Approved", value: approved, color: "#19d88f" },
    { name: "Pending", value: goals.filter((g) => g.status === "Pending Approval").length, color: "#ffd43d" },
    { name: "Draft", value: goals.filter((g) => g.status === "Draft").length, color: "#94A3B8" },
    { name: "Returned", value: goals.filter((g) => g.status === "Returned").length, color: "#ff7a18" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin overview</h1>
        <div className="text-sm text-muted-foreground">Org-wide visibility for the FY26 cycle</div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Org Completion" value={`${completion}%`} hint={`${approved} / ${totalGoals} goals approved`} accent="blue" />
        <KpiCard label="Active Escalations" value={escalations.filter(e => !e.resolved).length} hint="Across L1 and HR levels" accent="orange" />
        <KpiCard label="Goals Approved" value={approved} hint="This cycle" accent="green" />
        <KpiCard label="Audit Events" value={audit.length} hint="Captured in this cycle" accent="purple" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl glass p-5">
          <div className="text-sm font-medium">Department-wise progress</div>
          <div className="mt-3 h-72">
            <ResponsiveContainer>
              <BarChart data={deptData}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="dept" stroke="rgba(148,163,184,0.6)" fontSize={12} />
                <YAxis stroke="rgba(148,163,184,0.6)" fontSize={12} />
                <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 8 }} />
                <Bar dataKey="score" fill="#8438ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl glass p-5">
          <div className="text-sm font-medium">Goal status mix</div>
          <div className="mt-3 h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {statusData.map((s) => <Cell key={s.name} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name} · {s.value}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl glass p-5">
          <div className="text-sm font-medium">Active escalations</div>
          <div className="mt-3 space-y-2">
            {escalations.map((e) => (
              <div key={e.id} className="rounded-xl border border-border bg-secondary/40 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[color:var(--brand-orange)]">{e.level}</span>
                  <span className="text-muted-foreground">{userById(e.ownerId)?.name}</span>
                </div>
                <div className="mt-1 text-sm">{e.reason}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl glass p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Recent audit activity</div>
            <Link to="/app/audit" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {audit.slice(0, 6).map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 border-t border-border pt-2 first:border-0 first:pt-0">
                <div className="min-w-0">
                  <div>{a.action}</div>
                  <div className="text-xs text-muted-foreground">{a.userName} · {a.entityType}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
