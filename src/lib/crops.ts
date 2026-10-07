// Extensible crop database. Characteristics are broad, qualitative categories
// drawn from general agronomic guidance used in Bangladesh (BARI/BRRI crop
// production handbooks, FAO crop water requirement tables). They are
// intentionally coarse (low / moderate / high) rather than precise numbers.

export type Level = "low" | "moderate" | "high";
export type Family = "cereal" | "legume" | "tuber" | "oilseed" | "fibre" | "vegetable";
export type Season = "rabi" | "kharif1" | "kharif2";
export type Soil = "loamy" | "clay" | "sandy";

export interface Crop {
  id: string;
  name: { en: string; bn: string };
  emoji: string;
  family: Family;
  seasons: Season[];
  water: Level; // relative water requirement
  goodSoils: Soil[]; // soils generally considered suitable
  fixesNitrogen: boolean;
  tempRange: [number, number]; // broad favourable mean air temperature, °C
}

export const CROPS: Record<string, Crop> = {
  rice_boro: { id: "rice_boro", name: { en: "Boro Rice", bn: "বোরো ধান" }, emoji: "🌾", family: "cereal", seasons: ["rabi"], water: "high", goodSoils: ["clay", "loamy"], fixesNitrogen: false, tempRange: [20, 35] },
  rice_aman: { id: "rice_aman", name: { en: "Aman Rice", bn: "আমন ধান" }, emoji: "🌾", family: "cereal", seasons: ["kharif2"], water: "high", goodSoils: ["clay", "loamy"], fixesNitrogen: false, tempRange: [20, 35] },
  rice_aus: { id: "rice_aus", name: { en: "Aus Rice", bn: "আউশ ধান" }, emoji: "🌾", family: "cereal", seasons: ["kharif1"], water: "moderate", goodSoils: ["clay", "loamy"], fixesNitrogen: false, tempRange: [22, 35] },
  wheat: { id: "wheat", name: { en: "Wheat", bn: "গম" }, emoji: "🌾", family: "cereal", seasons: ["rabi"], water: "moderate", goodSoils: ["loamy"], fixesNitrogen: false, tempRange: [12, 25] },
  maize: { id: "maize", name: { en: "Maize", bn: "ভুট্টা" }, emoji: "🌽", family: "cereal", seasons: ["rabi", "kharif1"], water: "moderate", goodSoils: ["loamy", "sandy"], fixesNitrogen: false, tempRange: [18, 32] },
  lentil: { id: "lentil", name: { en: "Lentil", bn: "মসুর ডাল" }, emoji: "🌱", family: "legume", seasons: ["rabi"], water: "low", goodSoils: ["loamy", "clay"], fixesNitrogen: true, tempRange: [15, 25] },
  mungbean: { id: "mungbean", name: { en: "Mungbean", bn: "মুগ ডাল" }, emoji: "🌱", family: "legume", seasons: ["kharif1"], water: "low", goodSoils: ["loamy", "sandy"], fixesNitrogen: true, tempRange: [25, 35] },
  potato: { id: "potato", name: { en: "Potato", bn: "আলু" }, emoji: "🥔", family: "tuber", seasons: ["rabi"], water: "moderate", goodSoils: ["loamy", "sandy"], fixesNitrogen: false, tempRange: [15, 25] },
  mustard: { id: "mustard", name: { en: "Mustard", bn: "সরিষা" }, emoji: "🌼", family: "oilseed", seasons: ["rabi"], water: "low", goodSoils: ["loamy", "clay"], fixesNitrogen: false, tempRange: [10, 25] },
  jute: { id: "jute", name: { en: "Jute", bn: "পাট" }, emoji: "🌿", family: "fibre", seasons: ["kharif1"], water: "moderate", goodSoils: ["loamy", "clay"], fixesNitrogen: false, tempRange: [24, 35] },
  vegetables: { id: "vegetables", name: { en: "Vegetables", bn: "শাকসবজি" }, emoji: "🥬", family: "vegetable", seasons: ["rabi", "kharif1"], water: "moderate", goodSoils: ["loamy", "sandy"], fixesNitrogen: false, tempRange: [15, 30] },
};

// Choices offered in farm setup, mapped to a representative crop.
export const CURRENT_CROP_OPTIONS = [
  { id: "rice", crop: "rice_aman", emoji: "🌾" },
  { id: "maize", crop: "maize", emoji: "🌽" },
  { id: "legume", crop: "lentil", emoji: "🌱" },
  { id: "potato", crop: "potato", emoji: "🥔" },
  { id: "vegetables", crop: "vegetables", emoji: "🥬" },
  { id: "other", crop: null, emoji: "➕" },
] as const;

// Common Bangladesh cropping patterns (Rabi → Kharif-1 → Kharif-2).
// null = fallow season.
export const ROTATIONS: { id: string; seq: (string | null)[] }[] = [
  { id: "p1", seq: ["rice_boro", null, "rice_aman"] },
  { id: "p2", seq: ["mustard", "rice_boro", "rice_aman"] },
  { id: "p3", seq: ["lentil", "rice_aus", "rice_aman"] },
  { id: "p4", seq: ["wheat", "mungbean", "rice_aman"] },
  { id: "p5", seq: ["maize", "mungbean", "rice_aman"] },
  { id: "p6", seq: ["potato", "rice_aus", "rice_aman"] },
  { id: "p7", seq: ["lentil", "jute", "rice_aman"] },
  { id: "p8", seq: ["vegetables", "mungbean", "rice_aman"] },
];
