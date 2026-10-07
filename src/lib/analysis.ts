// Transparent, rule-based analysis. Every number produced here can be traced
// to a documented rule shown to the user in the UI.
import { CROPS, CURRENT_CROP_OPTIONS, ROTATIONS, type Crop, type Level } from "./crops";
import type { NasaObs } from "./nasa.functions";
import type { Farm, Lang } from "./store";

type Bi = { en: string; bn: string };
const lvNum: Record<Level, number> = { low: 1, moderate: 2, high: 3 };

export function currentCropObj(farm: Farm): Crop | null {
  const opt = CURRENT_CROP_OPTIONS.find((o) => o.id === farm.currentCrop);
  return opt?.crop ? (CROPS[opt.crop] ?? null) : null;
}

export function moistureClass(w: number): "sm_dry" | "sm_moderate" | "sm_wet" | "sm_vwet" {
  if (w < 0.3) return "sm_dry";
  if (w < 0.6) return "sm_moderate";
  if (w < 0.8) return "sm_wet";
  return "sm_vwet";
}

export interface Factor { key: "f_moist" | "f_temp" | "f_water" | "f_rotation"; points: number; max: 25; note: Bi }

export function farmScore(farm: Farm, obs: NasaObs | undefined): { score: number; factors: Factor[] } | null {
  const crop = currentCropObj(farm);
  if (!obs || !crop) return null;
  const factors: Factor[] = [];
  const pct = (v: number) => Math.round(v * 100);

  if (obs.soilWetness !== null) {
    const w = obs.soilWetness;
    let pts = 25;
    if (w < 0.3) pts = (25 * w) / 0.3;
    else if (w > 0.8 && crop.water !== "high") pts = Math.max(0, 25 * (1 - (w - 0.8) / 0.2));
    factors.push({
      key: "f_moist", points: Math.round(pts), max: 25,
      note: w < 0.3
        ? { en: `Surface soil is dry (${pct(w)}%). Crops may need extra water.`, bn: `উপরের মাটি শুকনো (${pct(w)}%)। ফসলে বাড়তি পানি লাগতে পারে।` }
        : pts < 25
          ? { en: `Surface soil is very wet (${pct(w)}%) — a waterlogging risk for ${crop.name.en.toLowerCase()}.`, bn: `উপরের মাটি খুব ভেজা (${pct(w)}%) — ${crop.name.bn}-এর জন্য জলাবদ্ধতার ঝুঁকি।` }
          : { en: `Surface soil moisture (${pct(w)}%) is in a workable range for your crop.`, bn: `উপরের মাটির আর্দ্রতা (${pct(w)}%) আপনার ফসলের জন্য উপযোগী সীমায় আছে।` },
    });
  }

  if (obs.tempMean !== null) {
    const t = obs.tempMean;
    const [lo, hi] = crop.tempRange;
    const diff = t < lo ? lo - t : t > hi ? t - hi : 0;
    const pts = Math.max(0, 25 - 5 * diff);
    const tr = t.toFixed(1);
    factors.push({
      key: "f_temp", points: Math.round(pts), max: 25,
      note: diff === 0
        ? { en: `Average ${tr}°C is within the favourable range for ${crop.name.en} (${lo}–${hi}°C).`, bn: `গড় ${tr}°সে, যা ${crop.name.bn}-এর অনুকূল সীমার (${lo}–${hi}°সে) মধ্যে।` }
        : { en: `Average ${tr}°C is outside the favourable range for ${crop.name.en} (${lo}–${hi}°C).`, bn: `গড় ${tr}°সে, যা ${crop.name.bn}-এর অনুকূল সীমার (${lo}–${hi}°সে) বাইরে।` },
    });
  }

  if (obs.precipTotal !== null) {
    const p = obs.precipTotal;
    const rain = p < 30 ? 0 : p < 100 ? 1 : p < 200 ? 2 : 3;
    const irr = farm.irrigation === "available" ? 2 : farm.irrigation === "limited" ? 1 : 0;
    const need = lvNum[crop.water];
    const pts = Math.min(1, (rain + irr) / need) * 25;
    factors.push({
      key: "f_water", points: Math.round(pts), max: 25,
      note: pts >= 25
        ? { en: `Recent rainfall (${Math.round(p)} mm) and your irrigation access appear to cover this crop's water need.`, bn: `সাম্প্রতিক বৃষ্টি (${Math.round(p)} মিমি) ও আপনার সেচ সুবিধা এই ফসলের পানির চাহিদা মেটাতে পারে বলে মনে হয়।` }
        : { en: `Recent rainfall (${Math.round(p)} mm) plus your irrigation access may not fully meet this crop's ${crop.water} water need.`, bn: `সাম্প্রতিক বৃষ্টি (${Math.round(p)} মিমি) ও সেচ সুবিধা এই ফসলের পানির চাহিদা পুরোপুরি নাও মেটাতে পারে।` },
    });
  }

  const rot = crop.fixesNitrogen ? 25 : crop.family === "cereal" ? (crop.id.startsWith("rice") ? 10 : 15) : 20;
  factors.push({
    key: "f_rotation", points: rot, max: 25,
    note: crop.fixesNitrogen
      ? { en: "Legumes add nitrogen to soil and break cereal cycles.", bn: "ডাল জাতীয় ফসল মাটিতে নাইট্রোজেন যোগ করে এবং দানাশস্যের একটানা চক্র ভাঙে।" }
      : crop.id.startsWith("rice")
        ? { en: "Repeated rice can deplete soil. Adding a different crop may help.", bn: "বারবার ধান চাষে মাটির উর্বরতা কমতে পারে। ভিন্ন ফসল যোগ করলে উপকার হতে পারে।" }
        : { en: "A non-rice crop adds some diversity to the land.", bn: "ধান-বহির্ভূত ফসল জমিতে কিছুটা বৈচিত্র্য আনে।" },
  });

  const max = factors.length * 25;
  const sum = factors.reduce((s, f) => s + f.points, 0);
  return { score: Math.round((sum / max) * 100), factors };
}

