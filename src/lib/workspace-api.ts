import type {
  AuditLog,
  CheckinStatus,
  Escalation,
  Goal,
  GoalStatus,
  Notification,
  Quarter,
  QuarterlyUpdate,
  Role,
  ScoreDirection,
  UoM,
  User,
} from "@/lib/store";
import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  organization_id: string | null;
  manager_id: string | null;
  email: string;
  full_name: string;
  role: Role;
  department: string | null;
  title: string | null;
  avatar_color: string | null;
};

type GoalRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  thrust_area: string;
  uom: UoM;
  direction: ScoreDirection;
  target: number | string;
  weightage: number | string;
  status: GoalStatus;
  is_shared: boolean | null;
  shared_from_owner_id: string | null;
  manager_comment: string | null;
  created_at: string;
  updated_at: string;
  quarterly_checkins?: CheckinRow[];
};

type CheckinRow = {
  quarter: Quarter;
  achievement: number | string | null;
  status: CheckinStatus;
  comment: string | null;
  manager_comment: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
};

type AuditRow = {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  previous_value: unknown;
  new_value: unknown;
  created_at: string;
};

type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: Notification["type"];
  read: boolean;
  created_at: string;
};

type EscalationRow = {
  id: string;
  reason: string;
  level: "employee" | "manager" | "skip_level" | "hr_admin";
  triggered_at: string;
  owner_id: string;
  resolved: boolean;
};

export type WorkspaceSnapshot = {
  people: User[];
  goals: Goal[];
  audit: AuditLog[];
  notifications: Notification[];
  escalations: Escalation[];
};

const quarters: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

const roleTitle: Record<Role, string> = {
  employee: "Employee",
  manager: "Manager",
  admin: "Admin / HR",
};

const roleColor: Record<Role, string> = {
  employee: "#00d8ff",
  manager: "#8438ff",
  admin: "#ff7a18",
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const numberValue = (value: number | string | null | undefined) => Number(value ?? 0);

const jsonValueToString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "value" in value && typeof (value as { value?: unknown }).value === "string") {
    return (value as { value: string }).value;
  }
  return JSON.stringify(value);
};

const profileToUser = (profile: ProfileRow): User => ({
  id: profile.id,
  organizationId: profile.organization_id,
  managerId: profile.manager_id,
  name: profile.full_name || profile.email,
  email: profile.email,
  role: profile.role,
  department: profile.department || "Intragoals",
  title: profile.title || roleTitle[profile.role],
  avatarColor: profile.avatar_color || roleColor[profile.role],
});

const rowToQuarter = (row: CheckinRow): QuarterlyUpdate => ({
  quarter: row.quarter,
  achievement: row.achievement === null ? null : numberValue(row.achievement),
  status: row.status,
  comment: row.comment || "",
  managerComment: row.manager_comment || undefined,
  submittedAt: row.submitted_at || undefined,
  reviewedAt: row.reviewed_at || undefined,
});

const normalizeQuarterly = (rows: CheckinRow[] = []): QuarterlyUpdate[] => {
  const byQuarter = new Map(rows.map((row) => [row.quarter, rowToQuarter(row)]));
  return quarters.map(
    (quarter) =>
      byQuarter.get(quarter) ?? {
        quarter,
        achievement: null,
        status: "Not Started",
        comment: "",
      },
  );
};

const goalRowToGoal = (row: GoalRow): Goal => ({
  id: row.id,
  ownerId: row.owner_id,
  title: row.title,
  description: row.description || "",
  thrustArea: row.thrust_area,
  uom: row.uom,
  direction: row.direction,
  target: numberValue(row.target),
  weightage: numberValue(row.weightage),
  status: row.status,
  isShared: Boolean(row.is_shared),
  sharedFromOwnerId: row.shared_from_owner_id || undefined,
  managerComment: row.manager_comment || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  quarterly: normalizeQuarterly(row.quarterly_checkins),
});

const escalationLevel = (level: EscalationRow["level"]): Escalation["level"] => {
  if (level === "hr_admin") return "HR/Admin";
  if (level === "skip_level") return "Skip-level";
  return "L1 Manager";
};

async function bootstrapWorkspace() {
  const client = requireSupabase();
  const { data, error } = await client.rpc("bootstrap_workspace", {
    workspace_name: null,
    workspace_domain: null,
  });

  if (error) {
    console.warn("Supabase workspace bootstrap failed:", error.message);
    return null;
  }

  return data as ProfileRow | null;
}

async function currentOrganizationId() {
  const client = requireSupabase();
  const { data: authData } = await client.auth.getUser();
  if (!authData.user) throw new Error("No active Supabase session.");

  const { data, error } = await client
    .from("profiles")
    .select("organization_id")
    .eq("id", authData.user.id)
    .maybeSingle<{ organization_id: string | null }>();

  if (error || !data?.organization_id) {
    const bootstrapped = await bootstrapWorkspace();
    if (bootstrapped?.organization_id) return bootstrapped.organization_id;
  }

  if (!data?.organization_id) {
    throw new Error("Your Supabase profile is missing an organization. Run the latest Supabase migration and sign in again.");
  }

  return data.organization_id;
}

