import { type CSSProperties } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { IntragoalsLogo } from "@/components/shared/intragoals-logo";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  FileBarChart,
  LineChart,
  Lock,
  Quote,
  ShieldCheck,
  Target,
  Users,
  Workflow,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

const navItems = [
  { label: "HOME", href: "#home" },
  { label: "FEATURES", href: "/features" },
  { label: "SERVICES", href: "#features" },
  { label: "WHY US", href: "#why" },
  { label: "CONTACT", href: "#contact" },
];

function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteNav />
      <Hero />
      <Services />
      <WhyUs />
      <HowItWorks />
      <Projects />
      <Testimonials />
      <ContactCTA />
      <Footer />
    </div>
  );
}

function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[82px] max-w-[1390px] items-center justify-between gap-4 px-5 md:px-8 xl:px-12">
        <a href="#home" aria-label="Intragoals home">
          <IntragoalsLogo size={42} />
        </a>
        <nav className="hidden items-center gap-5 text-[15px] font-semibold tracking-wide text-[color:var(--brand-ink)] md:flex lg:gap-8">
          {navItems.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              className={`nav-gradient-link ${index === 0 ? "is-active" : ""}`}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <Button
          asChild
          className="hidden h-12 rounded-lg bg-brand-gradient px-6 text-sm font-bold tracking-wide text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 sm:inline-flex lg:px-7"
        >
          <Link to="/login">GET STARTED</Link>
        </Button>
        <Button asChild size="sm" className="bg-brand-gradient text-white sm:hidden">
          <Link to="/login">GET STARTED</Link>
        </Button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-[610px] overflow-hidden bg-[#f7f9ff] sm:min-h-[650px] md:min-h-[660px]"
    >
      <div className="hero-grid-motion absolute inset-0 blueprint-grid opacity-80" />
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-40 bg-gradient-to-b from-transparent via-[#f7f9ff]/15 to-white" />
      <div className="animate-slide-in-soft relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-10 text-center sm:pt-12 md:pt-16">
        <h1 className="hero-title logo-ink mx-auto max-w-7xl">
          <span className="text-slate-400">Stop Chasing.</span>{" "}
          <span className="text-[color:var(--brand-ink)]">Start</span>
          <br />
          Aligning. We Build Goals
          <br />
          That Go Live Fast
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#4D5567] md:text-[22px]">
          Intragoals helps HR teams, managers, and employees plan OKRs,{" "}
          <br className="hidden md:block" />
          approve goals, run check-ins, and report progress smarter.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-14 rounded-lg border-[color:var(--brand-cyan)]/30 bg-white px-5 text-sm font-extrabold text-[color:var(--brand-ink)] shadow-sm hover:border-[color:var(--brand-purple)]/35 hover:bg-cyan-50/40 sm:h-[60px] sm:px-8 sm:text-base"
          >
            <Link to="/app/dashboard">VIEW DASHBOARD</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="h-14 rounded-lg bg-brand-gradient px-6 text-sm font-extrabold text-white shadow-xl shadow-cyan-500/20 hover:opacity-95 sm:h-[60px] sm:px-9 sm:text-base"
          >
            <Link to="/login">GET STARTED</Link>
          </Button>
        </div>
      </div>
      <HeroMockups />
    </section>
  );
}

function HeroMockups() {
  return (
    <div className="hero-visual-stage pointer-events-none absolute inset-x-0 bottom-[-260px] z-0 mx-auto h-[460px] max-w-7xl sm:bottom-[-260px] md:bottom-[-250px]">
      <div
        className="animate-float-slow absolute -left-6 bottom-8 hidden md:block"
        style={{ "--mockup-rotate": "-22deg" } as Record<string, string>}
      >
        <IdeaCard />
      </div>
      <div
        className="animate-float-medium absolute bottom-8 left-[44%] hidden w-[360px] opacity-95 sm:block md:w-[470px]"
        style={{ "--mockup-rotate": "-24deg", "--mockup-x": "-50%" } as Record<string, string>}
      >
        <DesktopMockup accent="blue" title="Goal Command Center" />
      </div>
      <div
        className="animate-float-slow absolute bottom-10 right-[-105px] w-[500px] opacity-90 sm:right-[-70px] sm:w-[560px] md:right-[-50px] md:w-[690px] md:opacity-95"
        style={{ "--mockup-rotate": "-25deg" } as Record<string, string>}
      >
        <DesktopMockup accent="orange" title="Manager Approval Queue" />
      </div>
      <div
        className="animate-float-medium absolute bottom-0 right-[26%] hidden w-[230px] lg:block"
        style={{ "--mockup-rotate": "-24deg" } as Record<string, string>}
      >
        <PhoneMockup />
      </div>
    </div>
  );
}

function DesktopMockup({ title, accent }: { title: string; accent: "blue" | "orange" }) {
  const color = accent === "blue" ? "#075dff" : "#ff7a18";
  return (
    <div className="soft-shadow rounded-[28px] border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-red-300" />
        <span className="h-3 w-3 rounded-full bg-amber-300" />
        <span className="h-3 w-3 rounded-full bg-emerald-300" />
        <span className="ml-3 h-3 w-32 rounded-full bg-slate-100" />
      </div>
      <div className="grid grid-cols-12 gap-3 rounded-2xl bg-slate-50 p-4">
        <div className="col-span-4 space-y-2">
          <div className="h-8 rounded-lg bg-white" />
          <div className="h-8 rounded-lg bg-white" />
          <div className="h-20 rounded-lg bg-white p-3">
            <div className="h-2 w-16 rounded-full" style={{ background: color }} />
            <div className="mt-3 h-2 w-full rounded-full bg-slate-200" />
            <div className="mt-2 h-2 w-2/3 rounded-full bg-slate-200" />
          </div>
        </div>
        <div className="col-span-8 rounded-xl bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            {title}
          </div>
          <div className="mt-4 flex h-28 items-end gap-2">
            {[42, 76, 54, 96, 72, 118, 88].map((height, index) => (
              <span
                key={index}
                className="flex-1 rounded-t-lg"
                style={{ height, background: index % 2 ? color : "#DDE6FF" }}
              />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="h-12 rounded-lg bg-slate-50" />
            <div className="h-12 rounded-lg bg-slate-50" />
            <div className="h-12 rounded-lg bg-slate-50" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="soft-shadow rounded-[34px] border border-slate-200 bg-white p-3">
      <div className="mx-auto mb-3 h-2 w-16 rounded-full bg-slate-200" />
      <div className="rounded-[26px] bg-slate-50 p-4">
        <div className="h-16 rounded-2xl bg-brand-gradient" />
        <div className="mt-4 space-y-2">
          <div className="h-9 rounded-xl bg-white" />
          <div className="h-9 rounded-xl bg-white" />
          <div className="h-9 rounded-xl bg-white" />
          <div className="h-20 rounded-xl bg-white" />
        </div>
      </div>
    </div>
  );
}

function IdeaCard() {
  return (
    <div className="rounded-[28px] border-2 border-[color:var(--brand-cyan)] bg-white px-8 py-5 text-center text-lg font-extrabold text-[color:var(--brand-ink)] shadow-xl shadow-cyan-200/50">
      Your cycle
      <div className="mx-auto mt-3 h-5 w-5 rounded-full border-2 border-[color:var(--brand-cyan)]" />
    </div>
  );
}

function Services() {
  const services = [
    {
      icon: Target,
      title: "GOAL SHEET AUTHORING",
      desc: "Employees create weighted goals with clear targets, UoMs, and quarterly milestones.",
    },
    {
      icon: ClipboardCheck,
      title: "APPROVAL WORKFLOWS",
      desc: "Managers approve, return, or refine goal sheets with clean status tracking.",
    },
    {
      icon: LineChart,
      title: "PERFORMANCE REPORTING",
      desc: "HR sees progress, escalation risk, shared KPIs, and audit-ready exports.",
    },
  ];
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeader
          eyebrow="Services We Provide"
          title="A complete goal operating system"
          text="Intragoals replaces scattered files and email approvals with a guided workflow for the full annual cycle."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70"
            >
              <div className="grid h-14 w-14 place-items-center rounded-lg bg-cyan-50 text-[color:var(--brand-purple)]">
                <service.icon className="h-7 w-7" />
              </div>
              <h3 className="mt-7 text-xl font-black text-[color:var(--brand-ink)]">
                {service.title}
              </h3>
              <p className="mt-3 leading-7 text-slate-600">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  const stats = [
    { icon: CheckCircle2, label: "Goals validated", value: "100%" },
    { icon: Users, label: "Role-based workflows", value: "3" },
    { icon: Bell, label: "Escalation layers", value: "4" },
    { icon: ShieldCheck, label: "Audit visibility", value: "24/7" },
  ];
  return (
    <section id="why" className="border-y border-slate-200 bg-[#f7f9ff] py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeader
          eyebrow="Why Us"
          title="Built for repeatable, accountable cycles"
          text="Every screen is designed around the real handoffs between HR, employees, managers, and leadership."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm"
            >
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-cyan-50 text-[color:var(--brand-purple)]">
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="mt-5 text-4xl font-black text-[color:var(--brand-ink)]">
                {stat.value}
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: Workflow,
      title: "PLAN",
      text: "HR opens the cycle and employees draft structured goals with weighted outcomes.",
    },
    {
      n: "02",
      icon: CheckCircle2,
      title: "APPROVE",
      text: "Managers review submissions, request changes, and lock approved goals.",
    },
    {
      n: "03",
      icon: CalendarCheck,
      title: "CHECK IN",
      text: "Teams update quarterly progress with planned versus actual achievement.",
    },
    {
      n: "04",
      icon: FileBarChart,
      title: "REPORT",
      text: "Leadership exports progress, audit logs, and cycle health without manual cleanup.",
    },
  ];
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeader
          eyebrow="How It Works"
          title="From goal planning to board-ready reporting"
          text="A simple operating rhythm that keeps everyone moving without extra admin work."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.n}
              className="relative rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="text-brand-gradient text-sm font-black">Step - {step.n}</div>
              <step.icon className="mt-6 h-10 w-10 text-[color:var(--brand-purple)]" />
              <h3 className="mt-6 text-xl font-black text-[color:var(--brand-ink)]">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Projects() {
  const projects = [
    {
      title: "EMPLOYEE GOAL WORKSPACE",
      client: "Employees",
      deliverables: "Goal drafting, weightage validation, quarterly updates",
      industry: "Performance Operations",
      accent: "#075dff",
    },
    {
      title: "MANAGER APPROVAL CENTER",
      client: "Managers",
      deliverables: "Approval queue, inline feedback, team cycle visibility",
      industry: "People Leadership",
      accent: "#ff7a18",
    },
    {
      title: "HR ADMIN CONTROL ROOM",
      client: "Admin / HR",
      deliverables: "Cycle windows, shared KPIs, escalations, export reporting",
      industry: "Enterprise Governance",
      accent: "#19d88f",
    },
  ];

  return (
    <section id="projects" className="border-y border-slate-200 bg-[#f7f9ff] py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeader
          eyebrow="Featured Workflows"
          title="Role-specific experiences that stay connected"
          text="Each workspace is focused, but every update contributes to a shared source of truth."
        />
        <div className="workflow-stack mx-auto mt-12 max-w-6xl px-4">
          {projects.map((project, index) => (
            <div key={project.title} className="workflow-panel">
              <div
                className="project-card-motion workflow-stack-card group grid items-center gap-5 rounded-lg border border-[color:var(--brand-cyan)]/25 bg-white p-5 shadow-sm min-[520px]:grid-cols-[0.92fr_1.08fr] md:gap-8 md:p-8"
                style={
                  {
                    "--project-accent": project.accent,
                    zIndex: index + 1,
                  } as CSSProperties & Record<string, string | number>
                }
              >
                <div className={index % 2 ? "min-[560px]:order-2" : ""}>
                  <div className="text-brand-gradient mb-4 rounded-full bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em]">
                    Workflow 0{index + 1}
                  </div>
                  <h3 className="text-2xl font-black leading-tight text-[color:var(--brand-ink)]">
                    {project.title}
                  </h3>
                  <dl className="mt-6 grid gap-4 text-sm">
                    <Info label="Client:" value={project.client} />
                    <Info label="Deliverables:" value={project.deliverables} />
                    <Info label="Industry:" value={project.industry} />
                  </dl>
                  <Button
                    asChild
                    className="mt-7 h-11 rounded-lg bg-brand-gradient px-5 text-white shadow-lg shadow-cyan-500/15 hover:opacity-95"
                  >
                    <Link to="/login">
                      VIEW DEMO <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <WorkflowMockup color={project.accent} index={index} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-black text-[color:var(--brand-ink)]">{label}</dt>
      <dd className="mt-1 leading-6 text-slate-600">{value}</dd>
    </div>
  );
}

function WorkflowMockup({ color, index }: { color: string; index: number }) {
  const screens = [
    {
      cycle: "Employee workspace",
      title: "Personal OKRs",
      stats: [
        ["Goals", "04"],
        ["Weight", "100"],
        ["Draft", "72"],
      ],
      rows: [
        { label: "Draft objective", status: "72%", width: 72 },
        { label: "Weightage check", status: "54%", width: 54 },
        { label: "Quarter update", status: "63%", width: 63 },
      ],
    },
    {
      cycle: "Manager queue",
      title: "Team approvals",
      stats: [
        ["Queued", "18"],
        ["Approved", "12"],
        ["Needs edit", "06"],
      ],
      rows: [
        { label: "Review comments", status: "78%", width: 78 },
        { label: "Approval batch", status: "61%", width: 61 },
        { label: "Team visibility", status: "66%", width: 66 },
      ],
    },
    {
      cycle: "Admin control",
      title: "Q3 live cycle",
      stats: [
        ["Goals", "18"],
        ["Approved", "12"],
        ["At risk", "03"],
      ],
      rows: [
        { label: "Goal draft", status: "72%", width: 72 },
        { label: "Manager review", status: "54%", width: 54 },
        { label: "Cycle reporting", status: "63%", width: 63 },
      ],
    },
  ];
  const screen = screens[index] ?? screens[0];

  return (
    <div
      className="workflow-mockup animate-float-card soft-shadow h-full min-h-[320px] rounded-[28px] border border-slate-200 bg-slate-50 p-4 transition duration-300 group-hover:scale-[1.015]"
      style={{ "--float-delay": `${index * 0.35}s` } as Record<string, string>}
    >
      <div className="mockup-screen h-full rounded-2xl bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              {screen.cycle}
            </div>
            <div className="mt-1 text-sm font-black text-[color:var(--brand-ink)]">
              {screen.title}
            </div>
          </div>
          <div
            className="grid h-11 w-11 place-items-center rounded-xl text-white shadow-lg shadow-cyan-500/20"
            style={{ background: color }}
          >
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {screen.stats.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {label}
              </div>
              <div className="mt-1 text-lg font-black text-[color:var(--brand-ink)]">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3">
          {screen.rows.map((row, rowIndex) => (
            <div
              key={row.label}
              className="workflow-row rounded-xl bg-slate-50 p-4"
              style={{ "--row-delay": `${rowIndex * 0.28}s` } as Record<string, string>}
            >
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: color }}
                  />
                  <div className="truncate text-xs font-black text-[color:var(--brand-ink)]">
                    {row.label}
                  </div>
                </div>
                <div className="ml-2 rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-500 shadow-sm">
                  {row.status}
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200">
                <div
                  className="progress-flow progress-fill h-full rounded-full"
                  style={{ width: `${row.width}%`, background: color }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-slate-400">
                <span>Owner locked</span>
                <Lock className="h-3.5 w-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Testimonials() {
  const quotes = [
    {
      name: "Priya Iyer",
      role: "Engineering Manager",
      text: "The approval queue makes goal conversations specific. I can see exactly what needs attention before the cycle closes.",
      score: "5.0",
    },
    {
      name: "Rohan Kapoor",
      role: "HR Operations",
      text: "Shared KPIs and audit logs removed the manual reconciliation work our team used to do every quarter.",
      score: "4.9",
    },
    {
      name: "Aarav Mehta",
      role: "Senior Software Engineer",
      text: "I know what is approved, what changed, and how my quarterly check-ins affect my overall score.",
      score: "5.0",
    },
  ];
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeader
          eyebrow="Testimonials"
          title="Built around the people who run the cycle"
          text="Intragoals gives each role the context they need without burying them in process."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {quotes.map((item) => (
            <div
              key={item.name}
              className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm"
            >
              <Quote className="h-8 w-8 text-[color:var(--brand-purple)]" />
              <p className="mt-5 leading-7 text-slate-600">{item.text}</p>
              <div className="mt-7 flex items-center justify-between">
                <div>
                  <div className="font-black text-[color:var(--brand-ink)]">{item.name}</div>
                  <div className="text-sm text-slate-500">{item.role}</div>
                </div>
                <div className="text-brand-gradient rounded-lg bg-cyan-50 px-3 py-2 text-sm font-black">
                  {item.score}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactCTA() {
  return (
    <section id="contact" className="bg-[#f7f9ff] py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div>
          <div className="text-brand-gradient text-sm font-black uppercase tracking-[0.22em]">
            Contact Us
          </div>
          <h2 className="display-font logo-ink mt-4 max-w-3xl text-4xl md:text-6xl">
            Let&apos;s build a goal cycle your teams actually use
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Start with a demo, explore employee, manager, and admin views, then shape the workflow
            for your organization.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 h-14 rounded-lg bg-brand-gradient px-8 text-base font-extrabold text-white shadow-xl shadow-cyan-500/20"
          >
            <Link to="/login">GET STARTED</Link>
          </Button>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
          {[
            "Share your current goal process",
            "Explore role-based demo workspaces",
            "Receive a tailored rollout plan",
          ].map((item, index) => (
            <div key={item} className="flex gap-4 border-b border-slate-100 py-5 last:border-b-0">
              <div className="text-3xl font-black text-cyan-100">0{index + 1}</div>
              <div className="pt-1 font-bold text-[color:var(--brand-ink)]">{item}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-4">
        <div>
          <IntragoalsLogo withTagline />
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">
            Enterprise goal setting and tracking for modern teams that need clarity, accountability,
            and speed.
          </p>
        </div>
        <FooterCol
          title="Product"
          links={[
            ["Home", "/"],
            ["Features", "/features"],
            ["Pricing", "/pricing"],
          ]}
        />
        <FooterCol
          title="Workspace"
          links={[
            ["Dashboard", "/app/dashboard"],
            ["Login", "/login"],
            ["Register", "/register"],
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            ["Contact", "/contact"],
            ["Privacy", "/privacy"],
            ["Terms", "/terms"],
          ]}
        />
      </div>
      <div className="border-t border-slate-200 py-5 text-center text-xs font-semibold text-slate-500">
        © {new Date().getFullYear()} Intragoals. All Rights Reserved.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="text-sm font-black uppercase tracking-[0.18em] text-[color:var(--brand-ink)]">
        {title}
      </div>
      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        {links.map(([label, to]) => (
          <li key={to}>
            <Link to={to} className="nav-gradient-link">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="text-brand-gradient text-sm font-black uppercase tracking-[0.22em]">
        {eyebrow}
      </div>
      <h2 className="display-font mt-4 text-4xl text-[color:var(--brand-ink)] md:text-5xl">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">{text}</p>
    </div>
  );
}
