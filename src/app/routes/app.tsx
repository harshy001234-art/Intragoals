import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Bell, CalendarCheck, LayoutDashboard, Target, Users } from "lucide-react";
import { AppSidebar } from "@/app/layouts/AppSidebar";
import { AppTopbar } from "@/app/layouts/AppTopbar";
import { authApi } from "@/intragoals/auth/auth-api";
import { useApp } from "@/intragoals/workspace/store";
import { workspaceApi } from "@/intragoals/workspace/workspace-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app")({
  component: AppShell,
});

function AppShell() {
  const isAuthed = useApp((s) => s.isAuthed);
  const authSource = useApp((s) => s.authSource);
  const setAuthUser = useApp((s) => s.setAuthUser);
  const setWorkspaceData = useApp((s) => s.setWorkspaceData);
  const logout = useApp((s) => s.logout);
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then(async (user) => {
        if (cancelled) return;
        setAuthUser(user);
        const workspace = await workspaceApi.loadWorkspace();
        if (!cancelled && workspace) setWorkspaceData(workspace);
      })
      .catch(() => {
        if (cancelled) return;
        logout();
        navigate({ to: "/login", replace: true });
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [logout, navigate, setAuthUser, setWorkspaceData]);

  useEffect(() => {
    if (!isAuthed || authSource !== "account" || !workspaceApi.isReady()) return;
    let cancelled = false;
    workspaceApi
      .loadWorkspace()
      .then((workspace) => {
        if (!cancelled && workspace) setWorkspaceData(workspace);
      })
      .catch((error) => console.warn("Unable to load Supabase workspace:", error));
    return () => {
      cancelled = true;
    };
  }, [authSource, isAuthed, setWorkspaceData]);

  if (!isAuthed && checking) return null;
  if (!isAuthed) return null;

  return (
    <div className="flex min-h-screen bg-[#f7f9ff]">
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}

function MobileTabBar() {
  const loc = useLocation();
  const role = useApp((s) => s.user?.role) ?? "employee";
  const items =
    role === "admin"
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
          <Link
            key={it.to}
            to={it.to}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 text-[10px]",
              active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <Icon className={cn("h-4 w-4", active && "text-[color:var(--brand-purple)]")} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
