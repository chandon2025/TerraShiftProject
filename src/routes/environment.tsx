import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useNasa } from "@/lib/useNasa";
import { useApp } from "@/lib/store";
import { AppShell, Card, ErrorState, LoadingState, PageHeader } from "@/components/ui-kit";
import { NasaCards } from "@/components/NasaCards";

export const Route = createFileRoute("/environment")({
  head: () => ({
    meta: [
      { title: "Environmental conditions — TerraShift" },
      { name: "description", content: "Recent NASA temperature, rainfall and soil moisture estimates for your farm's area." },
      { property: "og:title", content: "Environmental conditions — TerraShift" },
      { property: "og:description", content: "NASA POWER satellite and model estimates for farms in Bangladesh." },
    ],
  }),
  component: () => <AppShell><Env /></AppShell>,
});

function Env() {
  const { t, n } = useT();
  const { farm } = useApp();
  const q = useNasa();
  return (
    <>
      <PageHeader title={t("envTitle")} sub={t("envSub")} />
      <p className="mb-4 font-medium">📍 {farm.location?.name}</p>
      {q.isLoading && <LoadingState />}
      {q.isError && <ErrorState onRetry={() => q.refetch()} />}
      {q.data && (
        <>
          <p className="mb-3 text-sm text-muted-foreground">{t("last30", { n: q.data.days })}</p>
          <NasaCards obs={q.data} />
        </>
      )}
      <Card className="mt-6 border-nasa/20 bg-nasa-soft">
        <h2 className="flex items-center gap-2 font-semibold text-nasa"><Info className="h-5 w-5" />{t("aboutData")}</h2>
        <p className="mt-2 text-sm">{t("aboutDataBody")}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("src_merra")} · <a className="underline" href="https://power.larc.nasa.gov" target="_blank" rel="noreferrer">{t("src_link")}</a></p>
        {q.data && <p className="mt-1 text-xs text-muted-foreground">{n(q.data.lat)}, {n(q.data.lon)}</p>}
      </Card>
    </>
  );
}
