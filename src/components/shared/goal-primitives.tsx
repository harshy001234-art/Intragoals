import { type Goal, type GoalStatus } from "@/intragoals/workspace/store";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<GoalStatus, string> = {
  Draft: "bg-secondary text-muted-foreground border-border",
  "Pending Approval":
    "bg-[color:var(--brand-yellow)]/10 text-[color:var(--brand-yellow)] border-[color:var(--brand-yellow)]/30",
  Approved:
    "bg-[color:var(--brand-green)]/10 text-[color:var(--brand-green)] border-[color:var(--brand-green)]/30",
  Rejected: "bg-destructive/15 text-destructive border-destructive/30",
  Returned:
    "bg-[color:var(--brand-orange)]/10 text-[color:var(--brand-orange)] border-[color:var(--brand-orange)]/30",
  Locked:
    "bg-[color:var(--brand-purple)]/10 text-[color:var(--brand-purple)] border-[color:var(--brand-purple)]/30",
};

export function StatusBadge({ status }: { status: GoalStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  );
}

export function ProgressRing({
  value,
  size = 64,
  stroke = 7,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={`pg-${size}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#00d8ff" />
            <stop offset="50%" stopColor="#8438ff" />
            <stop offset="100%" stopColor="#ff7a18" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(148,163,184,0.18)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#pg-${size})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-semibold">{Math.round(value)}%</span>
        {label && (
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
        )}
      </div>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  accent = "blue",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: "blue" | "purple" | "green" | "orange" | "magenta";
}) {
  const accentMap: Record<string, string> = {
    blue: "from-[color:var(--brand-purple)]/30 to-transparent",
    purple: "from-[color:var(--brand-purple)]/30 to-transparent",
    green: "from-[color:var(--brand-green)]/30 to-transparent",
    orange: "from-[color:var(--brand-orange)]/30 to-transparent",
    magenta: "from-[color:var(--brand-magenta)]/30 to-transparent",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl glass p-5">
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl bg-gradient-to-br",
          accentMap[accent],
        )}
      />
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function GoalRow({ g }: { g: Goal }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-secondary/40 p-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{g.title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {g.thrustArea} � {g.uom} � Target {g.target} � Weightage {g.weightage}%
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={g.status} />
      </div>
    </div>
  );
}
