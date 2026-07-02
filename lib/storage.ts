import type {
  Analysis,
  CheckIn,
  FoodMemoryItem,
  StoredAnalysis,
  UserProfile,
} from "./types";

const CHECK_INS_KEY = "cut-checkins";
const ANALYSES_KEY = "cut-checkin-analyses";
const PROFILE_KEY = "cut-checkin-profile";
const FOOD_MEMORY_KEY = "cut-food-memory";

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readJsonArray<T>(key: string): T[] {
  const value = readJson<unknown>(key, []);
  return Array.isArray(value) ? (value as T[]) : [];
}

export function loadCheckIns() {
  return readJsonArray<CheckIn>(CHECK_INS_KEY);
}

export function saveCheckIns(checkIns: CheckIn[]) {
  localStorage.setItem(CHECK_INS_KEY, JSON.stringify(checkIns));
}

export function loadStoredAnalyses() {
  return readJsonArray<StoredAnalysis>(ANALYSES_KEY);
}

export function findStoredAnalysis(date: string, signature: string) {
  return loadStoredAnalyses().find(
    (item) => item.date === date && item.signature === signature
  );
}

export function saveStoredAnalysis(date: string, signature: string, analysis: Analysis) {
  const next = [
    ...loadStoredAnalyses().filter(
      (item) => !(item.date === date && item.signature === signature)
    ),
    { date, signature, analysis },
  ];

  localStorage.setItem(ANALYSES_KEY, JSON.stringify(next));
}

export function loadProfile(fallback: UserProfile) {
  const profile = readJson<Partial<UserProfile>>(PROFILE_KEY, fallback);

  return {
    ...fallback,
    ...profile,
    cutConcerns: Array.isArray(profile.cutConcerns) ? profile.cutConcerns : [],
    cutConcernNotes: profile.cutConcernNotes || "",
  };
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function normalizeFoodMemoryValue(value: string) {
  return value.trim().toLowerCase();
}

function matchesFoodMemoryItem(item: FoodMemoryItem, incoming: FoodMemoryItem) {
  const incomingNames = new Set(
    [incoming.name, ...incoming.aliases].map(normalizeFoodMemoryValue).filter(Boolean)
  );
  const existingNames = [item.name, ...item.aliases].map(normalizeFoodMemoryValue);

  return existingNames.some((value) => incomingNames.has(value));
}

export function loadFoodMemory() {
  return readJsonArray<FoodMemoryItem>(FOOD_MEMORY_KEY);
}

export function saveFoodMemory(items: FoodMemoryItem[]) {
  localStorage.setItem(FOOD_MEMORY_KEY, JSON.stringify(items));
}

export function addOrUpdateFoodMemory(item: FoodMemoryItem) {
  const existing = loadFoodMemory();
  const index = existing.findIndex((memory) => matchesFoodMemoryItem(memory, item));

  if (index === -1) {
    const next = [...existing, item].sort((a, b) => b.timesSeen - a.timesSeen);
    saveFoodMemory(next);
    return next;
  }

  const current = existing[index];
  const aliases = Array.from(new Set([...current.aliases, ...item.aliases]));
  const nextItem: FoodMemoryItem = {
    ...current,
    ...item,
    id: current.id,
    name: item.name || current.name,
    aliases,
    source: current.source === "manual" ? "manual" : item.source,
    createdAt: current.createdAt,
    timesSeen: Math.max(current.timesSeen, item.timesSeen),
    updatedAt: item.updatedAt,
  };
  const next = [
    ...existing.slice(0, index),
    nextItem,
    ...existing.slice(index + 1),
  ].sort((a, b) => b.timesSeen - a.timesSeen);

  saveFoodMemory(next);
  return next;
}

export function deleteFoodMemory(id: string) {
  const next = loadFoodMemory().filter((item) => item.id !== id);
  saveFoodMemory(next);
  return next;
}
