import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, LogOut, Menu, Search, UserCircle2 } from "lucide-react";
import { authApi } from "@/intragoals/auth/auth-api";
import { useApp } from "@/intragoals/workspace/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { AppSidebar } from "./AppSidebar";

export function AppTopbar() {
  const { user, notifications } = useApp();
  const unread = notifications.filter(
    (notification) => !notification.read && notification.userId === user?.id,
  ).length;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-white/92 px-4 shadow-sm shadow-slate-200/40 backdrop-blur md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white md:hidden">
            <Menu className="h-4 w-4" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-white p-0">
          <AppSidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="hidden md:flex max-w-md flex-1 items-center gap-2">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search goals, people, KPIs..."
            className="border-border bg-slate-50 pl-9"
          />
        </div>
      </div>

      <div className="flex-1 md:flex-none" />

      <Link
        to="/app/notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white hover:bg-slate-50"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--brand-magenta)] px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-2 py-1.5 hover:bg-slate-50">
            <span
              className="grid h-7 w-7 place-items-center rounded-md text-[11px] font-semibold text-background"
              style={{ background: user.avatarColor }}
            >
              {user.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </span>
            <div className="text-left leading-tight">
              <div className="max-w-[140px] truncate text-xs font-medium sm:max-w-[180px]">
                {user.name}
              </div>
              <div className="hidden text-[10px] text-muted-foreground sm:block">{user.title}</div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/app/settings">
              <UserCircle2 className="mr-2 h-4 w-4" /> Profile & Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              await authApi.logout().catch(() => undefined);
              navigate({ to: "/login" });
            }}
            className="text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
