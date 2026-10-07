import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "bn";
export type SoilChoice = "loamy" | "clay" | "sandy" | "other" | "unknown";
export type IrrigationChoice = "available" | "limited" | "none" | "unknown";
export type Priority = "soil" | "water" | "climate" | "yield";

export interface Farm {
  location: { name: string; lat: number; lon: number } | null;
  currentCrop: string | null; // option id from CURRENT_CROP_OPTIONS
  soil: SoilChoice | null;
  irrigation: IrrigationChoice | null;
  priorities: Priority[];
}

interface State {
  lang: Lang | null;
  onboarded: boolean;
  farm: Farm;
  compare: string[];
}

const empty: State = {
  lang: null,
  onboarded: false,
  farm: { location: null, currentCrop: null, soil: null, irrigation: null, priorities: [] },
  compare: [],
};

const KEY = "terrashift:v1";

interface Ctx extends State {
  hydrated: boolean;
  setLang: (l: Lang) => void;
  setOnboarded: () => void;
  setFarm: (f: Farm) => void;
  setCompare: (ids: string[]) => void;
  reset: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(empty);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...empty, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(state));
    if (state.lang) document.documentElement.lang = state.lang;
  }, [state, hydrated]);

  const value: Ctx = {
    ...state,
    hydrated,
    setLang: (lang) => setState((s) => ({ ...s, lang })),
    setOnboarded: () => setState((s) => ({ ...s, onboarded: true })),
    setFarm: (farm) => setState((s) => ({ ...s, farm })),
    setCompare: (compare) => setState((s) => ({ ...s, compare })),
    reset: () => setState((s) => ({ ...empty, lang: s.lang })),
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}

export function isFarmReady(f: Farm) {
  return !!f.location;
}
