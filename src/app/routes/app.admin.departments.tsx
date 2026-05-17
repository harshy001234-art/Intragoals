import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Building2, Search, UserRoundCog, Users } from "lucide-react";
import { toast } from "sonner";
import { useApp, type User } from "@/intragoals/workspace/store";
import { workspaceApi } from "@/intragoals/workspace/workspace-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/app/admin/departments")({
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const currentUser = useApp((s) => s.user);
  const authSource = useApp((s) => s.authSource);
  const people = useApp((s) => s.people);
  const upsertUser = useApp((s) => s.upsertUser);
  const pushAudit = useApp((s) => s.pushAudit);
  const setWorkspaceData = useApp((s) => s.setWorkspaceData);
  const [search, setSearch] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const departments = useMemo(() => {
    const values = Array.from(
      new Set(people.map((person) => person.department.trim()).filter(Boolean)),
    );
    return values.sort((a, b) => a.localeCompare(b));
  }, [people]);

  const filteredPeople = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return people;
    return people.filter((person) =>
      [person.name, person.email, person.department, person.title]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [people, search]);

  const departmentCards = useMemo(
    () =>
      departments.map((department) => {
        const members = people.filter((person) => person.department === department);
        const head =
          members.find((person) => person.role === "manager") ??
          members.find((person) => person.role === "admin") ??
          members[0];
        return {
          department,
          members,
          head,
        };
      }),
    [departments, people],
  );

  const assignDepartment = async (person: User, department: string) => {
    const normalized = department.trim();
    if (!normalized || normalized === person.department) return;

    const nextUser = { ...person, department: normalized };
    upsertUser(nextUser);
    setSavingUserId(person.id);
    const auditEntry = {
      userId: currentUser?.id ?? person.id,
      userName: currentUser?.name ?? "Workspace admin",
      action: "Updated department assignment",
      entityType: "Profile",
      entityId: person.id,
      previousValue: person.department,
      newValue: normalized,
    };

    try {
      if (authSource === "account") {
        await workspaceApi.updateProfile(person.id, { department: normalized });
        await workspaceApi.createAudit(auditEntry);
        const workspace = await workspaceApi.loadWorkspace();
        if (workspace) setWorkspaceData(workspace);
      } else {
        pushAudit(auditEntry);
      }
      toast.success(`${person.name} moved to ${normalized}.`);
    } catch (error) {
      upsertUser(person);
      toast.error(error instanceof Error ? error.message : "Unable to update department.");
    } finally {
      setSavingUserId(null);
    }
  };

  const addDepartment = () => {
    const normalized = newDepartment.trim();
    if (!normalized) return toast.error("Enter a department name first.");
    if (departments.some((department) => department.toLowerCase() === normalized.toLowerCase())) {
      return toast.error("That department already exists.");
    }
    setNewDepartment(normalized);
    toast.success(`${normalized} is ready. Assign people to start using it.`);
  };

  const departmentOptions = useMemo(() => {
    const extra = newDepartment.trim();
    return extra && !departments.includes(extra) ? [...departments, extra] : departments;
  }, [departments, newDepartment]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Departments</h1>
          <div className="text-sm text-muted-foreground">
            Manage org structure, department ownership, and member placement from one screen.
          </div>
        </div>
        <div className="flex w-full max-w-md gap-2">
          <Input
            value={newDepartment}
            onChange={(event) => setNewDepartment(event.target.value)}
            placeholder="Add a department, e.g. RevOps"
          />
          <Button
            type="button"
            onClick={addDepartment}
            className="bg-brand-gradient text-background hover:opacity-90"
          >
            Add
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={Building2}
          label="Departments"
          value={departmentCards.length}
          hint="Active reporting groups"
        />
        <SummaryCard
          icon={Users}
          label="People assigned"
          value={people.length}
          hint={`${people.filter((person) => person.role !== "employee").length} manager/admin leads in workspace`}
        />
        <SummaryCard
          icon={UserRoundCog}
          label="Need owner review"
          value={departmentCards.filter((item) => !item.head).length}
          hint="Departments without a visible lead in the current roster"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr,1fr]">
        <section className="rounded-2xl glass p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Department overview</div>
              <div className="text-xs text-muted-foreground">
                Quick scan for headcount and likely owner
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {departmentCards.map((item) => (
              <div
                key={item.department}
                className="rounded-xl border border-border bg-background/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-medium">{item.department}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.head ? `Likely lead: ${item.head.name}` : "No lead inferred yet"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border px-3 py-1 text-sm font-medium">
                    {item.members.length}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {item.members.slice(0, 4).map((person) => (
                    <span
                      key={person.id}
                      className="rounded-full border border-border bg-secondary/40 px-2 py-1"
                    >
                      {person.name}
                    </span>
                  ))}
                  {item.members.length > 4 ? <span>+{item.members.length - 4} more</span> : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl glass p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Member assignment</div>
              <div className="text-xs text-muted-foreground">
                Search people and move them between departments directly.
              </div>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search people"
                className="pl-9"
              />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {filteredPeople.map((person) => (
              <div key={person.id} className="rounded-xl border border-border bg-background/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{person.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {person.title} � {person.email}
                    </div>
                  </div>
                  <div className="w-full max-w-[240px] space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Department
                    </Label>
                    <Select
                      value={person.department}
                      onValueChange={(value) => void assignDepartment(person, value)}
                      disabled={savingUserId === person.id}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentOptions.map((department) => (
                          <SelectItem key={department} value={department}>
                            {department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
            {filteredPeople.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No matching people found.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/60 text-[color:var(--brand-purple)]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
