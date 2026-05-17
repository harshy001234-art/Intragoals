import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "employee" | "manager" | "admin";

export interface User {
  id: string;
  organizationId?: string | null;
  managerId?: string | null;
  name: string;
  email: string;
  role: Role;
  department: string;
  title: string;
  avatarColor: string;
}

export type UoM = "Numeric" | "Percentage" | "Timeline" | "Zero-based";
export type ScoreDirection = "Min" | "Max";
export type GoalStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Returned"
  | "Locked";
export type CheckinStatus = "Not Started" | "On Track" | "Completed";
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

export interface QuarterlyUpdate {
  quarter: Quarter;
  achievement: number | null;
  status: CheckinStatus;
  comment: string;
  managerComment?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface Goal {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  thrustArea: string;
  uom: UoM;
  direction: ScoreDirection;
  target: number;
  weightage: number;
  status: GoalStatus;
  isShared?: boolean;
  sharedFromOwnerId?: string;
  managerComment?: string;
  createdAt: string;
  updatedAt: string;
  quarterly: QuarterlyUpdate[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  deepLink?: string;
  createdAt: string;
}

export interface Escalation {
  id: string;
  reason: string;
  level: "L1 Manager" | "HR/Admin" | "Skip-level";
  triggeredAt: string;
  ownerId: string;
  resolved: boolean;
}

const createLoggedOutState = () => ({
  isAuthed: false,
  authSource: "none" as const,
  user: null,
  people: DEMO_PEOPLE,
  goals: seedGoals(),
  audit: seedAudit(),
  notifications: seedNotifications(),
  escalations: seedEscalations(),
  workspaceLoadedAt: null,
});

export const DEMO_USERS: Record<Role, User> = {
  employee: {
    id: "u-emp-1",
    organizationId: "org-demo-1",
    managerId: "u-mgr-1",
    name: "Neha Sharma",
    email: "neha.sharma@intragoals.com",
    role: "employee",
    department: "Product Engineering",
    title: "Software Engineer II",
    avatarColor: "#00d8ff",
  },
  manager: {
    id: "u-mgr-1",
    organizationId: "org-demo-1",
    name: "Priya Iyer",
    email: "priya.iyer@intragoals.com",
    role: "manager",
    department: "Product Engineering",
    title: "Engineering Manager",
    avatarColor: "#8438ff",
  },
  admin: {
    id: "u-adm-1",
    organizationId: "org-demo-1",
    name: "Rohan Kapoor",
    email: "rohan.kapoor@intragoals.com",
    role: "admin",
    department: "People & Culture",
    title: "HR Operations Lead",
    avatarColor: "#ff7a18",
  },
};

export const TEAM_MEMBERS: User[] = [
  DEMO_USERS.employee,
  {
    id: "u-emp-2",
    organizationId: "org-demo-1",
    managerId: "u-mgr-1",
    name: "Karthik Rao",
    email: "karthik.rao@intragoals.com",
    role: "employee",
    department: "Product Engineering",
    title: "Software Engineer III",
    avatarColor: "#19d88f",
  },
];

const DEMO_PEOPLE: User[] = [...TEAM_MEMBERS, DEMO_USERS.manager, DEMO_USERS.admin];

export const THRUST_AREAS = [
  "Product Excellence",
  "Customer Success",
  "Operational Efficiency",
  "People & Culture",
  "Innovation & R&D",
  "Revenue Growth",
  "Compliance & Risk",
];

const now = () => new Date().toISOString();

const seedGoals = (): Goal[] => [
  {
    id: "g-1",
    ownerId: "u-emp-1",
    title: "Raise release success rate to 98%",
    description:
      "Stabilize deployment checks and release handoff so weekly releases complete without rollback.",
    thrustArea: "Product Excellence",
    uom: "Percentage",
    direction: "Max",
    target: 98,
    weightage: 40,
    status: "Approved",
    createdAt: now(),
    updatedAt: now(),
    quarterly: [
      {
        quarter: "Q1",
        achievement: 92,
        status: "On Track",
        comment: "Release checklist adopted across the squad.",
      },
      { quarter: "Q2", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q3", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q4", achievement: null, status: "Not Started", comment: "" },
    ],
  },
  {
    id: "g-2",
    ownerId: "u-emp-1",
    title: "Reduce onboarding setup time by 25%",
    description:
      "Document setup blockers and automate the slowest local environment steps for new joiners.",
    thrustArea: "Operational Efficiency",
    uom: "Percentage",
    direction: "Max",
    target: 25,
    weightage: 30,
    status: "Pending Approval",
    createdAt: now(),
    updatedAt: now(),
    quarterly: [
      { quarter: "Q1", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q2", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q3", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q4", achievement: null, status: "Not Started", comment: "" },
    ],
  },
  {
    id: "g-3",
    ownerId: "u-emp-1",
    title: "Ship approval audit trail exports",
    description: "Add export-ready approval history for people reviews and compliance requests.",
    thrustArea: "Compliance & Risk",
    uom: "Timeline",
    direction: "Min",
    target: 100,
    weightage: 30,
    status: "Pending Approval",
    createdAt: now(),
    updatedAt: now(),
    quarterly: [
      { quarter: "Q1", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q2", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q3", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q4", achievement: null, status: "Not Started", comment: "" },
    ],
  },
  {
    id: "g-4",
    ownerId: "u-emp-2",
    title: "Increase regression automation coverage to 70%",
    description: "Convert the highest-risk regression paths into stable automated checks.",
    thrustArea: "Product Excellence",
    uom: "Percentage",
    direction: "Max",
    target: 70,
    weightage: 55,
    status: "Approved",
    createdAt: now(),
    updatedAt: now(),
    quarterly: [
      {
        quarter: "Q1",
        achievement: 48,
        status: "On Track",
        comment: "Critical smoke flows are now automated.",
      },
      { quarter: "Q2", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q3", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q4", achievement: null, status: "Not Started", comment: "" },
    ],
  },
  {
    id: "g-5",
    ownerId: "u-emp-2",
    title: "Cut flaky test reruns by 40%",
    description: "Stabilize the noisiest suites and reduce manual reruns during release weeks.",
    thrustArea: "Operational Efficiency",
    uom: "Percentage",
    direction: "Max",
    target: 40,
    weightage: 45,
    status: "Pending Approval",
    createdAt: now(),
    updatedAt: now(),
    quarterly: [
      { quarter: "Q1", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q2", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q3", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q4", achievement: null, status: "Not Started", comment: "" },
    ],
  },
  {
    id: "g-6",
    ownerId: "u-mgr-1",
    title: "Complete Q2 team goal calibration",
    description: "Finalize clean, balanced goal sheets for the Product Engineering team.",
    thrustArea: "People & Culture",
    uom: "Percentage",
    direction: "Max",
    target: 100,
    weightage: 100,
    status: "Approved",
    createdAt: now(),
    updatedAt: now(),
    quarterly: [
      { quarter: "Q1", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q2", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q3", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q4", achievement: null, status: "Not Started", comment: "" },
    ],
  },
  {
    id: "g-7",
    ownerId: "u-emp-1",
    title: "Improve sprint predictability to 85%",
    description:
      "Shared KPI from Product Engineering for delivery planning consistency across the quarter.",
    thrustArea: "Operational Efficiency",
    uom: "Percentage",
    direction: "Max",
    target: 85,
    weightage: 15,
    status: "Approved",
    isShared: true,
    sharedFromOwnerId: "u-mgr-1",
    createdAt: now(),
    updatedAt: now(),
    quarterly: [
      {
        quarter: "Q1",
        achievement: 72,
        status: "On Track",
        comment: "Velocity planning baseline established.",
      },
      { quarter: "Q2", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q3", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q4", achievement: null, status: "Not Started", comment: "" },
    ],
  },
  {
    id: "g-8",
    ownerId: "u-emp-2",
    title: "Bring escaped defect count below 3 per release",
    description:
      "Shared quality KPI pushed by the manager to keep release hygiene visible across the team.",
    thrustArea: "Product Excellence",
    uom: "Numeric",
    direction: "Min",
    target: 3,
    weightage: 10,
    status: "Approved",
    isShared: true,
    sharedFromOwnerId: "u-mgr-1",
    createdAt: now(),
    updatedAt: now(),
    quarterly: [
      {
        quarter: "Q1",
        achievement: 4,
        status: "On Track",
        comment: "Release QA checklist now mandatory.",
      },
      { quarter: "Q2", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q3", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q4", achievement: null, status: "Not Started", comment: "" },
    ],
  },
];

const seedAudit = (): AuditLog[] => [
  {
    id: "a-1",
    userId: "u-emp-1",
    userName: "Neha Sharma",
    action: "Submitted goal for approval",
    entityType: "Goal",
    entityId: "g-2",
    previousValue: "Draft",
    newValue: "Pending Approval",
    timestamp: now(),
  },
  {
    id: "a-2",
    userId: "u-mgr-1",
    userName: "Priya Iyer",
    action: "Approved goal",
    entityType: "Goal",
    entityId: "g-1",
    previousValue: "Pending Approval",
    newValue: "Approved",
    timestamp: now(),
  },
  {
    id: "a-3",
    userId: "u-adm-1",
    userName: "Rohan Kapoor",
    action: "Published shared KPI",
    entityType: "Goal",
    entityId: "g-7",
    previousValue: "Private manager KPI",
    newValue: "Shared with Product Engineering",
    timestamp: now(),
  },
];

const seedNotifications = (): Notification[] => [];

const seedEscalations = (): Escalation[] => [];

interface AppState {
  isAuthed: boolean;
  authSource: "none" | "account" | "sample";
  user: User | null;
  people: User[];
  goals: Goal[];
  audit: AuditLog[];
  notifications: Notification[];
  escalations: Escalation[];
  workspaceLoadedAt: string | null;
  login: (role: Role) => void;
  setAuthUser: (user: User) => void;
  setWorkspaceData: (data: {
    people: User[];
    goals: Goal[];
    audit: AuditLog[];
    notifications: Notification[];
    escalations: Escalation[];
  }) => void;
  logout: () => void;
  switchRole: (role: Role) => void;
  upsertGoal: (g: Goal) => void;
  removeGoal: (id: string) => void;
  setGoalStatus: (id: string, status: GoalStatus, comment?: string) => void;
  updateQuarter: (goalId: string, quarter: Quarter, patch: Partial<QuarterlyUpdate>) => void;
  upsertUser: (user: User) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  addNotification: (notification: Notification) => void;
  addEscalations: (items: Escalation[]) => void;
  resolveEscalation: (id: string) => void;
  pushAudit: (entry: Omit<AuditLog, "id" | "timestamp">) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthed: false,
      authSource: "none",
      user: null,
      people: DEMO_PEOPLE,
      goals: seedGoals(),
      audit: seedAudit(),
      notifications: seedNotifications(),
      escalations: seedEscalations(),
      workspaceLoadedAt: null,
      login: (role) =>
        set({
          isAuthed: true,
          authSource: "sample",
          user: DEMO_USERS[role],
          people: DEMO_PEOPLE,
          goals: seedGoals(),
          audit: seedAudit(),
          notifications: seedNotifications(),
          escalations: seedEscalations(),
          workspaceLoadedAt: null,
        }),
      setAuthUser: (user) =>
        set((s) => ({
          isAuthed: true,
          authSource: "account",
          user,
          people: [user, ...s.people.filter((p) => p.id !== user.id && p.email !== user.email)],
        })),
      setWorkspaceData: (data) =>
        set((s) => {
          const people = data.people.length ? data.people : s.user ? [s.user] : [];
          const refreshedUser = s.user
            ? (people.find((person) => person.id === s.user?.id) ?? s.user)
            : null;

          return {
            user: refreshedUser,
            people,
            goals: data.goals,
            audit: data.audit,
            notifications: data.notifications,
            escalations: data.escalations,
            workspaceLoadedAt: now(),
          };
        }),
      logout: () => set(createLoggedOutState()),
      switchRole: (role) =>
        set({ isAuthed: true, authSource: "sample", user: DEMO_USERS[role], people: DEMO_PEOPLE }),
      upsertGoal: (g) =>
        set((s) => {
          const idx = s.goals.findIndex((x) => x.id === g.id);
          const goals = [...s.goals];
          if (idx >= 0) goals[idx] = g;
          else goals.unshift(g);
          return { goals };
        }),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      setGoalStatus: (id, status, comment) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id
              ? { ...g, status, managerComment: comment ?? g.managerComment, updatedAt: now() }
              : g,
          ),
        })),
      updateQuarter: (goalId, quarter, patch) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  quarterly: g.quarterly.map((q) =>
                    q.quarter === quarter ? { ...q, ...patch } : q,
                  ),
                  updatedAt: now(),
                }
              : g,
          ),
        })),
      upsertUser: (user) =>
        set((s) => ({
          user: s.user?.id === user.id ? user : s.user,
          people: s.people.some((person) => person.id === user.id)
            ? s.people.map((person) => (person.id === user.id ? user : person))
            : [...s.people, user],
        })),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllNotificationsRead: (userId) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.userId === userId ? { ...n, read: true } : n,
          ),
        })),
      addNotification: (notification) =>
        set((s) => ({
          notifications: [
            notification,
            ...s.notifications.filter((item) => item.id !== notification.id),
          ],
        })),
      addEscalations: (items) =>
        set((s) => ({
          escalations: [
            ...items,
            ...s.escalations.filter(
              (existing) => !items.some((incoming) => incoming.id === existing.id),
            ),
          ],
        })),
      resolveEscalation: (id) =>
        set((s) => ({
          escalations: s.escalations.map((item) =>
            item.id === id ? { ...item, resolved: true } : item,
          ),
        })),
      pushAudit: (entry) =>
        set((s) => ({
          audit: [
            { ...entry, id: `a-${Math.random().toString(36).slice(2, 9)}`, timestamp: now() },
            ...s.audit,
          ],
        })),
    }),
    {
      name: "intragoals-state-v2",
      partialize: (s) => ({
        isAuthed: s.isAuthed,
        authSource: s.authSource,
        user: s.user,
        people: s.people,
        goals: s.goals,
        audit: s.audit,
        notifications: s.notifications,
        escalations: s.escalations,
        workspaceLoadedAt: s.workspaceLoadedAt,
      }),
    },
  ),
);

