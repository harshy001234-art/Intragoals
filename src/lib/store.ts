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

export const DEMO_USERS: Record<Role, User> = {
  employee: {
    id: "u-emp-1",
    name: "Aarav Mehta",
    email: "aarav.mehta@intragoals.com",
    role: "employee",
    department: "Product Engineering",
    title: "Senior Software Engineer",
    avatarColor: "#00d8ff",
  },
  manager: {
    id: "u-mgr-1",
    name: "Priya Iyer",
    email: "priya.iyer@intragoals.com",
    role: "manager",
    department: "Product Engineering",
    title: "Engineering Manager",
    avatarColor: "#8438ff",
  },
  admin: {
    id: "u-adm-1",
    name: "Rohan Kapoor",
    email: "rohan.kapoor@intragoals.com",
    role: "admin",
    department: "People & Culture",
    title: "Head of HR Operations",
    avatarColor: "#ff7a18",
  },
};

export const TEAM_MEMBERS: User[] = [
  DEMO_USERS.employee,
  {
    id: "u-emp-2",
    name: "Neha Sharma",
    email: "neha.sharma@intragoals.com",
    role: "employee",
    department: "Product Engineering",
    title: "Software Engineer II",
    avatarColor: "#19d88f",
  },
  {
    id: "u-emp-3",
    name: "Karthik Rao",
    email: "karthik.rao@intragoals.com",
    role: "employee",
    department: "Product Engineering",
    title: "Software Engineer III",
    avatarColor: "#ff2dbb",
  },
  {
    id: "u-emp-4",
    name: "Diya Banerjee",
    email: "diya.banerjee@intragoals.com",
    role: "employee",
    department: "Product Engineering",
    title: "QA Engineer",
    avatarColor: "#ffd43d",
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
    title: "Reduce P95 API latency by 30%",
    description:
      "Profile critical endpoints, introduce caching, and optimize Postgres queries to bring P95 below 180ms.",
    thrustArea: "Product Excellence",
    uom: "Percentage",
    direction: "Max",
    target: 30,
    weightage: 25,
    status: "Approved",
    createdAt: now(),
    updatedAt: now(),
    quarterly: [
      { quarter: "Q1", achievement: 12, status: "On Track", comment: "Caching layer shipped." },
      { quarter: "Q2", achievement: 22, status: "On Track", comment: "Query plan optimizations." },
      { quarter: "Q3", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q4", achievement: null, status: "Not Started", comment: "" },
    ],
  },
  {
    id: "g-2",
    ownerId: "u-emp-1",
    title: "Lead 2 cross-functional initiatives",
    description:
      "Drive design-engineering alignment on the new approvals module and onboarding redesign.",
    thrustArea: "People & Culture",
    uom: "Numeric",
    direction: "Max",
    target: 2,
    weightage: 15,
    status: "Approved",
    createdAt: now(),
    updatedAt: now(),
    quarterly: [
      { quarter: "Q1", achievement: 1, status: "On Track", comment: "Approvals kickoff done." },
      { quarter: "Q2", achievement: 1, status: "On Track", comment: "" },
      { quarter: "Q3", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q4", achievement: null, status: "Not Started", comment: "" },
    ],
  },
  {
    id: "g-3",
    ownerId: "u-emp-1",
    title: "Zero critical security incidents",
    description: "Maintain a clean security posture across owned services for the year.",
    thrustArea: "Compliance & Risk",
    uom: "Zero-based",
    direction: "Min",
    target: 0,
    weightage: 20,
    status: "Approved",
    isShared: true,
    sharedFromOwnerId: "u-adm-1",
    createdAt: now(),
    updatedAt: now(),
    quarterly: [
      { quarter: "Q1", achievement: 0, status: "On Track", comment: "" },
      { quarter: "Q2", achievement: 0, status: "On Track", comment: "" },
      { quarter: "Q3", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q4", achievement: null, status: "Not Started", comment: "" },
    ],
  },
  {
    id: "g-4",
    ownerId: "u-emp-1",
    title: "Ship Goals API v2 by Sept 30",
    description: "Deliver the v2 contract with shared-goal sync and audit log streaming.",
    thrustArea: "Innovation & R&D",
    uom: "Timeline",
    direction: "Min",
    target: 100,
    weightage: 20,
    status: "Pending Approval",
    createdAt: now(),
    updatedAt: now(),
    quarterly: [
      { quarter: "Q1", achievement: 25, status: "On Track", comment: "" },
      { quarter: "Q2", achievement: 55, status: "On Track", comment: "" },
      { quarter: "Q3", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q4", achievement: null, status: "Not Started", comment: "" },
    ],
  },
  {
    id: "g-5",
    ownerId: "u-emp-1",
    title: "Mentor 3 junior engineers",
    description: "Run weekly 1:1s and a quarterly skill review for each mentee.",
    thrustArea: "People & Culture",
    uom: "Numeric",
    direction: "Max",
    target: 3,
    weightage: 20,
    status: "Approved",
    createdAt: now(),
    updatedAt: now(),
    quarterly: [
      { quarter: "Q1", achievement: 3, status: "Completed", comment: "All onboarded." },
      { quarter: "Q2", achievement: 3, status: "On Track", comment: "" },
      { quarter: "Q3", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q4", achievement: null, status: "Not Started", comment: "" },
    ],
  },
  // Goals for other team members
  {
    id: "g-6",
    ownerId: "u-emp-2",
    title: "Improve frontend Lighthouse score to 95+",
    description: "Audit core flows and improve LCP/CLS across the app.",
    thrustArea: "Product Excellence",
    uom: "Numeric",
    direction: "Max",
    target: 95,
    weightage: 30,
    status: "Pending Approval",
    createdAt: now(),
    updatedAt: now(),
    quarterly: [
      { quarter: "Q1", achievement: 78, status: "On Track", comment: "" },
      { quarter: "Q2", achievement: 88, status: "On Track", comment: "" },
      { quarter: "Q3", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q4", achievement: null, status: "Not Started", comment: "" },
    ],
  },
  {
    id: "g-7",
    ownerId: "u-emp-3",
    title: "Reduce production incidents by 40%",
    description: "Improve alerting, runbooks, and on-call rotation hygiene.",
    thrustArea: "Operational Efficiency",
    uom: "Percentage",
    direction: "Max",
    target: 40,
    weightage: 35,
    status: "Pending Approval",
    createdAt: now(),
    updatedAt: now(),
    quarterly: [
      { quarter: "Q1", achievement: 18, status: "On Track", comment: "" },
      { quarter: "Q2", achievement: 28, status: "On Track", comment: "" },
      { quarter: "Q3", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q4", achievement: null, status: "Not Started", comment: "" },
    ],
  },
  {
    id: "g-8",
    ownerId: "u-emp-4",
    title: "Automate 80% of regression suite",
    description: "Convert manual regression scripts to Playwright suites.",
    thrustArea: "Product Excellence",
    uom: "Percentage",
    direction: "Max",
    target: 80,
    weightage: 30,
    status: "Approved",
    createdAt: now(),
    updatedAt: now(),
    quarterly: [
      { quarter: "Q1", achievement: 35, status: "On Track", comment: "" },
      { quarter: "Q2", achievement: 60, status: "On Track", comment: "" },
      { quarter: "Q3", achievement: null, status: "Not Started", comment: "" },
      { quarter: "Q4", achievement: null, status: "Not Started", comment: "" },
    ],
  },
];

const seedAudit = (): AuditLog[] => [
  {
    id: "a-1",
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
    id: "a-2",
    userId: "u-emp-1",
    userName: "Aarav Mehta",
    action: "Submitted Q2 check-in",
    entityType: "QuarterlyUpdate",
    entityId: "g-1:Q2",
    previousValue: "12",
    newValue: "22",
    timestamp: now(),
  },
  {
    id: "a-3",
    userId: "u-adm-1",
    userName: "Rohan Kapoor",
    action: "Pushed shared KPI",
    entityType: "SharedGoal",
    entityId: "g-3",
    newValue: "All Engineering",
    timestamp: now(),
  },
];

const seedNotifications = (): Notification[] => [
  {
    id: "n-1",
    userId: "u-emp-1",
    title: "Goal approved",
    body: "Priya Iyer approved your goal: Reduce P95 API latency by 30%.",
    type: "success",
    read: false,
    createdAt: now(),
  },
  {
    id: "n-2",
    userId: "u-emp-1",
    title: "Q3 check-in window opens July 1",
    body: "Plan your Q3 check-in submissions in advance.",
    type: "info",
    read: false,
    createdAt: now(),
  },
  {
    id: "n-3",
    userId: "u-mgr-1",
    title: "2 goals pending approval",
    body: "Neha Sharma and Karthik Rao submitted goals.",
    type: "warning",
    read: false,
    createdAt: now(),
  },
];

const seedEscalations = (): Escalation[] => [
  {
    id: "e-1",
    reason: "Q2 check-in not completed within 7 days of window close",
    level: "L1 Manager",
    triggeredAt: now(),
    ownerId: "u-emp-3",
    resolved: false,
  },
  {
    id: "e-2",
    reason: "Goals pending approval > 5 days",
    level: "HR/Admin",
    triggeredAt: now(),
    ownerId: "u-emp-2",
    resolved: false,
  },
];

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
  markNotificationsRead: () => void;
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
        set((s) => ({
          people: data.people.length
            ? data.people
            : s.user
              ? [s.user]
              : [],
          goals: data.goals,
          audit: data.audit,
          notifications: data.notifications,
          escalations: data.escalations,
          workspaceLoadedAt: now(),
        })),
      logout: () => set({ isAuthed: false, authSource: "none", user: null }),
      switchRole: (role) => set({ isAuthed: true, authSource: "sample", user: DEMO_USERS[role], people: DEMO_PEOPLE }),
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
            g.id === id ? { ...g, status, managerComment: comment ?? g.managerComment, updatedAt: now() } : g,
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
      markNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      pushAudit: (entry) =>
        set((s) => ({
          audit: [
            { ...entry, id: `a-${Math.random().toString(36).slice(2, 9)}`, timestamp: now() },
            ...s.audit,
          ],
        })),
    }),
    {
      name: "intragoals-state",
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
  if (g.uom === "Timeline") return Math.max(0, Math.min(100, Math.round((achievement / 100) * 100)));
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
  useApp.getState().people.find((u) => u.id === id) ??
  DEMO_PEOPLE.find((u) => u.id === id);
