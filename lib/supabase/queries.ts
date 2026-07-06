import type { SupabaseClient } from "@supabase/supabase-js";
import type { Analysis, CheckIn, FoodMemoryItem, StoredAnalysis, UserProfile } from "../types";

type ProfileRow = {
  id: string;
  name: string | null;
  age: number | null;
  height: string | null;
  sex: string | null;
  current_weight: number | null;
  goal_weight: number | null;
  goal_pace: UserProfile["goalPace"] | null;
  activity_level: string | null;
  preferred_protein_goal: string | null;
  dietary_preferences: string | null;
  favorite_restaurants: string | null;
  common_grocery_stores: string | null;
  favorite_foods: string | null;
  cut_concerns: string[] | null;
  cut_concern_notes: string | null;
};

type CheckInRow = {
  id: string;
  user_id: string;
  date: string;
  weight: string | null;
  steps: string | null;
  workout: string | null;
  workout_type: string | null;
  workout_duration: string | null;
  cardio_type: string | null;
  cardio_duration: string | null;
  breakfast?: string | null;
  lunch: string | null;
  dinner: string | null;
  snacks: string | null;
  alcohol: string | null;
  water: string | null;
  hunger: string | null;
  energy: string | null;
  mood: string | null;
  notes: string | null;
};

type AnalysisRow = {
  id: string;
  user_id: string;
  check_in_id: string | null;
  date: string;
  input_signature: string;
  analysis: Analysis;
};

type FoodMemoryRow = {
  id: string;
  user_id: string;
  name: string;
  aliases: string[] | null;
  category: FoodMemoryItem["category"];
  description: string | null;
  estimated_calories: string | null;
  estimated_protein: string | null;
  estimated_carbs: string | null;
  estimated_fat: string | null;
  confidence: FoodMemoryItem["confidence"] | null;
  source: FoodMemoryItem["source"];
  times_seen: number;
  last_seen: string | null;
  created_at: string;
  updated_at: string;
};

async function getUserId(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("User is not authenticated.");

  return user.id;
}