export function clearPersistedAppState() {
  useApp.persist.clearStorage();
  useApp.setState(createLoggedOutState());
}

// ---------- Score engine ----------
export const scoreForGoal = (g: Goal): number => {
  // Average across quarters with achievement; if none, 0
  const quarters = g.quarterly.filter((q) => q.achievement !== null);
  if (quarters.length === 0) return 0;
  const scores = quarters.map((q) => quarterScore(g, q.achievement as number));
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
};

export const quarterScore = (g: Goal, achievement: number): number => {
  const t = g.target;
  if (g.uom === "Zero-based") return achievement === 0 ? 100 : 0;
  if (g.uom === "Timeline")
    return Math.max(0, Math.min(100, Math.round((achievement / 100) * 100)));
  if (t === 0) return 0;
  const ratio = g.direction === "Max" ? achievement / t : t / Math.max(achievement, 0.0001);
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
};

export const overallScore = (goals: Goal[]): number => {
  const totalWeight = goals.reduce((a, g) => a + g.weightage, 0) || 100;
  const weighted = goals.reduce((a, g) => a + scoreForGoal(g) * (g.weightage / 100), 0);
  // Normalize if weights don't sum to 100
  return Math.round((weighted * 100) / totalWeight);
};

export const userById = (id: string): User | undefined =>
  useApp.getState().people.find((u) => u.id === id) ?? DEMO_PEOPLE.find((u) => u.id === id);
