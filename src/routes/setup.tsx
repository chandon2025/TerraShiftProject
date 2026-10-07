import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { MapPin, Map as MapIcon, Search, Loader2, ChevronDown } from "lucide-react";
import { useApp, type Farm, type Priority, type SoilChoice, type IrrigationChoice } from "@/lib/store";
import { useT, type TKey } from "@/lib/i18n";
import { CURRENT_CROP_OPTIONS } from "@/lib/crops";
import { Card, ChoiceCard, GhostButton, PageHeader, PrimaryButton, SectionTitle, LoadingState } from "@/components/ui-kit";

const MapPicker = lazy(() => import("@/components/MapPicker"));

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Farm setup — TerraShift" },
      { name: "description", content: "Tell TerraShift your farm location, crop, soil and irrigation in a few taps." },
      { property: "og:title", content: "Farm setup — TerraShift" },
      { property: "og:description", content: "Set up your farm to see NASA environmental data and rotation plans." },
    ],
  }),
  component: Setup,
});

const inBD = (lat: number, lon: number) => lat >= 20.5 && lat <= 26.7 && lon >= 88 && lon <= 92.7;

function Setup() {
  const app = useApp();
  if (!app.hydrated) return <LoadingState />;
  if (!app.lang) return <Navigate to="/" />;
  return <SetupForm />;
}

