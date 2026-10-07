import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import hero from "@/assets/hero-fields.jpg";
import { useApp, isFarmReady } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { PrimaryButton, LoadingState } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TerraShift — Choose your language" },
      { name: "description", content: "TerraShift helps Bangladesh farmers explore crop rotation using NASA Earth observation data." },
      { property: "og:title", content: "TerraShift — Adapting Farms with NASA Data" },
      { property: "og:description", content: "Explore crop rotation strategies with NASA Earth observation data, in Bangla or English." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const app = useApp();
  const { t } = useT();
  const nav = useNavigate();
  const [step, setStep] = useState(0);

  if (!app.hydrated) return <LoadingState />;

  if (!app.lang) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5">
        <div className="mb-2 text-5xl" aria-hidden>🌱</div>
        <h1 className="text-center text-2xl font-bold">Choose Your Language</h1>
        <p className="mb-8 text-center font-bangla text-xl text-muted-foreground">ভাষা নির্বাচন করুন</p>
        <div className="grid w-full max-w-md gap-4">
          {[
            { l: "bn" as const, flag: "🇧🇩", label: "বাংলা" },
            { l: "en" as const, flag: "🇬🇧", label: "English" },
          ].map((o) => (
            <button key={o.l} onClick={() => app.setLang(o.l)} lang={o.l} className="flex min-h-24 items-center gap-5 rounded-2xl border-2 bg-card px-6 text-2xl font-semibold shadow-card transition hover:border-primary">
              <span className="text-4xl" aria-hidden>{o.flag}</span>{o.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (app.onboarded) return <Navigate to={isFarmReady(app.farm) ? "/home" : "/setup"} />;

  const cards = [
    { e: "🛰️", title: t("ob1Title"), body: t("ob1Body") },
    { e: "🌱", title: t("ob2Title"), body: t("ob2Body") },
    { e: "📊", title: t("ob3Title"), body: t("ob3Body") },
  ];
  const c = cards[step]!;
  const last = step === cards.length - 1;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="relative h-[42vh] md:h-auto md:w-1/2">
        <img src={hero} alt="" width={1280} height={896} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute bottom-6 left-6 right-6 text-nasa-foreground">
          <p className="mb-2 inline-block rounded-full bg-nasa px-3 py-1 text-xs font-semibold">🛰️ {t("poweredBy")}</p>
          <h1 className="text-4xl font-bold">🌱 {t("appName")}</h1>
          <p className="mt-1 text-lg opacity-90">{t("tagline")}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-8 px-6 py-8 md:justify-center md:px-14">
        <div key={step} className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-4xl" aria-hidden>{c.e}</div>
          <h2 className="text-2xl font-bold">{c.title}</h2>
          <p className="mt-2 text-lg text-muted-foreground">{c.body}</p>
        </div>
        <div>
          <div className="mb-6 flex gap-2" aria-hidden>
            {cards.map((_, i) => <span key={i} className={cn("h-2 rounded-full transition-all", i === step ? "w-8 bg-primary" : "w-2 bg-border")} />)}
          </div>
          <PrimaryButton
            onClick={() => {
              if (last) {
                app.setOnboarded();
                nav({ to: "/setup" });
              } else setStep(step + 1);
            }}
          >
            {last ? t("getStarted") : t("next")}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
