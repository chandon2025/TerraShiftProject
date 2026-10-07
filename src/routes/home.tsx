import { createFileRoute, Link } from "@tanstack/react-router";
import { useT, type TKey } from "@/lib/i18n";
import { useNasa } from "@/lib/useNasa";
import { useApp } from "@/lib/store";
import { farmScore } from "@/lib/analysis";
import { AppShell, Card, ErrorState, LoadingState, PageHeader, PrimaryButton } from "@/components/ui-kit";
import { NasaCards } from "@/components/NasaCards";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Farm overview — TerraShift" },
      { name: "description", content: "Your farm details, NASA environmental indicators and a transparent farm health score." },
      { property: "og:title", content: "Farm overview — TerraShift" },
      { property: "og:description", content: "See your farm health and rotation score with a clear explanation." },
    ],
  }),
  component: () => <AppShell><HomePage /></AppShell>,
});

function HomePage() {
  const { t, n, lang } = useT();
  const { farm } = useApp();
  const q = useNasa();
  const score = farmScore(farm, q.data);

  const info = [
    { e: "📍", k: "location", v: farm.location?.name },
    { e: "🌾", k: "currentCrop", v: farm.currentCrop ? t(`crop_${farm.currentCrop}` as TKey) : null },
    { e: "🌱", k: "soilType", v: farm.soil ? t(`soil_${farm.soil}` as TKey) : null },
    { e: "💧", k: "irrigation", v: farm.irrigation ? t(`irr_${farm.irrigation}` as TKey) : null },
    { e: "🎯", k: "priority", v: farm.priorities.length ? farm.priorities.map((p) => t(`pri_${p}` as TKey)).join(", ") : null },
  ] as const;

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <PageHeader title={t("homeTitle")} />
        <Link to="/setup" className="shrink-0 rounded-xl border bg-card px-3 py-2 text-sm font-medium">{t("editFarm")}</Link>
      </div>

      <Card className="mb-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          {info.map((i) => (
            <div key={i.k} className="flex gap-3">
              <span className="text-2xl" aria-hidden>{i.e}</span>
              <div><dt className="text-sm text-muted-foreground">{t(i.k)}</dt><dd className="font-semibold">{i.v ?? <span className="font-normal text-muted-foreground">{t("notSet")}</span>}</dd></div>
            </div>
          ))}
        </dl>
      </Card>

      {q.isLoading && <LoadingState />}
      {q.isError && <ErrorState onRetry={() => q.refetch()} />}
      {q.data && <div className="mb-6"><NasaCards obs={q.data} compact /></div>}

      <Card className="mb-6">
        <h2 className="text-lg font-semibold">{t("scoreTitle")}</h2>
        {!score ? (
          <div className="mt-3 rounded-xl bg-muted p-4">
            <p className="font-semibold">{t("notEnough")}</p>
            <p className="text-sm text-muted-foreground">{t("notEnoughBody")}</p>
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center gap-5">
              <ScoreRing value={score.score} label={n(score.score)} />
              <p className="text-sm text-muted-foreground">{t("scoreNote")}</p>
            </div>
            <h3 className="mt-6 font-semibold">{t("why")}</h3>
            <ul className="mt-3 grid gap-3">
              {score.factors.map((f) => (
                <li key={f.key} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-2 font-medium">
                    <span>{t(f.key)}</span><span>{n(f.points)}/{n(f.max)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(f.points / f.max) * 100}%` }} /></div>
                  <p className="mt-2 text-sm text-muted-foreground">{f.note[lang]}</p>
                </li>
              ))}
            </ul>
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer font-medium text-nasa">{t("methodology")}</summary>
              <p className="mt-2 text-muted-foreground">{t("methodologyBody")}</p>
            </details>
          </>
        )}
      </Card>

      <Link to="/rotation"><PrimaryButton>🔄 {t("exploreRotations")}</PrimaryButton></Link>
    </>
  );
}

function ScoreRing({ value, label }: { value: number; label: string }) {
  const c = 2 * Math.PI * 42;
  return (
    <div className="relative h-28 w-28 shrink-0" role="img" aria-label={`${value} / 100`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" className="stroke-muted" />
        <circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" strokeLinecap="round" className="stroke-primary" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{label}</span><span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}
