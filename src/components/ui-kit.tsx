import type { ReactNode, ButtonHTMLAttributes } from "react";
import { Link, Navigate, useRouterState } from "@tanstack/react-router";
import { Home, Satellite, RefreshCw, BarChart3, Settings, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT, type TKey } from "@/lib/i18n";
import { useApp, isFarmReady } from "@/lib/store";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border bg-card p-5 shadow-card", className)}>{children}</div>;
}

export function PrimaryButton({ className, ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-lg font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:opacity-50",
        className,
      )}
    />
  );
}

export function GhostButton({ className, ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border bg-card px-5 font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
        className,
      )}
    />
  );
}

export function ChoiceCard({ selected, onClick, emoji, label }: { selected: boolean; onClick: () => void; emoji: string; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "relative flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 bg-card p-3 text-center font-medium transition",
        selected ? "border-primary bg-primary-soft text-accent-foreground" : "border-border hover:border-primary/40",
      )}
    >
      <span className="text-3xl" aria-hidden>{emoji}</span>
      <span className="text-base leading-tight">{label}</span>
      {selected && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground" aria-hidden>✓</span>}
    </button>
  );
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-semibold">{children}</h2>
      {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
      {sub && <p className="mt-1.5 text-muted-foreground">{sub}</p>}
    </header>
  );
}

export function LoadingState() {
  const { t } = useT();
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground" role="status">
      <Loader2 className="h-6 w-6 animate-spin" /> {t("loading")}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useT();
  return (
    <Card className="border-destructive/30">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-destructive" aria-hidden />
        <div>
          <p className="font-semibold">{t("dataError")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("dataErrorBody")}</p>
          <GhostButton className="mt-4" onClick={onRetry}><RefreshCw className="h-4 w-4" />{t("retry")}</GhostButton>
        </div>
      </div>
    </Card>
  );
}

export function LevelPill({ level }: { level: "low" | "moderate" | "high" }) {
  const { t } = useT();
  const bars = level === "low" ? 1 : level === "moderate" ? 2 : 3;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-sm font-medium">
      <span className="flex gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => <span key={i} className={cn("h-3 w-1.5 rounded-sm", i <= bars ? "bg-primary" : "bg-border")} />)}
      </span>
      {t(`lv_${level}` as TKey)}
    </span>
  );
}

const NAV = [
  { to: "/home", key: "nav_home", icon: Home },
  { to: "/environment", key: "nav_env", icon: Satellite },
  { to: "/rotation", key: "nav_rotation", icon: RefreshCw },
  { to: "/insights", key: "nav_insights", icon: BarChart3 },
  { to: "/settings", key: "nav_settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useT();
  const { hydrated, lang, farm } = useApp();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (!hydrated) return <LoadingState />;
  if (!lang) return <Navigate to="/" />;
  if (!isFarmReady(farm) && path !== "/settings") return <Navigate to="/setup" />;

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar p-5 md:flex">
        <div className="mb-8 flex items-center gap-2 text-xl font-bold"><span aria-hidden>🌱</span>{t("appName")}</div>
        <nav className="flex flex-col gap-1" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="flex min-h-12 items-center gap-3 rounded-xl px-3 font-medium text-muted-foreground hover:bg-muted" activeProps={{ className: "bg-sidebar-accent !text-sidebar-accent-foreground" }}>
              <n.icon className="h-5 w-5" aria-hidden />{t(n.key)}
            </Link>
          ))}
        </nav>
        <p className="mt-auto text-xs text-muted-foreground">🛰️ {t("poweredBy")}</p>
      </aside>
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-[1000] grid grid-cols-5 border-t bg-card md:hidden" aria-label="Main">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className="flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground" activeProps={{ className: "!text-primary" }}>
            <n.icon className="h-6 w-6" aria-hidden />{t(n.key)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