export const workspaceApi = {
  isReady() {
    return isSupabaseConfigured;
  },

  async loadWorkspace(): Promise<WorkspaceSnapshot | null> {
    if (!isSupabaseConfigured) return null;
    const client = requireSupabase();

    await bootstrapWorkspace();

    const [{ data: profiles, error: profilesError }, { data: goals, error: goalsError }] = await Promise.all([
      client
        .from("profiles")
        .select("id, organization_id, manager_id, email, full_name, role, department, title, avatar_color")
        .order("full_name", { ascending: true }),
      client
        .from("goals")
        .select(
          "id, owner_id, title, description, thrust_area, uom, direction, target, weightage, status, is_shared, shared_from_owner_id, manager_comment, created_at, updated_at, quarterly_checkins(quarter, achievement, status, comment, manager_comment, submitted_at, reviewed_at)",
        )
        .order("updated_at", { ascending: false }),
    ]);

    if (profilesError) throw new Error(profilesError.message);
    if (goalsError) throw new Error(goalsError.message);

    const [{ data: audit }, { data: notifications }, { data: escalations }] = await Promise.all([
      client
        .from("audit_logs")
        .select("id, actor_id, actor_name, action, entity_type, entity_id, previous_value, new_value, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      client
        .from("notifications")
        .select("id, user_id, title, body, type, read, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      client
        .from("escalation_events")
        .select("id, reason, level, triggered_at, owner_id, resolved")
        .order("triggered_at", { ascending: false })
        .limit(100),
    ]);

    return {
      people: ((profiles ?? []) as unknown as ProfileRow[]).map(profileToUser),
      goals: ((goals ?? []) as unknown as GoalRow[]).map(goalRowToGoal),
      audit: ((audit ?? []) as unknown as AuditRow[]).map((row) => ({
        id: row.id,
        userId: row.actor_id || "",
        userName: row.actor_name,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        previousValue: jsonValueToString(row.previous_value),
        newValue: jsonValueToString(row.new_value),
        timestamp: row.created_at,
      })),
      notifications: ((notifications ?? []) as unknown as NotificationRow[]).map((row) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        body: row.body,
        type: row.type,
        read: row.read,
        createdAt: row.created_at,
      })),
      escalations: ((escalations ?? []) as unknown as EscalationRow[]).map((row) => ({
        id: row.id,
        reason: row.reason,
        level: escalationLevel(row.level),
        triggeredAt: row.triggered_at,
        ownerId: row.owner_id,
        resolved: row.resolved,
      })),
    };
  },

  async saveGoal(goal: Goal) {
    if (!isSupabaseConfigured) return goal.id;
    const client = requireSupabase();
    const organizationId = await currentOrganizationId();
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      organization_id: organizationId,
      owner_id: goal.ownerId,
      title: goal.title,
      description: goal.description,
      thrust_area: goal.thrustArea,
      uom: goal.uom,
      direction: goal.direction,
      target: goal.target,
      weightage: goal.weightage,
      status: goal.status,
      is_shared: Boolean(goal.isShared),
      shared_from_owner_id: goal.sharedFromOwnerId ?? null,
      manager_comment: goal.managerComment ?? null,
      updated_at: goal.updatedAt || now,
    };

    if (isUuid(goal.id)) payload.id = goal.id;

    const { data, error } = await client.from("goals").upsert(payload).select("id").single<{ id: string }>();
    if (error) throw new Error(error.message);

    const goalId = data?.id || goal.id;
    const checkins = goal.quarterly.map((quarter) => ({
      goal_id: goalId,
      quarter: quarter.quarter,
      achievement: quarter.achievement,
      status: quarter.status,
      comment: quarter.comment,
      manager_comment: quarter.managerComment ?? null,
      submitted_at: quarter.submittedAt ?? null,
      reviewed_at: quarter.reviewedAt ?? null,
    }));

    const { error: checkinError } = await client
      .from("quarterly_checkins")
      .upsert(checkins, { onConflict: "goal_id,quarter" });

    if (checkinError) throw new Error(checkinError.message);
    return goalId;
  },

  async setGoalStatus(goalId: string, status: GoalStatus, comment?: string) {
    if (!isSupabaseConfigured || !isUuid(goalId)) return;
    const client = requireSupabase();
    const { error } = await client
      .from("goals")
      .update({
        status,
        manager_comment: comment || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", goalId);

    if (error) throw new Error(error.message);

    if (status === "Approved" || status === "Rejected" || status === "Returned") {
      await client.from("approvals").insert({
        goal_id: goalId,
        action: status,
        comment: comment || null,
      });
    }
  },

  async updateQuarter(goalId: string, quarter: Quarter, patch: Partial<QuarterlyUpdate>) {
    if (!isSupabaseConfigured || !isUuid(goalId)) return;
    const client = requireSupabase();
    const { error } = await client.from("quarterly_checkins").upsert(
      {
        goal_id: goalId,
        quarter,
        achievement: patch.achievement ?? null,
        status: patch.status ?? "Not Started",
        comment: patch.comment ?? "",
        manager_comment: patch.managerComment ?? null,
        submitted_at: patch.submittedAt ?? null,
        reviewed_at: patch.reviewedAt ?? null,
      },
      { onConflict: "goal_id,quarter" },
    );

    if (error) throw new Error(error.message);
  },

  async markNotificationsRead(userId: string) {
    if (!isSupabaseConfigured || !isUuid(userId)) return;
    const { error } = await requireSupabase().from("notifications").update({ read: true }).eq("user_id", userId);
    if (error) throw new Error(error.message);
  },

  async createAudit(entry: Omit<AuditLog, "id" | "timestamp">) {
    if (!isSupabaseConfigured) return;
    const organizationId = await currentOrganizationId();
    const { error } = await requireSupabase().from("audit_logs").insert({
      organization_id: organizationId,
      actor_id: isUuid(entry.userId) ? entry.userId : null,
      actor_name: entry.userName,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      previous_value: entry.previousValue ? { value: entry.previousValue } : null,
      new_value: entry.newValue ? { value: entry.newValue } : null,
    });
    if (error) throw new Error(error.message);
  },
};
