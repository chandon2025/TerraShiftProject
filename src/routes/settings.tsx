import { createFileRoute, Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { AppShell, Card, PageHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — TerraShift" },
      { name: "description", content: "Change language, farm details, and read about TerraShift's NASA data sources and privacy." },
      { property: "og:title", content: "Settings — TerraShift" },
      { property: "og:description", content: "Language, data sources, privacy and help for TerraShift." },
    ],
  }),
  component: () => <AppShell><SettingsPage /></AppShell>,
});

function SettingsPage() {
  const { t } = useT();
  const app = useApp();
  return (
    <>
      <PageHeader title={t("setTitle")} />
      <div className="grid gap-4">
        <Card>
          <h2 className="mb-3 font-semibold">🌐 {t("setLang")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {([["bn", "🇧🇩 বাংলা"], ["en", "🇬🇧 English"]] as const).map(([l, label]) => (
              <button key={l} onClick={() => app.setLang(l)} aria-pressed={app.lang === l} className={`min-h-14 rounded-2xl border-2 font-semibold ${app.lang === l ? "border-primary bg-primary-soft" : ""}`}>{label}</button>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">📍 {t("setLoc")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("setLocBody")}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link to="/setup" className="rounded-xl border px-4 py-2 font-medium">{t("changeFarm")}</Link>
            <button onClick={() => app.reset()} className="rounded-xl border border-destructive/40 px-4 py-2 font-medium text-destructive">{t("resetAll")}</button>
          </div>
        </Card>
        <Card><h2 className="font-semibold">ℹ️ {t("about")}</h2><p className="mt-1 text-sm">{t("aboutBody")}</p></Card>
        <Card>
          <h2 className="font-semibold">🛰️ {t("sources")}</h2>
          <p className="mt-1 text-sm">{t("src_power")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("src_merra")}</p>
          <a className="mt-1 inline-block text-sm text-nasa underline" href="https://power.larc.nasa.gov" target="_blank" rel="noreferrer">{t("src_link")}</a>
        </Card>
        <Card><h2 className="font-semibold">🔒 {t("privacy")}</h2><p className="mt-1 text-sm">{t("privacyBody")}</p></Card>
        <Card><h2 className="font-semibold">❓ {t("help")}</h2><p className="mt-1 text-sm">{t("helpBody")}</p></Card>
      </div>
    </>
  );
}
