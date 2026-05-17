import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/admin/cycles")({
  component: CyclesPage,
});

const cycle = [
  { name: "Goal Setting", window: "May", status: "Closed" },
  { name: "Q1 Check-in", window: "July 1 – July 21", status: "Closed" },
  { name: "Q2 Check-in", window: "October 1 – October 21", status: "Closed" },
  { name: "Q3 Check-in", window: "January 1 – January 21", status: "Active" },
  { name: "Q4 / Annual", window: "March 15 – April 15", status: "Upcoming" },
];

function CyclesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cycle management</h1>
        <div className="text-sm text-muted-foreground">FY26 calendar across goal setting and quarterly check-ins</div>
      </div>
      <div className="rounded-2xl glass p-5">
        <ol className="relative space-y-5 border-l border-border pl-6">
          {cycle.map((c) => (
            <li key={c.name} className="relative">
              <span className="absolute -left-[27px] top-1 grid h-4 w-4 place-items-center rounded-full bg-brand-gradient" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium">{c.name}</div>
                <span className={`text-[10px] uppercase tracking-wider ${c.status === "Active" ? "text-[color:var(--brand-green)]" : c.status === "Upcoming" ? "text-[color:var(--brand-purple)]" : "text-muted-foreground"}`}>
                  {c.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{c.window}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