function SetupForm() {
  const app = useApp();
  const { t, n } = useT();
  const nav = useNavigate();
  const [f, setF] = useState<Farm>(app.farm);
  const [mode, setMode] = useState<"gps" | "map" | "search" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ name: string; lat: number; lon: number }[] | null>(null);
  const [details, setDetails] = useState(false);

  const setLoc = async (lat: number, lon: number, name?: string) => {
    if (!inBD(lat, lon)) return setMsg(t("outsideBD"));
    setMsg(null);
    let label = name ?? `${t("pinnedLoc")}`;
    if (!name) {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=10&lat=${lat}&lon=${lon}&accept-language=${app.lang}`);
        const j = await r.json();
        const a = j.address ?? {};
        label = [a.county || a.city || a.town || a.village, a.state_district || a.state].filter(Boolean).join(", ") || label;
      } catch { /* keep generic label */ }
    }
    setF((p) => ({ ...p, location: { name: label, lat, lon } }));
  };

  const gps = () => {
    setMode("gps");
    if (!navigator.geolocation) return setMsg(t("geoError"));
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (p) => { await setLoc(p.coords.latitude, p.coords.longitude); setBusy(false); },
      () => { setMsg(t("geoError")); setBusy(false); },
      { timeout: 15000 },
    );
  };

  const search = async () => {
    if (!q.trim()) return;
    setBusy(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=bd&limit=6&accept-language=${app.lang}&q=${encodeURIComponent(q)}`);
      const j = (await r.json()) as { display_name: string; lat: string; lon: string }[];
      setResults(j.map((x) => ({ name: x.display_name.split(",").slice(0, 3).join(","), lat: +x.lat, lon: +x.lon })));
    } catch {
      setResults([]);
    }
    setBusy(false);
  };

  const togglePri = (p: Priority) =>
    setF((s) => ({ ...s, priorities: s.priorities.includes(p) ? s.priorities.filter((x) => x !== p) : [...s.priorities, p] }));

  const submit = () => {
    if (!f.location) return setMsg(t("needLocation"));
    app.setFarm(f);
    nav({ to: "/environment" });
  };

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-8">
      <PageHeader title={t("setupTitle")} sub={t("setupSub")} />

      <section className="mb-8">
        <SectionTitle>📍 {t("secLocation")}</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <GhostButton onClick={gps} aria-pressed={mode === "gps"}><MapPin className="h-5 w-5 text-primary" />{t("useCurrent")}</GhostButton>
          <GhostButton onClick={() => setMode("map")} aria-pressed={mode === "map"}><MapIcon className="h-5 w-5 text-primary" />{t("pickMap")}</GhostButton>
          <GhostButton onClick={() => setMode("search")} aria-pressed={mode === "search"}><Search className="h-5 w-5 text-primary" />{t("search")}</GhostButton>
        </div>

        {mode === "gps" && busy && <p className="mt-3 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("locating")}</p>}

        {mode === "map" && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-muted-foreground">{t("mapHint")}</p>
            <ClientOnly fallback={<div className="h-72 rounded-2xl bg-muted" />}>
              <Suspense fallback={<div className="h-72 rounded-2xl bg-muted" />}>
                <MapPicker value={f.location} onPick={(lat, lon) => setLoc(lat, lon)} />
              </Suspense>
            </ClientOnly>
          </div>
        )}

        {mode === "search" && (
          <div className="mt-4">
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); search(); }}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPh")} aria-label={t("search")} className="min-h-12 flex-1 rounded-2xl border bg-card px-4 text-base outline-none focus:ring-4 focus:ring-ring/30" />
              <GhostButton type="submit" aria-label={t("search")}>{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}</GhostButton>
            </form>
            {results && results.length === 0 && <p className="mt-2 text-sm text-muted-foreground">{t("noResults")}</p>}
            {results && results.length > 0 && (
              <ul className="mt-2 divide-y rounded-2xl border bg-card">
                {results.map((r, i) => (
                  <li key={i}><button className="w-full px-4 py-3 text-left hover:bg-muted" onClick={() => { setLoc(r.lat, r.lon, r.name); setResults(null); }}>{r.name}</button></li>
                ))}
              </ul>
            )}
          </div>
        )}

        {msg && <p className="mt-3 rounded-xl bg-sun-soft px-4 py-2 text-sm" role="alert">{msg}</p>}

        {f.location && (
          <Card className="mt-4 border-primary/40 bg-primary-soft">
            <p className="text-sm text-muted-foreground">{t("selectedLoc")}</p>
            <p className="text-lg font-semibold">📍 {f.location.name}</p>
            <button className="mt-1 flex items-center gap-1 text-sm text-muted-foreground" onClick={() => setDetails(!details)} aria-expanded={details}>
              {t("locDetails")} <ChevronDown className="h-4 w-4" />
            </button>
            {details && <p className="mt-1 text-sm">{t("latitude")}: {n(f.location.lat.toFixed(4))} · {t("longitude")}: {n(f.location.lon.toFixed(4))}</p>}
          </Card>
        )}
      </section>

      <section className="mb-8">
        <SectionTitle>{t("secCrop")}</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          {CURRENT_CROP_OPTIONS.map((o) => (
            <ChoiceCard key={o.id} emoji={o.emoji} label={t(`crop_${o.id}` as TKey)} selected={f.currentCrop === o.id} onClick={() => setF({ ...f, currentCrop: o.id })} />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <SectionTitle>{t("secSoil")}</SectionTitle>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {([["loamy", "🌱"], ["clay", "🟤"], ["sandy", "🏜️"], ["other", "➕"], ["unknown", "❓"]] as [SoilChoice, string][]).map(([s, e]) => (
            <ChoiceCard key={s} emoji={e} label={t(`soil_${s}` as TKey)} selected={f.soil === s} onClick={() => setF({ ...f, soil: s })} />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <SectionTitle>{t("secIrr")}</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([["available", "💧"], ["limited", "💧"], ["none", "🚫"], ["unknown", "❓"]] as [IrrigationChoice, string][]).map(([s, e]) => (
            <ChoiceCard key={s} emoji={e} label={t(`irr_${s}` as TKey)} selected={f.irrigation === s} onClick={() => setF({ ...f, irrigation: s })} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SectionTitle sub={t("priHint")}>{t("secPri")}</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([["soil", "🌱"], ["water", "💧"], ["climate", "🌦️"], ["yield", "🌾"]] as [Priority, string][]).map(([p, e]) => (
            <ChoiceCard key={p} emoji={e} label={t(`pri_${p}` as TKey)} selected={f.priorities.includes(p)} onClick={() => togglePri(p)} />
          ))}
        </div>
        <button className="mt-3 text-sm font-medium text-muted-foreground underline" onClick={() => setF({ ...f, priorities: [] })}>{t("skip")}</button>
      </section>

      <PrimaryButton onClick={submit}>{t("continue")}</PrimaryButton>
    </main>
  );
}
