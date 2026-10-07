import { createFileRoute, Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { useNasa } from "@/lib/useNasa";
import { useApp } from "@/lib/store";
import { evaluatePlans } from "@/lib/analysis";
import { AppShell, Card, LevelPill, PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/rotation")({
  head: () => ({
    meta: [
      { title: "Explore crop rotation plans — TerraShift" },
      { name: "description", content: "Explore and compare common Bangladesh crop rotation plans against your farm conditions." },
      { property: "og:title", content: "Explore crop rotation plans — TerraShift" },
      { property: "og:description", content: "Rotation strategies to explore, explained in plain language." },
    ],
  }),
  component: () => <AppShell><Rotation /></AppShell>,
});

function Rotation() {
  const { t, n, lang } = useT();
  const app = useApp();
  const q = useNasa();
  const plans = evaluatePlans(app.farm, q.data);
  const toggle = (id: string) =>
    app.setCompare(app.compare.includes(id) ? app.compare.filter((x) => x !== id) : [...app.compare, id]);

  return (
    <>
      <PageHeader title={t("rotTitle")} sub={t("rotSub")} />
      <p className="mb-5 rounded-xl bg-sun-soft px-4 py-3 text-sm">{t("rotDisclaimer")}</p>
      <div className="grid gap-4">
        {plans.map((p, i) => {
          const sel = app.compare.includes(p.id);
          return (
            <Card key={p.id} className={sel ? "border-primary" : ""}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{t("plan")} {n(i + 1)}</h2>
                <button onClick={() => toggle(p.id)} aria-pressed={sel} className={`rounded-xl border px-3 py-2 text-sm font-medium ${sel ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                  {sel ? `✓ ${t("selected")}` : t("compareSel")}
                </button>
              </div>
              <ol className="mt-3 flex flex-wrap items-center gap-2 text-base font-medium">
                {p.crops.map((c, j) => (
                  <li key={j} className="flex items-center gap-2">
                    <span className="rounded-xl bg-muted px-3 py-1.5">{c ? `${c.emoji} ${c.name[lang]}` : t("fallow")}</span>
                    {j < p.crops.length - 1 && <span aria-hidden>→</span>}
                  </li>
                ))}
              </ol>
              <dl className="mt-4 grid gap-2 text-sm">
                <div className="flex items-center justify-between"><dt>🔄 {t("diversity")}</dt><dd><LevelPill level={p.diversity} /></dd></div>
                <div className="flex items-center justify-between"><dt>💧 {t("waterCons")}</dt><dd><LevelPill level={p.water} /></dd></div>
                <div className="flex items-center justify-between"><dt>🌱 {t("soilCons")}</dt><dd><LevelPill level={p.soilHealth} /></dd></div>
                <div className="flex items-center justify-between"><dt>🎯 {t("priAlign")}</dt><dd>{app.farm.priorities.length ? t("match", { n: p.matched.length, m: app.farm.priorities.length }) : t("noPri")}</dd></div>
              </dl>
              <p className="mt-3 text-sm text-muted-foreground">💧 {p.waterNote[lang]} 🌱 {p.soilNote[lang]} 🌦️ {p.envNote[lang]}</p>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-medium text-nasa">{t("whyPlan")}</summary>
                <ul className="mt-2 list-disc pl-5 text-muted-foreground">{p.reasons.map((r, k) => <li key={k}>{r[lang]}</li>)}</ul>
              </details>
            </Card>
          );
        })}
      </div>
      <div className="sticky bottom-20 mt-6 md:bottom-4">
        <Link to="/insights" className="flex min-h-14 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-card">
          {app.compare.length >= 2 ? t("compareN", { n: app.compare.length }) : t("viewSummary")}
        </Link>
      </div>
    </>
  );
}