export interface PlanEval {
  id: string;
  crops: (Crop | null)[];
  diversity: Level;
  water: Level;
  soilHealth: Level;
  matched: string[];
  envNote: Bi;
  waterNote: Bi;
  soilNote: Bi;
  reasons: Bi[];
}

export function evaluatePlans(farm: Farm, obs: NasaObs | undefined): PlanEval[] {
  const current = currentCropObj(farm);
  const out = ROTATIONS.map((r) => {
    const crops: (Crop | null)[] = r.seq.map((id) => (id ? (CROPS[id] ?? null) : null));
    const present = crops.filter((c): c is Crop => !!c);
    const fams = new Set(present.map((c) => c.family)).size;
    const diversity: Level = fams >= 3 ? "high" : fams === 2 ? "moderate" : "low";
    const rabi = crops[0];
    const water: Level = rabi ? rabi.water : "low";
    const legume = present.find((c) => c.fixesNitrogen);
    const soilHealth: Level = legume ? "high" : fams >= 2 ? "moderate" : "low";
    const soil = farm.soil && ["loamy", "clay", "sandy"].includes(farm.soil) ? (farm.soil as "loamy" | "clay" | "sandy") : null;
    const soilFit = soil ? present.filter((c) => c.goodSoils.includes(soil)).length : null;

    const matched: string[] = [];
    if (farm.priorities.includes("soil") && legume) matched.push("soil");
    if (farm.priorities.includes("water") && water !== "high") matched.push("water");
    if (farm.priorities.includes("climate") && fams >= 2 && water !== "high") matched.push("climate");
    if (farm.priorities.includes("yield") && (soilFit === null ? present.some((c) => c.family === "cereal") : soilFit === present.length)) matched.push("yield");

    const waterNote: Bi = water === "high"
      ? { en: `${rabi!.name.en} in the dry season usually depends on irrigation.`, bn: `শুষ্ক মৌসুমে ${rabi!.name.bn} সাধারণত সেচের ওপর নির্ভর করে।` }
      : water === "moderate"
        ? { en: `${rabi!.name.en} needs moderate dry-season water — less than Boro rice.`, bn: `${rabi!.name.bn}-এ শুষ্ক মৌসুমে মাঝারি পানি লাগে — বোরো ধানের চেয়ে কম।` }
        : { en: `${rabi ? rabi.name.en : "This plan"} uses little water in the dry season.`, bn: `${rabi ? rabi.name.bn : "এই পরিকল্পনা"} শুষ্ক মৌসুমে কম পানি ব্যবহার করে।` };

    const soilNote: Bi = legume
      ? { en: `${legume.name.en} is a legume that adds nitrogen to the soil.`, bn: `${legume.name.bn} একটি ডাল জাতীয় ফসল, যা মাটিতে নাইট্রোজেন যোগ করে।` }
      : fams >= 2
        ? { en: "Mixing crop types may reduce pest and nutrient build-up.", bn: "ভিন্ন ধরনের ফসল মেশালে পোকামাকড় ও পুষ্টি ঘাটতির ঝুঁকি কমতে পারে।" }
        : { en: "Only one crop type — little rotation benefit for soil.", bn: "শুধু এক ধরনের ফসল — মাটির জন্য ফসলচক্রের সুবিধা কম।" };

    let envNote: Bi = { en: "Environmental data not available yet.", bn: "পরিবেশগত তথ্য এখনো পাওয়া যায়নি।" };
    if (obs?.soilWetness != null) {
      const w = obs.soilWetness;
      if (w < 0.3 && water === "high") envNote = { en: "Your area's soil is currently dry; a high-water dry-season crop would rely heavily on irrigation.", bn: "আপনার এলাকার মাটি এখন শুকনো; শুষ্ক মৌসুমে বেশি পানির ফসল সেচের ওপর অনেক নির্ভর করবে।" };
      else if (w < 0.3) envNote = { en: "Your area's soil is currently dry; this plan's lower-water dry-season crop may suit that.", bn: "আপনার এলাকার মাটি এখন শুকনো; এই পরিকল্পনার কম পানির ফসল তার সাথে মানাতে পারে।" };
      else if (w >= 0.8) envNote = { en: "Soil in your area is currently very wet; plan sowing after fields drain.", bn: "আপনার এলাকার মাটি এখন খুব ভেজা; জমির পানি সরে গেলে বপনের পরিকল্পনা করুন।" };
      else envNote = { en: "Current soil moisture in your area is in a moderate range.", bn: "আপনার এলাকার বর্তমান মাটির আর্দ্রতা মাঝারি সীমায় আছে।" };
    }

    const reasons: Bi[] = [];
    if (current && present.some((c) => c.family === current.family && (c.id === current.id || current.id.startsWith("rice") === c.id.startsWith("rice"))))
      reasons.push({ en: `It includes a crop similar to what you grow now (${current.name.en}).`, bn: `এতে আপনার বর্তমান ফসলের (${current.name.bn}) মতো একটি ফসল আছে।` });
    if (soil && soilFit !== null)
      reasons.push({ en: `${soilFit} of ${present.length} crops are generally suited to ${soil} soil.`, bn: `${present.length}টির মধ্যে ${soilFit}টি ফসল সাধারণত ${soil === "loamy" ? "দোআঁশ" : soil === "clay" ? "এঁটেল" : "বেলে"} মাটিতে ভালো হয়।` });
    if (farm.irrigation === "none" || farm.irrigation === "limited")
      reasons.push(water === "high"
        ? { en: "Note: you reported limited/no irrigation, and this plan needs dry-season irrigation.", bn: "লক্ষ করুন: আপনি সীমিত/সেচ নেই জানিয়েছেন, অথচ এই পরিকল্পনায় শুষ্ক মৌসুমে সেচ লাগে।" }
        : { en: "It uses less dry-season water, which fits limited irrigation.", bn: "এতে শুষ্ক মৌসুমে কম পানি লাগে, যা সীমিত সেচের সাথে মানানসই।" });
    if (matched.length) reasons.push({ en: `It matches ${matched.length} of your priorities.`, bn: `এটি আপনার ${matched.length}টি অগ্রাধিকারের সাথে মেলে।` });
    reasons.push(envNote);

    return { id: r.id, crops, diversity, water, soilHealth, matched, envNote, waterNote, soilNote, reasons };
  });

  return out.sort((a, b) => b.matched.length - a.matched.length || lvNum[b.diversity] - lvNum[a.diversity]);
}

