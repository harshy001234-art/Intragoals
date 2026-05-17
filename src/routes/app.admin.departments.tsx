import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/admin/departments")({
  component: () => (
    <Section title="Departments" subtitle="Org structure used for shared KPIs and reporting">
      <Grid items={[
        { name: "Product Engineering", head: "Priya Iyer", count: 42 },
        { name: "Sales", head: "Rahul Verma", count: 65 },
        { name: "Marketing", head: "Anjali Kapoor", count: 18 },
        { name: "People & Culture", head: "Rohan Kapoor", count: 12 },
        { name: "Finance", head: "Sneha Patel", count: 22 },
        { name: "Customer Success", head: "Vikram Joshi", count: 28 },
      ]} />
    </Section>
  ),
});

export const RouteCycles = createFileRoute("/app/admin/cycles");

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="text-sm text-muted-foreground">{subtitle}</div>
      </div>
      {children}
    </div>
  );
}
function Grid({ items }: { items: { name: string; head: string; count: number }[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((d) => (
        <div key={d.name} className="rounded-2xl glass p-5">
          <div className="text-sm font-medium">{d.name}</div>
          <div className="mt-1 text-xs text-muted-foreground">Head: {d.head}</div>
          <div className="mt-3 text-2xl font-semibold">{d.count}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">members</div>
        </div>
      ))}
    </div>
  );
}
