import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/intragoals/workspace/store";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { workspaceApi } from "@/intragoals/workspace/workspace-api";
import { useState } from "react";

export const Route = createFileRoute("/app/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const user = useApp((s) => s.user);
  const authSource = useApp((s) => s.authSource);
  const items = useApp((s) => s.notifications)
    .filter((notification) => notification.userId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const markNotificationRead = useApp((s) => s.markNotificationRead);
  const markAllNotificationsRead = useApp((s) => s.markAllNotificationsRead);
  const navigate = useNavigate();
  const [markingAll, setMarkingAll] = useState(false);
  const [markingOne, setMarkingOne] = useState<string | null>(null);

  const handleMarkRead = () => {
    if (!user) return;
    markAllNotificationsRead(user.id);
    if (authSource === "account" && user) {
      setMarkingAll(true);
      void workspaceApi
        .markAllNotificationsRead(user.id)
        .then(() => toast.success("Notifications marked read."))
        .catch((error) =>
          toast.error(error instanceof Error ? error.message : "Unable to sync notifications."),
        )
        .finally(() => setMarkingAll(false));
      return;
    }
    toast.success("Notifications marked read.");
  };

  const handleMarkOneRead = (notificationId: string) => {
    if (!user) return;
    markNotificationRead(notificationId);
    if (authSource === "account") {
      setMarkingOne(notificationId);
      void workspaceApi
        .markNotificationRead(notificationId, user.id)
        .then(() => toast.success("Notification marked read."))
        .catch((error) =>
          toast.error(error instanceof Error ? error.message : "Unable to sync notification."),
        )
        .finally(() => setMarkingOne(null));
      return;
    }
    toast.success("Notification marked read.");
  };

  const openNotification = async (notificationId: string, deepLink?: string) => {
    handleMarkOneRead(notificationId);
    if (deepLink) {
      await navigate({ to: deepLink as never });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <div className="text-sm text-muted-foreground">
            {items.filter((item) => !item.read).length} unread
          </div>
        </div>
        <Button
          variant="outline"
          className="border-border"
          onClick={handleMarkRead}
          disabled={markingAll || items.every((item) => item.read)}
        >
          <CheckCheck className="mr-1.5 h-4 w-4" /> {markingAll ? "Marking..." : "Mark all read"}
        </Button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No notifications yet. Shared KPIs, approvals, and escalations will appear here.
          </div>
        )}
        {items.map((notification) => (
          <button
            key={notification.id}
            type="button"
            onClick={() => void openNotification(notification.id, notification.deepLink)}
            className={`w-full rounded-xl border p-4 text-left transition-colors ${notification.read ? "border-border bg-secondary/30" : "border-[color:var(--brand-purple)]/30 bg-[color:var(--brand-purple)]/5 hover:bg-[color:var(--brand-purple)]/10"}`}
          >
            <div className="flex items-start gap-3">
              <Bell className="mt-0.5 h-4 w-4 text-[color:var(--brand-purple)]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{notification.title}</div>
                    <div className="text-sm text-muted-foreground">{notification.body}</div>
                  </div>
                  {notification.deepLink ? (
                    <ChevronRight className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  ) : null}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {!notification.read ? (
                    <span className="rounded-full border border-[color:var(--brand-purple)]/20 bg-[color:var(--brand-purple)]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[color:var(--brand-purple)]">
                      New
                    </span>
                  ) : null}
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </div>
                  {!notification.read ? (
                    <span className="text-xs text-muted-foreground">
                      {markingOne === notification.id
                        ? "Opening..."
                        : notification.deepLink
                          ? "Tap to open"
                          : "Tap to mark read"}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
