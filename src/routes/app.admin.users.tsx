import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/admin/users")({
  component: UsersPage,
});

function UsersPage() {
  const users = useApp((s) => s.people);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">User management</h1>
        <div className="text-sm text-muted-foreground">{users.length} active users</div>
      </div>
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
                  <Badge variant="outline" className="border-border capitalize">
                    {u.role}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
