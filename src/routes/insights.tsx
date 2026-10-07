import { createFileRoute } from "@tanstack/react-router";
import { useT, type TKey } from "@/lib/i18n";
import { useNasa } from "@/lib/useNasa";
import { useApp } from "@/lib/store";
import { evaluatePlans, insights } from "@/lib/analysis";
import { AppShell, Card, LevelPill, PageHeader } from "@/components/ui-kit";
import { NasaCards } from "@/components/NasaCards";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Your summary — TerraShift" },
      { name: "description", content: "Compare selected rotation plans and read key insights for your farm." },
      { property: "og:title", content: "Your summary — TerraShift" },
      { property: "og:description", content: "Rotation comparison and key insights based on NASA data." },
    ],
  }),
  component: () => <AppShell><Insights /></AppShell>,
});

function Insights() {
  const { t, lang } = useT();
  const { farm, compare } = useApp();
  const q = useNasa();
  const all = evaluatePlans(farm, q.data);
  const chosen = all.filter((p) => compare.includes(p.id));
  const shown = chosen.length ? chosen : all.slice(0, 2);
  const seq = (p: (typeof all)[number]) => p.crops.map((c) => (c ? c.name[lang] : t("fallow"))).join(" → ");

  return (
    <>
      <PageHeader title={t("sumTitle")} sub={t("cmpSub")} />
      <Card className="mb-5">
        <ul className="grid gap-2">
          <li>📍 {farm.location?.name}</li>
          <li>🌾 {farm.currentCrop ? t(`crop_${farm.currentCrop}` as TKey) : t("notSet")}</li>
          <li>🌱 {farm.soil ? t(`soil_${farm.soil}` as TKey) : t("notSet")}</li>
          <li>💧 {farm.irrigation ? t(`irr_${farm.irrigation}` as TKey) : t("notSet")}</li>
          <li>🎯 {farm.priorities.length ? farm.priorities.map((p) => t(`pri_${p}` as TKey)).join(", ") : t("noPri")}</li>
        </ul>
      </Card>
      {q.data && <><h2 className="mb-2 font-semibold">🛰️ {t("nasaCond")}</h2><div className="mb-5"><NasaCards obs={q.data} compact /></div></>}
      <h2 className="mb-2 font-semibold">{t("plansToExplore")}</h2>
      {!chosen.length && <p className="mb-2 text-sm text-muted-foreground">{t("noPlansSel")}</p>}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {shown.map((p) => (
          <Card key={p.id}>
            <p className="font-semibold">{seq(p)}</p>
            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between"><dt>💧 {t("waterCons")}</dt><dd><LevelPill level={p.water} /></dd></div>
              <div className="flex justify-between"><dt>🌱 {t("soilCons")}</dt><dd><LevelPill level={p.soilHealth} /></dd></div>
              <div className="flex justify-between"><dt>🔄 {t("diversity")}</dt><dd><LevelPill level={p.diversity} /></dd></div>
              <div className="flex justify-between"><dt>🎯 {t("priAlign")}</dt><dd>{t("match", { n: p.matched.length, m: farm.priorities.length })}</dd></div>
            </dl>
            <p className="mt-2 text-sm text-muted-foreground">🌦️ {p.envNote[lang]}</p>
          </Card>
        ))}
      </div>
      <h2 className="mb-2 font-semibold">{t("keyInsights")}</h2>
      <Card className="mb-6"><ul className="list-disc space-y-2 pl-5">{insights(farm, q.data, shown, lang).map((s, i) => <li key={i}>{s}</li>)}</ul></Card>
      <p className="rounded-xl bg-nasa-soft p-4 text-sm">{t("closing")}</p>
    </>
  );
}
