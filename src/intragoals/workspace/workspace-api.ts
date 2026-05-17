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
} from "@/intragoals/workspace/store";
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
  metadata?: Record<string, unknown> | null;
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
  deleted_at?: string | null;
  deleted_by?: string | null;
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
  organization_id?: string | null;
  title: string;
  body: string;
  type: Notification["type"];
  read: boolean;
  deep_link?: string | null;
  sent_at?: string | null;
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

type GoalCycleRow = {
  id: string;
  name: string;
  year: number;
  status: string;
  opens_at: string | null;
  closes_at: string | null;
  checkin_windows: unknown;
};

type EscalationRuleRow = {
  id: string;
  name: string;
  trigger_type: string;
  threshold_days: number;
  chain: string[];
  enabled: boolean;
};

type IntegrationConnectionRow = {
  id: string;
  provider: string;
  status: string;
  config: Record<string, unknown> | null;
  last_synced_at: string | null;
};

export type CycleWindow = {
  id: string;
  name: string;
  start: string;
  end: string;
  status: "Closed" | "Active" | "Upcoming";
  detail?: string;
};

export type GoalCycleSettings = {
  id?: string;
  name: string;
  year: number;
  status: string;
  opensAt?: string | null;
  closesAt?: string | null;
  windows: CycleWindow[];
};

export type EscalationRuleSetting = {
  id?: string;
  name: string;
  triggerType: string;
  thresholdDays: number;
  chain: string[];
  enabled: boolean;
};

