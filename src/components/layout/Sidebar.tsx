import { Link, useLocation } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Logo } from "@/components/brand/Logo";
import {
  LayoutDashboard,
  Target,
  PlusCircle,
  CheckSquare,
  Users,
  Share2,
  CalendarCheck,
  BarChart3,
  Bell,
  ScrollText,
  Settings,
  ShieldCheck,
  Building2,
  CalendarRange,
  ListChecks,
  AlertTriangle,
  FileBarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const employeeNav: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/goals", label: "My Goals", icon: Target },
  { to: "/app/goals/new", label: "Create Goal Sheet", icon: PlusCircle },
  { to: "/app/checkins", label: "Check-ins", icon: CalendarCheck },
  { to: "/app/shared", label: "Shared Goals", icon: Share2 },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
];

const managerNav: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/team", label: "My Team", icon: Users },
  { to: "/app/approvals", label: "Approvals", icon: CheckSquare },
  { to: "/app/checkins", label: "Check-ins", icon: CalendarCheck },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
];

const adminNav: NavItem[] = [
  { to: "/app/admin", label: "Admin Dashboard", icon: ShieldCheck },
  { to: "/app/admin/users", label: "User Management", icon: Users },
  { to: "/app/admin/departments", label: "Departments", icon: Building2 },
  { to: "/app/admin/cycles", label: "Cycle Management", icon: CalendarRange },
  { to: "/app/admin/shared-kpis", label: "Shared KPIs", icon: ListChecks },
  { to: "/app/admin/escalations", label: "Escalation Rules", icon: AlertTriangle },
  { to: "/app/audit", label: "Audit Logs", icon: ScrollText },
  { to: "/app/reports", label: "Reports Export", icon: FileBarChart },
  { to: "/app/settings", label: "System Settings", icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const user = useApp((s) => s.user);
  const location = useLocation();
  const role = user?.role ?? "employee";
  const items = role === "admin" ? adminNav : role === "manager" ? managerNav : employeeNav;

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-white">
      <div className="border-b border-sidebar-border px-5 py-5">
        <Link to="/" className="block">
          <Logo withTagline />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {role === "admin" ? "Administration" : role === "manager" ? "Manager Workspace" : "My Workspace"}
        </div>
        <ul className="space-y-1">
          {items.map((it) => {
            const active = location.pathname === it.to || (it.to !== "/app/dashboard" && location.pathname.startsWith(it.to));
            const Icon = it.icon;
            return (
              <li key={it.to}>
                <Link
                  to={it.to}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-cyan-50 text-[color:var(--brand-purple)] ring-1 ring-[color:var(--brand-purple)]/20"
                      : "text-muted-foreground hover:bg-slate-50 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{it.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {role !== "admin" && (
          <div className="mt-6">
            <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Account
            </div>
            <ul className="space-y-1">
              <li>
                <Link
                  to="/app/settings"
                  onClick={onNavigate}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-slate-50 hover:text-foreground"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </li>
              <li>
                <Link
                  to="/app/audit"
                  onClick={onNavigate}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-slate-50 hover:text-foreground"
                >
                  <ScrollText className="h-4 w-4" /> Audit Log
                </Link>
              </li>
            </ul>
          </div>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg border border-[color:var(--brand-cyan)]/25 bg-cyan-50/70 p-3">
          <div className="text-xs text-muted-foreground">Cycle</div>
          <div className="mt-1 text-sm font-medium">FY 2026 · Q3</div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-white">
            <div className="h-full rounded-full bg-brand-gradient" style={{ width: "62%" }} />
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">62% of cycle complete</div>
        </div>
      </div>
    </aside>
  );
}
