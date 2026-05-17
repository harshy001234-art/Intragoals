import logoSrc from "@/assets/intragoals-logo.png";

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  withTagline?: boolean;
  className?: string;
}

export function Logo({ size = 40, withWordmark = true, withTagline = false, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={logoSrc}
        alt="Intragoals logo"
        width={size}
        height={size}
        className="rounded-lg border border-[color:var(--brand-cyan)]/35 bg-[color:var(--brand-midnight)] object-cover shadow-lg shadow-cyan-500/15"
        style={{ width: size, height: size }}
      />
      {withWordmark && (
        <div className="leading-tight">
          <div className="text-lg font-black tracking-tight text-foreground">
            Intra<span className="text-brand-gradient">goals</span>
          </div>
          {withTagline && (
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Align · Track · Achieve
            </div>
          )}
        </div>
      )}
    </div>
  );
}
