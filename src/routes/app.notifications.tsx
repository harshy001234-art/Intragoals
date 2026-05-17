import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/app/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const user = useApp((s) => s.user);
  const items = useApp((s) => s.notifications).filter((n) => n.userId === user?.id);
  const markRead = useApp((s) => s.markNotificationsRead);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <div className="text-sm text-muted-foreground">{items.filter(i => !i.read).length} unread</div>
        </div>
        <Button variant="outline" className="border-border" onClick={markRead}><CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read</Button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">You're all caught up.</div>}
        {items.map((n) => (
          <div key={n.id} className={`rounded-xl border p-4 ${n.read ? "border-border bg-secondary/30" : "border-[color:var(--brand-purple)]/30 bg-[color:var(--brand-purple)]/5"}`}>
            <div className="flex items-start gap-3">
              <Bell className="mt-0.5 h-4 w-4 text-[color:var(--brand-purple)]" />
              <div className="flex-1">
                <div className="text-sm font-medium">{n.title}</div>
                <div className="text-sm text-muted-foreground">{n.body}</div>
              </div>
              <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
