import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp } from "@/intragoals/workspace/store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export const Route = createFileRoute("/app/audit")({
  component: AuditPage,
});

function AuditPage() {
  const items = useApp((s) => s.audit);

  const goalHref = (entityType: string, entityId: string) => {
    if (entityType === "Goal") return { id: entityId };
    if (entityType === "QuarterlyUpdate" && entityId.includes(":")) {
      const [goalId] = entityId.split(":");
      return { id: goalId };
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <div className="text-sm text-muted-foreground">
          Append-only history of all goal, approval, and check-in actions.
        </div>
      </div>
      <div className="rounded-2xl glass p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Before</TableHead>
              <TableHead>After</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(a.timestamp), "MMM d, HH:mm")}
                </TableCell>
                <TableCell>
                  {a.userId ? (
                    <Link
                      to="/app/people/$personId"
                      params={{ personId: a.userId }}
                      className="font-medium hover:underline"
                    >
                      {a.userName}
                    </Link>
                  ) : (
                    a.userName
                  )}
                </TableCell>
                <TableCell>{a.action}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {goalHref(a.entityType, a.entityId) ? (
                    <Link
                      to="/app/goals/$id"
                      params={goalHref(a.entityType, a.entityId)!}
                      className="hover:text-foreground hover:underline"
                    >
                      {`${a.entityType} · ${a.entityId}`}
                    </Link>
                  ) : (
                    `${a.entityType} · ${a.entityId}`
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {a.previousValue ?? "-"}
                </TableCell>
                <TableCell className="text-xs">{a.newValue ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