export function insights(farm: Farm, obs: NasaObs | undefined, plans: PlanEval[], lang: Lang): string[] {
  const L = (b: Bi) => b[lang];
  const out: string[] = [];
  if (obs?.soilWetness != null) {
    const w = Math.round(obs.soilWetness * 100);
    out.push(L(w < 30
      ? { en: `Surface soil moisture in your area is currently low (${w}%).`, bn: `আপনার এলাকায় উপরের মাটির আর্দ্রতা এখন কম (${w}%)।` }
      : w >= 80
        ? { en: `Surface soil in your area is currently very wet (${w}%).`, bn: `আপনার এলাকায় উপরের মাটি এখন খুব ভেজা (${w}%)।` }
        : { en: `Surface soil moisture in your area is moderate (${w}%).`, bn: `আপনার এলাকায় উপরের মাটির আর্দ্রতা মাঝারি (${w}%)।` }));
  }
  if (obs?.precipTotal != null) {
    const p = Math.round(obs.precipTotal);
    out.push(L({ en: `About ${p} mm of rain fell in your area over the last ${obs.days} days with data.`, bn: `তথ্যসহ শেষ ${obs.days} দিনে আপনার এলাকায় প্রায় ${p} মিমি বৃষ্টি হয়েছে।` }));
  }
  if (farm.priorities.includes("water"))
    out.push(L({ en: "You chose water saving — plans with lentil, mustard or mungbean use less dry-season water than Boro rice.", bn: "আপনি পানি সাশ্রয় বেছেছেন — মসুর, সরিষা বা মুগের পরিকল্পনায় বোরো ধানের চেয়ে শুষ্ক মৌসুমে কম পানি লাগে।" }));
  else if (farm.priorities.includes("soil"))
    out.push(L({ en: "You chose soil health — plans that include a legume can add nitrogen to the soil.", bn: "আপনি মাটির স্বাস্থ্য বেছেছেন — ডাল জাতীয় ফসলসহ পরিকল্পনা মাটিতে নাইট্রোজেন যোগ করতে পারে।" }));
  if (plans[0]) {
    const names = plans[0].crops.map((c) => (c ? c.name[lang] : lang === "bn" ? "পতিত" : "Fallow")).join(" → ");
    out.push(L({ en: `${names} gives a different crop sequence to consider alongside what you grow now.`, bn: `${names} — বর্তমান চাষের পাশাপাশি বিবেচনা করার মতো একটি ভিন্ন ফসলের ক্রম।` }));
  }
  out.push(L({ en: "Discuss any change with your local agriculture extension officer before implementing it.", bn: "যেকোনো পরিবর্তনের আগে স্থানীয় উপ-সহকারী কৃষি কর্মকর্তার সাথে আলোচনা করুন।" }));
  return out.slice(0, 5);
}
