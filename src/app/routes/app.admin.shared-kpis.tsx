import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Lock, PencilLine, Send, Unlock, Users2 } from "lucide-react";
import { StatusBadge } from "@/components/shared/goal-primitives";
import {
  useApp,
  THRUST_AREAS,
  type Goal,
  type Role,
  type ScoreDirection,
  type UoM,
} from "@/intragoals/workspace/store";
import { workspaceApi } from "@/intragoals/workspace/workspace-api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/app/admin/shared-kpis")({
  component: SharedKpisPage,
});

type Draft = {
  title: string;
  description: string;
  thrustArea: string;
  uom: UoM;
  direction: ScoreDirection;
  target: number;
  weightage: number;
};

type SharedGoalGroup = {
  key: string;
  title: string;
  items: Goal[];
  sample: Goal;
};

const roleOptions: Role[] = ["employee", "manager", "admin"];

function SharedKpisPage() {
  const currentUser = useApp((s) => s.user)!;
  const authSource = useApp((s) => s.authSource);
  const people = useApp((s) => s.people);
  const goals = useApp((s) => s.goals).filter((goal) => goal.isShared);
  const upsertGoal = useApp((s) => s.upsertGoal);
  const addNotification = useApp((s) => s.addNotification);
  const pushAudit = useApp((s) => s.pushAudit);
  const setWorkspaceData = useApp((s) => s.setWorkspaceData);
  const [draft, setDraft] = useState<Draft>({
    title: "",
    description: "",
    thrustArea: THRUST_AREAS[0],
    uom: "Numeric",
    direction: "Max",
    target: 100,
    weightage: 10,
  });
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(["employee"]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [savingChanges, setSavingChanges] = useState(false);
  const [manageDraft, setManageDraft] = useState<Draft | null>(null);
  const [manageLocked, setManageLocked] = useState(true);

  const eligibleRecipients = useMemo(
    () => people.filter((person) => person.id !== currentUser.id),
    [currentUser.id, people],
  );

  const recipients = useMemo(
    () =>
      eligibleRecipients.filter(
        (person) => selectedRoles.includes(person.role) || selectedUsers.includes(person.id),
      ),
    [eligibleRecipients, selectedRoles, selectedUsers],
  );

  const publishedSummary = useMemo<SharedGoalGroup[]>(() => {
    const byTitle = new Map<string, Goal[]>();
    goals.forEach((goal) => {
      const key = [
        goal.sharedFromOwnerId ?? "workspace",
        goal.title,
        goal.thrustArea,
        goal.uom,
        goal.direction,
        goal.target,
      ].join("::");
      const list = byTitle.get(key) ?? [];
      list.push(goal);
      byTitle.set(key, list);
    });
    return Array.from(byTitle.entries()).map(([key, items]) => ({
      key,
      title: items[0].title,
      items,
      sample: items[0],
    }));
  }, [goals]);

  const editingGroup = useMemo(
    () => publishedSummary.find((group) => group.key === editingKey) ?? null,
    [editingKey, publishedSummary],
  );

  const toggleRole = (role: Role) => {
    setSelectedRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    );
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers((current) =>
      current.includes(userId) ? current.filter((item) => item !== userId) : [...current, userId],
    );
  };

  const publish = async () => {
    const title = draft.title.trim();
    if (!title) return toast.error("Add a KPI title.");
    if (draft.uom !== "Zero-based" && Number(draft.target) <= 0) {
      return toast.error("Set a target greater than 0 before pushing this KPI.");
    }
    if (!recipients.length)
      return toast.error("Choose at least one recipient before pushing this KPI.");

    const duplicates = recipients.filter((person) =>
      goals.some(
        (goal) =>
          goal.ownerId === person.id &&
          goal.isShared &&
          goal.title.trim().toLowerCase() === title.toLowerCase(),
      ),
    );
    if (duplicates.length) {
      return toast.error(`A shared KPI with this title already exists for ${duplicates[0].name}.`);
    }

    setPublishing(true);
    try {
      for (const recipient of recipients) {
        const goal: Goal = {
          id:
            authSource === "account" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `g-${Math.random().toString(36).slice(2, 9)}`,
          ownerId: recipient.id,
          title,
          description: draft.description.trim(),
          thrustArea: draft.thrustArea,
          uom: draft.uom,
          direction: draft.direction,
          target: draft.uom === "Zero-based" ? 0 : Number(draft.target),
          weightage: Number(draft.weightage) || 0,
          status: "Locked",
          isShared: true,
          sharedFromOwnerId: currentUser.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          quarterly: ["Q1", "Q2", "Q3", "Q4"].map((quarter) => ({
            quarter: quarter as Goal["quarterly"][number]["quarter"],
            achievement: null,
            status: "Not Started",
            comment: "",
          })),
        };
        upsertGoal(goal);

        const auditEntry = {
          userId: currentUser.id,
          userName: currentUser.name,
          action: "Published shared KPI",
          entityType: "Goal",
          entityId: goal.id,
          previousValue: recipient.role,
          newValue: `${title} -> ${recipient.name}`,
        };

        pushAudit(auditEntry);
        addNotification({
          id: `n-${Math.random().toString(36).slice(2, 9)}`,
          userId: recipient.id,
          title: "New shared KPI",
          body: `${currentUser.name} pushed "${title}" to your goal sheet.`,
          type: "info",
          read: false,
          deepLink: "/app/shared",
          createdAt: new Date().toISOString(),
        });

        if (authSource === "account") {
          await workspaceApi.saveGoal(goal);
          await workspaceApi.createAudit(auditEntry);
          await workspaceApi.createNotification({
            userId: recipient.id,
            title: "New shared KPI",
            body: `${currentUser.name} pushed "${title}" to your goal sheet.`,
            type: "info",
            deepLink: "/app/shared",
          });
        }
      }

      if (authSource === "account") {
        const workspace = await workspaceApi.loadWorkspace();
        if (workspace) setWorkspaceData(workspace);
      }

      toast.success(`Shared KPI published to ${recipients.length} recipient(s).`);
      setDraft({
        title: "",
        description: "",
        thrustArea: THRUST_AREAS[0],
        uom: "Numeric",
        direction: "Max",
        target: 100,
        weightage: 10,
      });
      setSelectedUsers([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to publish shared KPI.");
    } finally {
      setPublishing(false);
    }
  };

  const openManageDialog = (group: SharedGoalGroup) => {
    setEditingKey(group.key);
    setManageDraft({
      title: group.sample.title,
      description: group.sample.description,
      thrustArea: group.sample.thrustArea,
      uom: group.sample.uom,
      direction: group.sample.direction,
      target: group.sample.target,
      weightage: group.sample.weightage,
    });
    setManageLocked(group.sample.status === "Locked");
  };

  const saveManagedGroup = async () => {
    if (!editingGroup || !manageDraft) return;
    const title = manageDraft.title.trim();
    if (!title) return toast.error("Add a KPI title.");
    if (manageDraft.uom !== "Zero-based" && Number(manageDraft.target) <= 0) {
      return toast.error("Set a target greater than 0 before saving.");
    }

    setSavingChanges(true);
    try {
      const nextStatus: Goal["status"] = manageLocked ? "Locked" : "Approved";

      for (const existingGoal of editingGroup.items) {
        const nextGoal: Goal = {
          ...existingGoal,
          title,
          description: manageDraft.description.trim(),
          thrustArea: manageDraft.thrustArea,
          uom: manageDraft.uom,
          direction: manageDraft.direction,
          target: manageDraft.uom === "Zero-based" ? 0 : Number(manageDraft.target),
          weightage: Number(manageDraft.weightage) || 0,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        };

        const recipient = people.find((person) => person.id === existingGoal.ownerId);
        const auditEntry = {
          userId: currentUser.id,
          userName: currentUser.name,
          action: manageLocked ? "Updated locked shared KPI" : "Updated unlocked shared KPI",
          entityType: "Goal",
          entityId: existingGoal.id,
          previousValue: `${existingGoal.title} (${existingGoal.status})`,
          newValue: `${title} (${nextStatus}) -> ${recipient?.name ?? "Recipient"}`,
        };

        upsertGoal(nextGoal);
        pushAudit(auditEntry);

        addNotification({
          id: `n-${Math.random().toString(36).slice(2, 9)}`,
          userId: existingGoal.ownerId,
          title: manageLocked ? "Shared KPI updated and locked" : "Shared KPI updated and unlocked",
          body: `${currentUser.name} updated "${title}" on your goal sheet.`,
          type: "info",
          read: false,
          deepLink: `/app/goals/${existingGoal.id}`,
          createdAt: new Date().toISOString(),
        });

        if (authSource === "account") {
          await workspaceApi.saveGoal(nextGoal);
          await workspaceApi.createAudit(auditEntry);
          await workspaceApi.createNotification({
            userId: existingGoal.ownerId,
            title: manageLocked
              ? "Shared KPI updated and locked"
              : "Shared KPI updated and unlocked",
            body: `${currentUser.name} updated "${title}" on your goal sheet.`,
            type: "info",
            deepLink: `/app/goals/${existingGoal.id}`,
          });
        }
      }

      if (authSource === "account") {
        const workspace = await workspaceApi.loadWorkspace();
        if (workspace) setWorkspaceData(workspace);
      }

      toast.success(`Updated ${editingGroup.items.length} shared KPI recipient(s).`);
      setEditingKey(null);
      setManageDraft(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update shared KPI.");
    } finally {
      setSavingChanges(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Shared KPI management</h1>
        <div className="text-sm text-muted-foreground">
          Publish locked departmental KPIs to employees, managers, and admins from one workflow.
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
        <section className="rounded-2xl glass p-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users2 className="h-4 w-4 text-[color:var(--brand-purple)]" />
            Publish a shared KPI
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <FormField label="KPI title">
              <Input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder="e.g. Improve sprint predictability"
              />
            </FormField>
            <FormField label="Thrust area">
              <Select
                value={draft.thrustArea}
                onValueChange={(value) => setDraft({ ...draft, thrustArea: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THRUST_AREAS.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Description">
                <Textarea
                  rows={3}
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  placeholder="Explain why this KPI is shared and what recipients are expected to influence."
                />
              </FormField>
            </div>
            <FormField label="Unit of measure">
              <Select
                value={draft.uom}
                onValueChange={(value: UoM) => setDraft({ ...draft, uom: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["Numeric", "Percentage", "Timeline", "Zero-based"] as UoM[]).map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Direction">
              <Select
                value={draft.direction}
                onValueChange={(value: ScoreDirection) => setDraft({ ...draft, direction: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Max">Max</SelectItem>
                  <SelectItem value="Min">Min</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Target">
              <Input
                type="number"
                value={draft.target}
                onChange={(event) => setDraft({ ...draft, target: Number(event.target.value) })}
              />
            </FormField>
            <FormField label="Weightage (%)">
              <Input
                type="number"
                value={draft.weightage}
                onChange={(event) => setDraft({ ...draft, weightage: Number(event.target.value) })}
              />
            </FormField>
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
            {recipients.length > 0
              ? `${recipients.length} recipient(s) selected. Push KPI is ready.`
              : "Pick at least one role or person to enable Push KPI."}
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              onClick={() => void publish()}
              disabled={publishing || recipients.length === 0}
              className="bg-brand-gradient text-background hover:opacity-90"
            >
              <Send className="mr-1.5 h-4 w-4" />
              {publishing ? "Publishing..." : "Push KPI"}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl glass p-5">
          <div className="text-sm font-medium">Recipients</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Include managers and admins directly, or use role-based bulk selection.
          </div>
          <div className="mt-4 space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              {roleOptions.map((role) => (
                <div
                  key={role}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleRole(role)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleRole(role);
                    }
                  }}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-left text-sm capitalize"
                >
                  <Checkbox
                    className="pointer-events-none"
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  <span>{role}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {eligibleRecipients.map((person) => (
                <div
                  key={person.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleUser(person.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleUser(person.id);
                    }
                  }}
                  className="flex w-full items-start gap-3 rounded-xl border border-border bg-background/60 px-3 py-3 text-left text-sm"
                >
                  <Checkbox
                    className="pointer-events-none"
                    checked={selectedUsers.includes(person.id)}
                    onCheckedChange={() => toggleUser(person.id)}
                  />
                  <div>
                    <div className="font-medium">{person.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {person.role} � {person.department}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl glass p-5">
        <div className="text-sm font-medium">Published shared KPIs</div>
        <div className="mt-4 space-y-3">
          {publishedSummary.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No shared KPIs configured yet.
            </div>
          ) : (
            publishedSummary.map((entry) => (
              <div
                key={entry.title}
                className="rounded-xl border border-border bg-background/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-medium">{entry.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {entry.items.length} recipient(s) � published by{" "}
                      {people.find((person) => person.id === entry.sample.sharedFromOwnerId)
                        ?.name ?? "Workspace"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={entry.items[0].status} />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-border"
                      onClick={() => openManageDialog(entry)}
                    >
                      <PencilLine className="mr-1.5 h-4 w-4" />
                      Manage
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.items.map((goal) => {
                    const owner = people.find((person) => person.id === goal.ownerId);
                    return (
                      <span
                        key={goal.id}
                        className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs"
                      >
                        {owner?.name ?? "Recipient"} � {owner?.role ?? "employee"}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <Dialog
        open={Boolean(editingGroup && manageDraft)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingKey(null);
            setManageDraft(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage shared KPI</DialogTitle>
            <DialogDescription>
              Update the pushed KPI definition and control whether recipients keep it locked or
              editable.
            </DialogDescription>
          </DialogHeader>
          {editingGroup && manageDraft ? (
            <div className="grid gap-4">
              <div className="rounded-xl border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
                This change will update {editingGroup.items.length} recipient(s) across the
                workspace.
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="KPI title">
                  <Input
                    value={manageDraft.title}
                    onChange={(event) =>
                      setManageDraft({ ...manageDraft, title: event.target.value })
                    }
                  />
                </FormField>
                <FormField label="Thrust area">
                  <Select
                    value={manageDraft.thrustArea}
                    onValueChange={(value) => setManageDraft({ ...manageDraft, thrustArea: value })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THRUST_AREAS.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <div className="md:col-span-2">
                  <FormField label="Description">
                    <Textarea
                      rows={3}
                      value={manageDraft.description}
                      onChange={(event) =>
                        setManageDraft({ ...manageDraft, description: event.target.value })
                      }
                    />
                  </FormField>
                </div>
                <FormField label="Unit of measure">
                  <Select
                    value={manageDraft.uom}
                    onValueChange={(value: UoM) => setManageDraft({ ...manageDraft, uom: value })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["Numeric", "Percentage", "Timeline", "Zero-based"] as UoM[]).map(
                        (item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Direction">
                  <Select
                    value={manageDraft.direction}
                    onValueChange={(value: ScoreDirection) =>
                      setManageDraft({ ...manageDraft, direction: value })
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Max">Max</SelectItem>
                      <SelectItem value="Min">Min</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Target">
                  <Input
                    type="number"
                    value={manageDraft.target}
                    onChange={(event) =>
                      setManageDraft({ ...manageDraft, target: Number(event.target.value) })
                    }
                  />
                </FormField>
                <FormField label="Weightage (%)">
                  <Input
                    type="number"
                    value={manageDraft.weightage}
                    onChange={(event) =>
                      setManageDraft({ ...manageDraft, weightage: Number(event.target.value) })
                    }
                  />
                </FormField>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <div>
                  <div className="text-sm font-medium">Keep KPI locked</div>
                  <div className="text-xs text-muted-foreground">
                    Locked KPIs stay protected after you push updates. Turn this off to unlock them.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {manageLocked ? (
                    <Lock className="h-4 w-4 text-[color:var(--brand-purple)]" />
                  ) : (
                    <Unlock className="h-4 w-4 text-emerald-600" />
                  )}
                  <Switch checked={manageLocked} onCheckedChange={setManageLocked} />
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-border"
              onClick={() => {
                setEditingKey(null);
                setManageDraft(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void saveManagedGroup()}
              disabled={savingChanges}
              className="bg-brand-gradient text-background hover:opacity-90"
            >
              {savingChanges ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
