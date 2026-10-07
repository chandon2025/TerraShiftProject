import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface NasaObs {
  lat: number;
  lon: number;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;
  days: number;
  tempMean: number | null; // °C
  precipTotal: number | null; // mm over period
  soilWetness: number | null; // 0–1 surface soil wetness
  daily: { date: string; t: number | null; p: number | null; w: number | null }[];
  fetchedAt: string;
}

const cache = new Map<string, { at: number; data: NasaObs }>();

function ymd(d: Date) {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

// NASA POWER (Prediction Of Worldwide Energy Resources) daily point API.
// Public, no credentials. Meteorology from NASA GMAO MERRA-2 (~0.5° x 0.625° grid).
export const getNasaConditions = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) }).parse(d))
  .handler(async ({ data }): Promise<NasaObs> => {
    const lat = Math.round(data.lat * 100) / 100;
    const lon = Math.round(data.lon * 100) / 100;
    const key = `${lat},${lon}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 6 * 3600 * 1000) return hit.data;

    const end = new Date();
    const start = new Date(end.getTime() - 40 * 86400000);
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,GWETTOP&community=AG&longitude=${lon}&latitude=${lat}&start=${ymd(start)}&end=${ymd(end)}&format=JSON`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NASA POWER request failed (${res.status})`);
    const json = (await res.json()) as {
      properties: { parameter: Record<string, Record<string, number>> };
    };
    const p = json.properties.parameter;
    const clean = (v: number | undefined) => (v === undefined || v <= -990 ? null : v);
    const T = p["T2M"] ?? {}, P = p["PRECTOTCORR"] ?? {}, W = p["GWETTOP"] ?? {};
    const dates = Object.keys(T).sort();
    const all = dates.map((k) => ({
      date: `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`,
      t: clean(T[k]),
      p: clean(P[k]),
      w: clean(W[k]),
    }));
    // Keep only up to the last day with complete data, then the last 30 days.
    let lastIdx = all.length - 1;
    while (lastIdx >= 0 && (all[lastIdx]!.t === null || all[lastIdx]!.p === null || all[lastIdx]!.w === null)) lastIdx--;
    const daily = all.slice(Math.max(0, lastIdx - 29), lastIdx + 1);
    if (daily.length === 0) throw new Error("NASA POWER returned no valid data for this period");

    const vals = (k: "t" | "p" | "w") => daily.map((d) => d[k]).filter((v): v is number => v !== null);
    const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
    const t = vals("t"), pr = vals("p"), w = vals("w");

    const out: NasaObs = {
      lat, lon,
      periodStart: daily[0]!.date,
      periodEnd: daily[daily.length - 1]!.date,
      days: daily.length,
      tempMean: mean(t),
      precipTotal: pr.length ? pr.reduce((s, v) => s + v, 0) : null,
      soilWetness: mean(w),
      daily,
      fetchedAt: new Date().toISOString(),
    };
    cache.set(key, { at: Date.now(), data: out });
    return out;
  });
