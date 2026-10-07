import type { NasaObs } from "@/lib/nasa.functions";
import { useT } from "@/lib/i18n";
import { moistureClass } from "@/lib/analysis";
import { Card } from "./ui-kit";

export function NasaCards({ obs, compact }: { obs: NasaObs; compact?: boolean }) {
  const { t, n, date } = useT();
  const items = [
    { e: "🌡️", title: t("temp"), value: obs.tempMean != null ? n(obs.tempMean.toFixed(1)) : "—", unit: "°C", desc: t("tempDesc"), extra: null, key: "t" as const, tone: "bg-sun-soft" },
    { e: "🌧️", title: t("precip"), value: obs.precipTotal != null ? n(Math.round(obs.precipTotal)) : "—", unit: "mm", desc: t("precipDesc"), extra: null, key: "p" as const, tone: "bg-nasa-soft" },
    { e: "💧", title: t("soilMoist"), value: obs.soilWetness != null ? n(Math.round(obs.soilWetness * 100)) : "—", unit: "%", desc: t("soilMoistDesc"), extra: obs.soilWetness != null ? t(moistureClass(obs.soilWetness)) : null, key: "w" as const, tone: "bg-primary-soft" },
  ];
  return (
    <div className={compact ? "grid grid-cols-3 gap-3" : "grid gap-4"}>
      {items.map((it) => (
        <Card key={it.key} className={compact ? "p-3" : ""}>
          <div className="flex items-start gap-3">
            {!compact && <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${it.tone}`} aria-hidden>{it.e}</div>}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">{compact && <span aria-hidden>{it.e} </span>}{it.title}</p>
              <p className={compact ? "text-xl font-bold" : "text-3xl font-bold"}>
                {it.value}<span className="ml-1 text-base font-medium text-muted-foreground">{it.unit}</span>
              </p>
              {it.extra && <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-sm font-medium">{it.extra}</span>}
              {!compact && (
                <>
                  <p className="mt-2 text-sm">{it.desc}</p>
                  <Spark data={obs.daily.map((d) => d[it.key])} label={t("dailyTrend")} />
                  <dl className="mt-3 grid gap-0.5 text-xs text-muted-foreground">
                    <div><dt className="inline">{t("period")}: </dt><dd className="inline">{date(obs.periodStart)} – {date(obs.periodEnd)}</dd></div>
                    <div><dt className="inline">{t("source")}: </dt><dd className="inline">NASA POWER · MERRA-2</dd></div>
                    <div><dt className="inline">{t("resolution")}: </dt><dd className="inline">{t("resolutionVal")}</dd></div>
                  </dl>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Spark({ data, label }: { data: (number | null)[]; label: string }) {
  const vals = data.filter((v): v is number => v != null);
  if (vals.length < 2) return null;
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => (v == null ? null : `${(i / (data.length - 1)) * 100},${30 - ((v - min) / span) * 26 - 2}`))
    .filter(Boolean)
    .join(" ");
  return (
    <figure className="mt-3">
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-10 w-full text-primary" role="img" aria-label={label}>
        <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="text-xs text-muted-foreground">{label}</figcaption>
    </figure>
  );
}
