import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminApi } from "@/intragoals/auth/auth-api";
import { useApp } from "@/intragoals/workspace/store";
import type { Role } from "@/intragoals/workspace/store";
import { workspaceApi } from "@/intragoals/workspace/workspace-api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/users")({
  component: UsersPage,
});

const roleOptions: Role[] = ["employee", "manager", "admin"];

function UsersPage() {
  const currentUser = useApp((s) => s.user);
  const authSource = useApp((s) => s.authSource);
  const users = useApp((s) => s.people);
  const setWorkspaceData = useApp((s) => s.setWorkspaceData);
  const [draftRoles, setDraftRoles] = useState<Record<string, Role>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    setDraftRoles(
      Object.fromEntries(users.map((user) => [user.id, user.role])) as Record<string, Role>,
    );
  }, [users]);

  const canManageRoles =
    currentUser?.role === "admin" && authSource === "account" && workspaceApi.isReady();
  const adminCount = users.filter((user) => user.role === "admin").length;

  const saveRole = async (userId: string) => {
    const selectedRole = draftRoles[userId];
    const user = users.find((entry) => entry.id === userId);

    if (!user || !selectedRole || selectedRole === user.role) return;

    setSavingUserId(userId);
    try {
      await adminApi.updateUserRole(userId, selectedRole);
      const workspace = await workspaceApi.loadWorkspace();
      if (workspace) {
        setWorkspaceData(workspace);
      }
      toast.success("User role updated.");
    } catch (error) {
      setDraftRoles((current) => ({ ...current, [userId]: user.role }));
      toast.error(error instanceof Error ? error.message : "Unable to update role.");
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">User management</h1>
        <div className="text-sm text-muted-foreground">{users.length} active users</div>
      </div>
      {!canManageRoles && (
        <div className="rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-muted-foreground">
          Role changes are available only for signed-in workspace admins in the Supabase-backed
          workspace.
        </div>
      )}
      <div className="rounded-2xl glass p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="flex items-center gap-2">
                  <span
                    className="grid h-7 w-7 place-items-center rounded-md text-[10px] font-semibold text-background"
                    style={{ background: u.avatarColor }}
                  >
                    {u.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  {u.name}
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>{u.department}</TableCell>
                <TableCell>
                  {canManageRoles ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={draftRoles[u.id] ?? u.role}
                        onValueChange={(value) =>
                          setDraftRoles((current) => ({ ...current, [u.id]: value as Role }))
                        }
                        disabled={savingUserId === u.id || u.id === currentUser?.id}
                      >
                        <SelectTrigger className="w-[148px] bg-background capitalize">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role} value={role} className="capitalize">
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={
                          savingUserId === u.id ||
                          u.id === currentUser?.id ||
                          (draftRoles[u.id] ?? u.role) === u.role ||
                          (u.role === "admin" &&
                            adminCount === 1 &&
                            (draftRoles[u.id] ?? u.role) !== "admin")
                        }
                        onClick={() => void saveRole(u.id)}
                      >
                        {savingUserId === u.id ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className="border-border capitalize">
                      {u.role}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