function stringToNumberOrNull(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberToString(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function mapProfileRow(row: ProfileRow): UserProfile {
  return {
    name: row.name || "",
    age: numberToString(row.age),
    height: row.height || "",
    sex: row.sex || "",
    currentWeight: numberToString(row.current_weight),
    goalWeight: numberToString(row.goal_weight),
    goalPace: row.goal_pace || "Moderate Cut",
    activityLevel: row.activity_level || "",
    preferredProteinGoal: row.preferred_protein_goal || "",
    dietaryPreferences: row.dietary_preferences || "",
    favoriteRestaurants: row.favorite_restaurants || "",
    commonGroceryStores: row.common_grocery_stores || "",
    favoriteFoods: row.favorite_foods || "",
    cutConcerns: row.cut_concerns || [],
    cutConcernNotes: row.cut_concern_notes || "",
  };
}

function mapProfileToRow(profile: UserProfile, userId: string) {
  return {
    id: userId,
    name: profile.name,
    age: stringToNumberOrNull(profile.age),
    height: profile.height,
    sex: profile.sex,
    current_weight: stringToNumberOrNull(profile.currentWeight),
    goal_weight: stringToNumberOrNull(profile.goalWeight),
    goal_pace: profile.goalPace,
    activity_level: profile.activityLevel,
    preferred_protein_goal: profile.preferredProteinGoal,
    dietary_preferences: profile.dietaryPreferences,
    favorite_restaurants: profile.favoriteRestaurants,
    common_grocery_stores: profile.commonGroceryStores,
    favorite_foods: profile.favoriteFoods,
    cut_concerns: profile.cutConcerns,
    cut_concern_notes: profile.cutConcernNotes,
  };
}

function mapCheckInRow(row: CheckInRow): CheckIn {
  return {
    date: row.date,
    weight: row.weight || "",
    steps: row.steps || "",
    workout: row.workout || "",
    workoutType: row.workout_type || "",
    workoutDuration: row.workout_duration || "",
    cardioType: row.cardio_type || "",
    cardioDuration: row.cardio_duration || "",
    breakfast: row.breakfast || "",
    lunch: row.lunch || "",
    dinner: row.dinner || "",
    snacks: row.snacks || "",
    alcohol: row.alcohol || "",
    water: row.water || "",
    hunger: row.hunger || "",
    energy: row.energy || "",
    mood: row.mood || "",
    notes: row.notes || "",
  };
}

function mapCheckInToRow(checkIn: CheckIn, userId: string) {
  return {
    user_id: userId,
    date: checkIn.date,
    weight: checkIn.weight,
    steps: checkIn.steps,
    workout: checkIn.workout,
    workout_type: checkIn.workoutType,
    workout_duration: checkIn.workoutDuration,
    cardio_type: checkIn.cardioType,
    cardio_duration: checkIn.cardioDuration,
    breakfast: checkIn.breakfast,
    lunch: checkIn.lunch,
    dinner: checkIn.dinner,
    snacks: checkIn.snacks,
    alcohol: checkIn.alcohol,
    water: checkIn.water,
    hunger: checkIn.hunger,
    energy: checkIn.energy,
    mood: checkIn.mood,
    notes: checkIn.notes,
  };
}

function mapAnalysisRow(row: AnalysisRow): StoredAnalysis {
  return {
    date: row.date,
    signature: row.input_signature,
    analysis: row.analysis,
  };
}

function mapFoodMemoryRow(row: FoodMemoryRow): FoodMemoryItem {
  return {
    id: row.id,
    name: row.name,
    aliases: row.aliases || [],
    category: row.category,
    description: row.description || "",
    estimatedCalories: row.estimated_calories || undefined,
    estimatedProtein: row.estimated_protein || undefined,
    estimatedCarbs: row.estimated_carbs || undefined,
    estimatedFat: row.estimated_fat || undefined,
    confidence: row.confidence || undefined,
    source: row.source,
    timesSeen: row.times_seen,
    lastSeen: row.last_seen || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFoodMemoryToRow(item: FoodMemoryItem, userId: string) {
  return {
    ...(isUuid(item.id) ? { id: item.id } : {}),
    user_id: userId,
    name: item.name,
    aliases: item.aliases,
    category: item.category,
    description: item.description,
    estimated_calories: item.estimatedCalories || null,
    estimated_protein: item.estimatedProtein || null,
    estimated_carbs: item.estimatedCarbs || null,
    estimated_fat: item.estimatedFat || null,
    confidence: item.confidence || null,
    source: item.source,
    times_seen: item.timesSeen,
    last_seen: item.lastSeen || null,
  };
}

export async function getProfile(supabase: SupabaseClient) {
  const userId = await getUserId(supabase);
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error) throw error;
  return data ? mapProfileRow(data) : null;
}

export async function upsertProfile(supabase: SupabaseClient, profile: UserProfile) {
  const userId = await getUserId(supabase);
  const { data, error } = await supabase
    .from("profiles")
    .upsert(mapProfileToRow(profile, userId), { onConflict: "id" })
    .select("*")
    .single<ProfileRow>();

  if (error) throw error;
  return mapProfileRow(data);
}

export async function getCheckIns(supabase: SupabaseClient) {
  const userId = await getUserId(supabase);
  const { data, error } = await supabase
    .from("check_ins")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true })
    .returns<CheckInRow[]>();

  if (error) throw error;
  return data.map(mapCheckInRow);
}

export async function upsertCheckIn(supabase: SupabaseClient, checkIn: CheckIn) {
  const userId = await getUserId(supabase);
  const { data, error } = await supabase
    .from("check_ins")
    .upsert(mapCheckInToRow(checkIn, userId), { onConflict: "user_id,date" })
    .select("*")
    .single<CheckInRow>();

  if (error) throw error;
  return mapCheckInRow(data);
}

export async function deleteCheckIn(supabase: SupabaseClient, date: string) {
  const userId = await getUserId(supabase);
  const { error } = await supabase
    .from("check_ins")
    .delete()
    .eq("user_id", userId)
    .eq("date", date);

  if (error) throw error;
}

export async function getAnalyses(supabase: SupabaseClient) {
  const userId = await getUserId(supabase);
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true })
    .returns<AnalysisRow[]>();

  if (error) throw error;
  return data.map(mapAnalysisRow);
}

export async function upsertAnalysis(
  supabase: SupabaseClient,
  date: string,
  signature: string,
  analysis: Analysis
) {
  const userId = await getUserId(supabase);
  const { data: checkIn } = await supabase
    .from("check_ins")
    .select("id")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle<{ id: string }>();
  const { data, error } = await supabase
    .from("analyses")
    .upsert(
      {
        user_id: userId,
        check_in_id: checkIn?.id || null,
        date,
        input_signature: signature,
        analysis,
      },
      { onConflict: "user_id,date,input_signature" }
    )
    .select("*")
    .single<AnalysisRow>();

  if (error) throw error;
  return mapAnalysisRow(data);
}

export async function getFoodMemory(supabase: SupabaseClient) {
  const userId = await getUserId(supabase);
  const { data, error } = await supabase
    .from("food_memory")
    .select("*")
    .eq("user_id", userId)
    .order("times_seen", { ascending: false })
    .returns<FoodMemoryRow[]>();

  if (error) throw error;
  return data.map(mapFoodMemoryRow);
}

export async function upsertFoodMemory(supabase: SupabaseClient, item: FoodMemoryItem) {
  const userId = await getUserId(supabase);
  const row = mapFoodMemoryToRow(item, userId);
  const { data, error } = await supabase
    .from("food_memory")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single<FoodMemoryRow>();

  if (error) throw error;
  return mapFoodMemoryRow(data);
}

export async function deleteFoodMemory(supabase: SupabaseClient, id: string) {
  const userId = await getUserId(supabase);
  const { error } = await supabase
    .from("food_memory")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) throw error;
}
