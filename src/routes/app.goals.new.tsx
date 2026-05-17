import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useApp, THRUST_AREAS, type Goal, type UoM, type ScoreDirection } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Save, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { workspaceApi } from "@/lib/workspace-api";

export const Route = createFileRoute("/app/goals/new")({
  component: NewGoalSheet,
});

interface Draft {
  id: string;
  title: string;
  description: string;
  thrustArea: string;
  uom: UoM;
  direction: ScoreDirection;
  target: number;
  weightage: number;
}

const blank = (): Draft => ({
  id: `d-${Math.random().toString(36).slice(2, 9)}`,
  title: "",
  description: "",
  thrustArea: THRUST_AREAS[0],
  uom: "Numeric",
  direction: "Max",
  target: 0,
  weightage: 10,
});

function NewGoalSheet() {
  const user = useApp((s) => s.user)!;
  const authSource = useApp((s) => s.authSource);
  const upsertGoal = useApp((s) => s.upsertGoal);
  const pushAudit = useApp((s) => s.pushAudit);
  const navigate = useNavigate();
  const [items, setItems] = useState<Draft[]>([{ ...blank(), title: "" }]);
  const [saving, setSaving] = useState<"Draft" | "Pending Approval" | null>(null);

  const totalWeight = items.reduce((a, i) => a + (Number(i.weightage) || 0), 0);

  const addRow = () => {
    if (items.length >= 8) return toast.error("Maximum 8 goals per employee.");
    setItems([...items, blank()]);
  };
  const removeRow = (id: string) => setItems(items.filter((i) => i.id !== id));
  const update = (id: string, patch: Partial<Draft>) =>
    setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const validate = () => {
    if (items.length === 0) return "Add at least one goal.";
    if (items.length > 8) return "Maximum 8 goals per employee.";
    for (const it of items) {
      if (!it.title.trim()) return "Empty goal titles are not allowed.";
      if (it.weightage < 10) return "Minimum weightage per goal is 10%.";
    }
    const titles = items.map((i) => i.title.trim().toLowerCase());
    if (new Set(titles).size !== titles.length) return "Duplicate goal titles are not allowed.";
    if (totalWeight !== 100) return `Total weightage must equal 100% (currently ${totalWeight}%).`;
    return null;
  };

  const persist = async (status: "Draft" | "Pending Approval") => {
    if (status === "Pending Approval") {
      const err = validate();
      if (err) return toast.error(err);
    } else {
      // For draft, only require non-empty titles
      if (items.some((i) => !i.title.trim())) return toast.error("Empty goal titles are not allowed.");
    }
    setSaving(status);
    try {
      for (const it of items) {
        const auditEntry = {
          userId: user.id,
          userName: user.name,
          action: status === "Draft" ? "Saved goal as draft" : "Submitted goal for approval",
          entityType: "Goal",
          entityId: "",
          newValue: it.title.trim(),
        };
      const goal: Goal = {
        id: authSource === "account" && "randomUUID" in crypto ? crypto.randomUUID() : `g-${Math.random().toString(36).slice(2, 9)}`,
        ownerId: user.id,
        title: it.title.trim(),
        description: it.description,
        thrustArea: it.thrustArea,
        uom: it.uom,
        direction: it.direction,
        target: Number(it.target) || 0,
        weightage: Number(it.weightage) || 0,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        quarterly: ["Q1", "Q2", "Q3", "Q4"].map((q) => ({ quarter: q as any, achievement: null, status: "Not Started", comment: "" })),
      };
      upsertGoal(goal);
        pushAudit({ ...auditEntry, entityId: goal.id });
        if (authSource === "account") {
          await workspaceApi.saveGoal(goal);
          await workspaceApi.createAudit({ ...auditEntry, entityId: goal.id });
        }
      }
      toast.success(status === "Draft" ? "Saved as draft." : "Submitted for manager approval.");
      navigate({ to: "/app/goals" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save goal sheet.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Create goal sheet</h1>
          <div className="text-sm text-muted-foreground">FY26 cycle · up to 8 goals · weightages must total 100%</div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border" disabled={Boolean(saving)} onClick={() => void persist("Draft")}><Save className="mr-1.5 h-4 w-4" /> {saving === "Draft" ? "Saving..." : "Save draft"}</Button>
          <Button className="bg-brand-gradient text-background hover:opacity-90" disabled={Boolean(saving)} onClick={() => void persist("Pending Approval")}><Send className="mr-1.5 h-4 w-4" /> {saving === "Pending Approval" ? "Submitting..." : "Submit for approval"}</Button>
        </div>
      </div>

      <div className="rounded-2xl glass p-4">
        <div className="flex items-center justify-between text-xs">
          <div className="text-muted-foreground">Goals: <span className="text-foreground">{items.length} / 8</span></div>
          <div className={totalWeight === 100 ? "text-[color:var(--brand-green)]" : "text-[color:var(--brand-orange)]"}>
            Total weightage: {totalWeight}%
          </div>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-brand-gradient transition-all" style={{ width: `${Math.min(100, totalWeight)}%` }} />
        </div>
      </div>

      <div className="space-y-4">
        {items.map((it, idx) => (
          <div key={it.id} className="rounded-2xl glass p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Goal {idx + 1}</div>
              {items.length > 1 && (
                <button onClick={() => removeRow(it.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2 space-y-1.5">
                <Label>Goal title</Label>
                <Input value={it.title} onChange={(e) => update(it.id, { title: e.target.value })} placeholder="e.g. Reduce P95 API latency by 30%" />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={2} value={it.description} onChange={(e) => update(it.id, { description: e.target.value })} placeholder="What does success look like? What is the approach?" />
              </div>
              <div className="space-y-1.5">
                <Label>Thrust area</Label>
                <Select value={it.thrustArea} onValueChange={(v) => update(it.id, { thrustArea: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {THRUST_AREAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Unit of Measure</Label>
                <Select value={it.uom} onValueChange={(v: UoM) => update(it.id, { uom: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Numeric","Percentage","Timeline","Zero-based"] as UoM[]).map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Direction</Label>
                <Select value={it.direction} onValueChange={(v: ScoreDirection) => update(it.id, { direction: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Max">Max — higher is better</SelectItem>
                    <SelectItem value="Min">Min — lower is better</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Target</Label>
                  <Input type="number" value={it.target} onChange={(e) => update(it.id, { target: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Weightage (%)</Label>
                  <Input type="number" min={10} max={100} value={it.weightage} onChange={(e) => update(it.id, { weightage: Number(e.target.value) })} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="border-border" onClick={addRow} disabled={items.length >= 8}>
        <Plus className="mr-1.5 h-4 w-4" /> Add goal
      </Button>
    </div>
  );
}
