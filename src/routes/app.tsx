import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useApp } from "@/lib/store";
import { authApi } from "@/lib/api";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    // Allow demo: rely on store hydration on client. We won't redirect server-side.
  },
  component: AppShell,
});

function AppShell() {
  const isAuthed = useApp((s) => s.isAuthed);
  const setAuthUser = useApp((s) => s.setAuthUser);
  const navigate = useNavigate();
  const [checking, setChecking] = useState(!isAuthed);

  useEffect(() => {
    if (isAuthed) return;
    authApi
      .me()
      .then(setAuthUser)
      .catch(() => navigate({ to: "/login" }))
      .finally(() => setChecking(false));
  }, [isAuthed, navigate, setAuthUser]);

  if (!isAuthed && checking) return null;
  if (!isAuthed) return null;

  return (
    <div className="flex min-h-screen bg-[#f7f9ff]">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}

import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Target, CalendarCheck, Bell, Users } from "lucide-react";
import { cn } from "@/lib/utils";

function MobileTabBar() {
  const loc = useLocation();
  const role = useApp((s) => s.user?.role) ?? "employee";
  const items = role === "admin"
    ? [
        { to: "/app/admin", label: "Admin", icon: LayoutDashboard },
        { to: "/app/admin/users", label: "Users", icon: Users },
        { to: "/app/audit", label: "Audit", icon: CalendarCheck },
        { to: "/app/notifications", label: "Alerts", icon: Bell },
      ]
    : role === "manager"
    ? [
        { to: "/app/dashboard", label: "Home", icon: LayoutDashboard },
        { to: "/app/team", label: "Team", icon: Users },
        { to: "/app/approvals", label: "Approvals", icon: Target },
        { to: "/app/notifications", label: "Alerts", icon: Bell },
      ]
    : [
        { to: "/app/dashboard", label: "Home", icon: LayoutDashboard },
        { to: "/app/goals", label: "Goals", icon: Target },
        { to: "/app/checkins", label: "Check-ins", icon: CalendarCheck },
        { to: "/app/notifications", label: "Alerts", icon: Bell },
      ];
  return (
    <nav className="sticky bottom-0 z-30 grid grid-cols-4 border-t border-border bg-white/95 shadow-[0_-12px_30px_-24px_rgba(15,23,42,0.6)] backdrop-blur md:hidden">
      {items.map((it) => {
        const active = loc.pathname === it.to || loc.pathname.startsWith(it.to + "/");
        const Icon = it.icon;
        return (
          <Link key={it.to} to={it.to} className={cn("flex flex-col items-center gap-0.5 py-2 text-[10px]", active ? "text-foreground" : "text-muted-foreground")}>
            <Icon className={cn("h-4 w-4", active && "text-[color:var(--brand-purple)]")} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