export type NotificationSettings = {
  inApp: boolean;
  email: boolean;
  teams: boolean;
  teamsWebhookUrl: string;
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
  if (
    typeof value === "object" &&
    "value" in value &&
    typeof (value as { value?: unknown }).value === "string"
  ) {
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

const defaultCycleWindows = (): CycleWindow[] => [
  {
    id: "goal-setting",
    name: "Goal setting",
    start: "2026-05-01",
    end: "2026-05-31",
    status: "Closed",
    detail: "Draft and submit goal sheets",
  },
  {
    id: "q1",
    name: "Q1 Check-in",
    start: "2026-07-01",
    end: "2026-07-21",
    status: "Closed",
    detail: "Review progress and blockers",
  },
  {
    id: "q2",
    name: "Q2 Check-in",
    start: "2026-10-01",
    end: "2026-10-21",
    status: "Closed",
    detail: "Mid-year calibration window",
  },
  {
    id: "q3",
    name: "Q3 Check-in",
    start: "2027-01-01",
    end: "2027-01-21",
    status: "Active",
    detail: "Current employee check-in window",
  },
  {
    id: "q4",
    name: "Q4 / Annual",
    start: "2027-03-15",
    end: "2027-04-15",
    status: "Upcoming",
    detail: "Final review and annual summary",
  },
];

const defaultEscalationRules = (): EscalationRuleSetting[] => [
  {
    name: "Goal submission overdue",
    triggerType: "goal_submission_overdue",
    thresholdDays: 10,
    chain: ["employee", "manager"],
    enabled: true,
  },
  {
    name: "Manager approval overdue",
    triggerType: "manager_approval_overdue",
    thresholdDays: 5,
    chain: ["manager", "hr_admin"],
    enabled: true,
  },
  {
    name: "Quarterly check-in incomplete",
    triggerType: "quarterly_checkin_incomplete",
    thresholdDays: 7,
    chain: ["employee", "manager", "hr_admin"],
    enabled: true,
  },
  {
    name: "Returned goal not resubmitted",
    triggerType: "returned_goal_stale",
    thresholdDays: 3,
    chain: ["employee", "manager", "skip_level"],
    enabled: true,
  },
];

const defaultNotificationSettings = (): NotificationSettings => ({
  inApp: true,
  email: true,
  teams: false,
  teamsWebhookUrl: "",
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
    throw new Error(
      "Your Supabase profile is missing an organization. Run the latest Supabase migration and sign in again.",
    );
  }

  return data.organization_id;
}

async function currentUserProfile() {
  const client = requireSupabase();
  const { data: authData } = await client.auth.getUser();
  if (!authData.user) throw new Error("No active Supabase session.");

  const { data, error } = await client
    .from("profiles")
    .select(
      "id, organization_id, manager_id, email, full_name, role, department, title, avatar_color, metadata",
    )
    .eq("id", authData.user.id)
    .maybeSingle<ProfileRow>();

  if (error) throw new Error(error.message);
  if (!data) {
    const bootstrapped = await bootstrapWorkspace();
    if (bootstrapped) return bootstrapped;
    throw new Error("Unable to load your workspace profile.");
  }

  return data;
}

export const workspaceApi = {
  isReady() {
    return isSupabaseConfigured;
  },

  async loadWorkspace(): Promise<WorkspaceSnapshot | null> {
    if (!isSupabaseConfigured) return null;
    const client = requireSupabase();

    await bootstrapWorkspace();

    const [{ data: profiles, error: profilesError }, { data: goals, error: goalsError }] =
      await Promise.all([
        client
          .from("profiles")
          .select(
            "id, organization_id, manager_id, email, full_name, role, department, title, avatar_color, metadata",
          )
          .order("full_name", { ascending: true }),
        client
          .from("goals")
          .select(
            "id, owner_id, title, description, thrust_area, uom, direction, target, weightage, status, is_shared, shared_from_owner_id, manager_comment, deleted_at, deleted_by, created_at, updated_at, quarterly_checkins(quarter, achievement, status, comment, manager_comment, submitted_at, reviewed_at)",
          )
          .is("deleted_at", null)
          .order("updated_at", { ascending: false }),
      ]);

    if (profilesError) throw new Error(profilesError.message);
    if (goalsError) throw new Error(goalsError.message);

    const [{ data: audit }, { data: notifications }, { data: escalations }] = await Promise.all([
      client
        .from("audit_logs")
        .select(
          "id, actor_id, actor_name, action, entity_type, entity_id, previous_value, new_value, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      client
        .from("notifications")
        .select("id, user_id, title, body, type, read, deep_link, created_at")
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
        deepLink: row.deep_link ?? undefined,
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

    const { data, error } = await client
      .from("goals")
      .upsert(payload)
      .select("id")
      .single<{ id: string }>();
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

  async softDeleteGoal(goalId: string) {
    if (!isSupabaseConfigured || !isUuid(goalId)) return;
    const { error } = await requireSupabase().rpc("soft_delete_goal", {
      goal_id_input: goalId,
    });
    if (error) throw new Error(error.message);
  },

  async setGoalStatus(goalId: string, status: GoalStatus, comment?: string) {
    if (!isSupabaseConfigured || !isUuid(goalId)) return;
    const client = requireSupabase();
    const actor = await currentUserProfile();
    const { data: goal, error: goalError } = await client
      .from("goals")
      .select("id, owner_id, title, status")
      .eq("id", goalId)
      .single<{ id: string; owner_id: string; title: string; status: GoalStatus }>();

    if (goalError) throw new Error(goalError.message);

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
      const { error: approvalError } = await client.from("approvals").insert({
        goal_id: goalId,
        approver_id: actor.id,
        action: status,
        comment: comment || null,
      });
      if (approvalError) throw new Error(approvalError.message);

      const notificationBody =
        status === "Approved"
          ? `${actor.full_name} approved your goal "${goal.title}".`
          : status === "Rejected"
            ? `${actor.full_name} rejected your goal "${goal.title}".`
            : `${actor.full_name} requested changes for your goal "${goal.title}".`;

      await this.createNotification({
        userId: goal.owner_id,
        title:
          status === "Approved"
            ? "Goal approved"
            : status === "Rejected"
              ? "Goal rejected"
              : "Goal returned for changes",
        body: comment ? `${notificationBody} ${comment}` : notificationBody,
        type: status === "Approved" ? "success" : status === "Rejected" ? "error" : "warning",
        deepLink: `/app/goals/${goalId}`,
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

  async markNotificationRead(notificationId: string, userId: string) {
    if (!isSupabaseConfigured || !isUuid(notificationId) || !isUuid(userId)) return;
    const { error } = await requireSupabase()
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  },

  async markAllNotificationsRead(userId: string) {
    if (!isSupabaseConfigured || !isUuid(userId)) return;
    const { error } = await requireSupabase()
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) throw new Error(error.message);
  },

  async createNotification(input: {
    userId: string;
    title: string;
    body: string;
    type: Notification["type"];
    deepLink?: string;
  }) {
    if (!isSupabaseConfigured || !isUuid(input.userId)) return;
    const profile = await currentUserProfile();
    const { error } = await requireSupabase()
      .from("notifications")
      .insert({
        organization_id: profile.organization_id,
        user_id: input.userId,
        title: input.title,
        body: input.body,
        type: input.type,
        deep_link: input.deepLink ?? null,
        read: false,
        sent_at: new Date().toISOString(),
      });
    if (error) throw new Error(error.message);
  },

  async createAudit(entry: Omit<AuditLog, "id" | "timestamp">) {
    if (!isSupabaseConfigured) return;
    const organizationId = await currentOrganizationId();
    const { error } = await requireSupabase()
      .from("audit_logs")
      .insert({
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

  async createGoalApprovalNotifications(goalId: string, goalTitle: string, actorName: string) {
    if (!isSupabaseConfigured || !isUuid(goalId)) return;
    const { error } = await requireSupabase().rpc("create_goal_approval_notifications", {
      goal_id_input: goalId,
      notification_title: "New goal approval request",
      notification_body: `${actorName} submitted "${goalTitle}" for your review.`,
      notification_type: "warning",
      notification_deep_link: "/app/approvals",
    });

    if (error) throw new Error(error.message);
  },

  async updateProfile(
    profileId: string,
    patch: {
      fullName?: string;
      department?: string;
      title?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    if (!isSupabaseConfigured || !isUuid(profileId)) return;
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (patch.fullName !== undefined) payload.full_name = patch.fullName;
    if (patch.department !== undefined) payload.department = patch.department;
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.metadata !== undefined) payload.metadata = patch.metadata;

    const { error } = await requireSupabase().from("profiles").update(payload).eq("id", profileId);
    if (error) throw new Error(error.message);
  },

  async loadGoalCycleSettings(): Promise<GoalCycleSettings> {
    if (!isSupabaseConfigured) {
      return {
        name: "FY26",
        year: 2026,
        status: "active",
        opensAt: "2026-05-01",
        closesAt: "2027-04-15",
        windows: defaultCycleWindows(),
      };
    }

    const organizationId = await currentOrganizationId();
    const { data, error } = await requireSupabase()
      .from("goal_cycles")
      .select("id, name, year, status, opens_at, closes_at, checkin_windows")
      .eq("organization_id", organizationId)
      .order("year", { ascending: false })
      .limit(1)
      .maybeSingle<GoalCycleRow>();

    if (error) throw new Error(error.message);
    if (!data) {
      return {
        name: "FY26",
        year: 2026,
        status: "active",
        opensAt: "2026-05-01",
        closesAt: "2027-04-15",
        windows: defaultCycleWindows(),
      };
    }

    return {
      id: data.id,
      name: data.name,
      year: data.year,
      status: data.status,
      opensAt: data.opens_at,
      closesAt: data.closes_at,
      windows: Array.isArray(data.checkin_windows)
        ? (data.checkin_windows as CycleWindow[])
        : defaultCycleWindows(),
    };
  },

  async saveGoalCycleSettings(settings: GoalCycleSettings) {
    if (!isSupabaseConfigured) return settings;
    const organizationId = await currentOrganizationId();
    const payload = {
      organization_id: organizationId,
      name: settings.name,
      year: settings.year,
      status: settings.status,
      opens_at: settings.opensAt ?? null,
      closes_at: settings.closesAt ?? null,
      checkin_windows: settings.windows,
    };

    const query = requireSupabase().from("goal_cycles");
    const result = settings.id
      ? await query.update(payload).eq("id", settings.id).select("id").single<{ id: string }>()
      : await query.insert(payload).select("id").single<{ id: string }>();
    if (result.error) throw new Error(result.error.message);
    return { ...settings, id: result.data.id };
  },

  async loadEscalationRules(): Promise<EscalationRuleSetting[]> {
    if (!isSupabaseConfigured) return defaultEscalationRules();
    const organizationId = await currentOrganizationId();
    const { data, error } = await requireSupabase()
      .from("escalation_rules")
      .select("id, name, trigger_type, threshold_days, chain, enabled")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    if (!data?.length) return defaultEscalationRules();
    return (data as unknown as EscalationRuleRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      triggerType: row.trigger_type,
      thresholdDays: row.threshold_days,
      chain: row.chain,
      enabled: row.enabled,
    }));
  },

  async saveEscalationRules(rules: EscalationRuleSetting[]) {
    if (!isSupabaseConfigured) return rules;
    const organizationId = await currentOrganizationId();
    const payload = rules.map((rule) => {
      const base = {
        organization_id: organizationId,
        name: rule.name,
        trigger_type: rule.triggerType,
        threshold_days: rule.thresholdDays,
        chain: rule.chain,
        enabled: rule.enabled,
      };
      return rule.id ? { id: rule.id, ...base } : base;
    });
    const { data, error } = await requireSupabase()
      .from("escalation_rules")
      .upsert(payload)
      .select("id, name, trigger_type, threshold_days, chain, enabled");
    if (error) throw new Error(error.message);
    return (data as unknown as EscalationRuleRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      triggerType: row.trigger_type,
      thresholdDays: row.threshold_days,
      chain: row.chain,
      enabled: row.enabled,
    }));
  },

  async createEscalationEvent(input: {
    ruleId?: string | null;
    ownerId: string;
    goalId?: string | null;
    reason: string;
    level: EscalationRow["level"];
  }) {
    if (!isSupabaseConfigured || !isUuid(input.ownerId)) return null;
    const organizationId = await currentOrganizationId();
    const { data, error } = await requireSupabase()
      .from("escalation_events")
      .insert({
        organization_id: organizationId,
        rule_id: input.ruleId ?? null,
        owner_id: input.ownerId,
        goal_id: input.goalId ?? null,
        reason: input.reason,
        level: input.level,
      })
      .select("id, reason, level, triggered_at, owner_id, resolved")
      .single<EscalationRow>();
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      reason: data.reason,
      level: escalationLevel(data.level),
      triggeredAt: data.triggered_at,
      ownerId: data.owner_id,
      resolved: data.resolved,
    };
  },

  async resolveEscalationEvent(id: string) {
    if (!isSupabaseConfigured || !isUuid(id)) return;
    const { error } = await requireSupabase()
      .from("escalation_events")
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async loadNotificationSettings(): Promise<NotificationSettings> {
    if (!isSupabaseConfigured) return defaultNotificationSettings();
    const profile = await currentUserProfile();
    const organizationId = await currentOrganizationId();
    const { data, error } = await requireSupabase()
      .from("integration_connections")
      .select("id, provider, status, config, last_synced_at")
      .eq("organization_id", organizationId)
      .in("provider", ["teams_webhook"]);
    if (error) throw new Error(error.message);

    const metadata = (profile.metadata ?? {}) as Record<string, unknown>;
    const notifications = (metadata.notifications ?? {}) as Record<string, unknown>;
    const teamsConnection = ((data ?? []) as unknown as IntegrationConnectionRow[]).find(
      (entry) => entry.provider === "teams_webhook",
    );
    return {
      inApp: notifications.inApp !== false,
      email: notifications.email !== false,
      teams: teamsConnection?.status === "active",
      teamsWebhookUrl:
        typeof teamsConnection?.config?.url === "string" ? teamsConnection.config.url : "",
    };
  },

  async saveNotificationSettings(settings: NotificationSettings) {
    if (!isSupabaseConfigured) return settings;
    const profile = await currentUserProfile();
    const metadata = {
      ...(profile.metadata ?? {}),
      notifications: {
        inApp: settings.inApp,
        email: settings.email,
      },
    };
    await this.updateProfile(profile.id, { metadata });

    const organizationId = await currentOrganizationId();
    const { error } = await requireSupabase()
      .from("integration_connections")
      .upsert({
        organization_id: organizationId,
        provider: "teams_webhook",
        status: settings.teams ? "active" : "disabled",
        config: {
          url: settings.teamsWebhookUrl,
        },
        last_synced_at: settings.teams ? new Date().toISOString() : null,
      });
    if (error) throw new Error(error.message);
    return settings;
  },
};
