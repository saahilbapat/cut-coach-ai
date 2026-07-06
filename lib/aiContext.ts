import { formatCheckIn, isAlcoholDay } from "./checkins";
import {
  formatFoodMemoryForContext,
  getRelevantFoodMemories,
} from "./foodMemory";
import type { CheckIn, FoodMemoryItem, StoredAnalysis, UserProfile } from "./types";

type TrendSummary = {
  label: string;
  loggedDays: number;
  averageWeight: number | null;
  averageSteps: number | null;
  averageWorkouts: number | null;
  averageWater: number | null;
  alcoholFrequency: string;
  averageHunger: number | null;
  averageEnergy: number | null;
  averageMood: number | null;
};

const knownRestaurants = [
  "Qdoba",
  "Chipotle",
  "Cava",
  "CAVA",
  "Sweetgreen",
  "Bibibop",
  "Panera",
  "Subway",
  "Chick-fil-A",
  "Trader Joe's",
];

function parseLoggedNumber(value: string) {
  const match = value.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatAverage(value: number | null, digits = 0) {
  if (value === null) return "not enough data";
  return Number(value.toFixed(digits)).toLocaleString();
}

function toDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

function getCheckInsWithinDays(checkIns: CheckIn[], anchorDate: string, days: number) {
  const anchor = toDate(anchorDate);
  const start = new Date(anchor);
  start.setDate(start.getDate() - (days - 1));

  return checkIns.filter((item) => {
    const date = toDate(item.date);
    return date >= start && date <= anchor;
  });
}

function isWorkoutDay(checkIn: CheckIn) {
  return checkIn.workoutType !== "Rest" && checkIn.workoutDuration.trim() !== "";
}

function summarizeTrends(label: string, checkIns: CheckIn[]): TrendSummary {
  const weightValues = checkIns
    .map((item) => parseLoggedNumber(item.weight))
    .filter((value): value is number => value !== null);
  const stepValues = checkIns
    .map((item) => parseLoggedNumber(item.steps))
    .filter((value): value is number => value !== null);
  const waterValues = checkIns
    .map((item) => parseLoggedNumber(item.water))
    .filter((value): value is number => value !== null);
  const hungerValues = checkIns
    .map((item) => parseLoggedNumber(item.hunger))
    .filter((value): value is number => value !== null);
  const energyValues = checkIns
    .map((item) => parseLoggedNumber(item.energy))
    .filter((value): value is number => value !== null);
  const moodValues = checkIns
    .map((item) => parseLoggedNumber(item.mood))
    .filter((value): value is number => value !== null);
  const workoutCount = checkIns.filter(isWorkoutDay).length;
  const alcoholCount = checkIns.filter((item) => isAlcoholDay(item.alcohol)).length;

  return {
    label,
    loggedDays: checkIns.length,
    averageWeight: average(weightValues),
    averageSteps: average(stepValues),
    averageWorkouts: checkIns.length > 0 ? (workoutCount / checkIns.length) * 7 : null,
    averageWater: average(waterValues),
    alcoholFrequency:
      checkIns.length > 0
        ? `${alcoholCount}/${checkIns.length} logged days`
        : "not enough data",
    averageHunger: average(hungerValues),
    averageEnergy: average(energyValues),
    averageMood: average(moodValues),
  };
}

function formatTrendSummary(summary: TrendSummary) {
  return [
    `${summary.label}:`,
    `- Logged days: ${summary.loggedDays}`,
    `- Average weight: ${formatAverage(summary.averageWeight, 1)} lb`,
    `- Average steps: ${formatAverage(summary.averageSteps, 0)}`,
    `- Average workouts: ${
      summary.averageWorkouts === null
        ? "not enough data"
        : `${summary.averageWorkouts.toFixed(1)} workouts per 7 logged days`
    }`,
    `- Average water: ${formatAverage(summary.averageWater, 0)} oz`,
    `- Alcohol frequency: ${summary.alcoholFrequency}`,
    `- Average hunger: ${formatAverage(summary.averageHunger, 1)}`,
    `- Average energy: ${formatAverage(summary.averageEnergy, 1)}`,
    `- Average mood: ${formatAverage(summary.averageMood, 1)}`,
  ].join("\n");
}

function includesTerm(text: string, term: string) {
  return text.toLowerCase().includes(term.toLowerCase());
}

function getFoodText(checkIns: CheckIn[]) {
  return checkIns
    .map((item) =>
      [item.breakfast, item.lunch, item.dinner, item.snacks, item.notes].join(" ")
    )
    .join(" ");
}

function detectWeightTrend(checkIns: CheckIn[]) {
  const weights = checkIns
    .map((item) => ({ date: item.date, weight: parseLoggedNumber(item.weight) }))
    .filter((item): item is { date: string; weight: number } => item.weight !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (weights.length < 2) return null;

  const change = weights[weights.length - 1].weight - weights[0].weight;
  if (change <= -1) return `weight trending downward (${change.toFixed(1)} lb)`;
  if (change < -0.2) return `weight slightly trending downward (${change.toFixed(1)} lb)`;
  if (change <= 0.2) return "weight mostly stable";
  return `weight trending upward (+${change.toFixed(1)} lb)`;
}

function detectBehaviorPatterns(
  currentCheckIn: CheckIn,
  savedCheckIns: CheckIn[],
  profile: UserProfile,
  previousAnalyses: StoredAnalysis[]
) {
  const recent30 = getCheckInsWithinDays(savedCheckIns, currentCheckIn.date, 30);
  const patterns: string[] = [];
  const workoutCount = recent30.filter(isWorkoutDay).length;
  const stepValues = recent30
    .map((item) => parseLoggedNumber(item.steps))
    .filter((value): value is number => value !== null);
  const highStepDays = stepValues.filter((value) => value >= 8000).length;
  const foodText = getFoodText(recent30);
  const profileFoodText = [
    profile.favoriteRestaurants,
    profile.commonGroceryStores,
    profile.favoriteFoods,
  ].join(" ");
  const combinedFoodText = `${foodText} ${profileFoodText}`;
  const weekendAlcoholDays = recent30.filter((item) => {
    const day = toDate(item.date).getDay();
    return (day === 0 || day === 6) && isAlcoholDay(item.alcohol);
  }).length;
  const weekdayAlcoholDays = recent30.filter((item) => {
    const day = toDate(item.date).getDay();
    return day !== 0 && day !== 6 && isAlcoholDay(item.alcohol);
  }).length;
  const weightTrend = detectWeightTrend(recent30);
  const proteinEstimates = previousAnalyses.map((item) => item.analysis.estimatedProtein);
  const averageEstimatedProtein = average(proteinEstimates);

  if (recent30.length > 0) {
    patterns.push(`usually trains about ${((workoutCount / recent30.length) * 7).toFixed(1)}x/week`);
  }

  if (stepValues.length >= 3) {
    patterns.push(
      highStepDays >= Math.ceil(stepValues.length * 0.7)
        ? "consistently reaches step goals"
        : "step goal consistency is mixed"
    );
  }

  const repeatedRestaurants = knownRestaurants.filter((restaurant) =>
    includesTerm(combinedFoodText, restaurant)
  );
  if (repeatedRestaurants.length > 0) {
    patterns.push(`frequently mentions: ${repeatedRestaurants.slice(0, 5).join(", ")}`);
  }

  if (weekendAlcoholDays > weekdayAlcoholDays && weekendAlcoholDays > 0) {
    patterns.push("weekends contain more alcohol than weekdays");
  } else if (weekendAlcoholDays + weekdayAlcoholDays === 0 && recent30.length > 0) {
    patterns.push("recent logs are alcohol-free");
  }

  if (weightTrend) patterns.push(weightTrend);

  if (averageEstimatedProtein !== null) {
    patterns.push(
      averageEstimatedProtein >= 130
        ? `protein appears consistently high based on recent AI estimates (${Math.round(
            averageEstimatedProtein
          )}g average)`
        : `protein may need attention based on recent AI estimates (${Math.round(
            averageEstimatedProtein
          )}g average)`
    );
  }

  return patterns.length > 0
    ? patterns.map((pattern) => `- ${pattern}`).join("\n")
    : "- Not enough saved history to detect behavior patterns yet.";
}

function formatProfile(profile: UserProfile) {
  const hasProfile = [
    profile.age,
    profile.sex,
    profile.height,
    profile.currentWeight,
    profile.goalWeight,
    profile.activityLevel,
    profile.preferredProteinGoal,
    profile.dietaryPreferences,
    profile.cutConcernNotes,
  ].some((value) => value.trim() !== "") || profile.cutConcerns.length > 0;

  if (!hasProfile) return "User Profile:\n- No profile details saved yet.";

  return [
    "User Profile:",
    `- Age: ${profile.age || "not set"}`,
    `- Sex: ${profile.sex || "not set"}`,
    `- Height: ${profile.height || "not set"}`,
    `- Current weight: ${profile.currentWeight || "not set"}`,
    `- Goal weight: ${profile.goalWeight || "not set"}`,
    `- Activity level: ${profile.activityLevel || "not set"}`,
    `- Protein goal: ${profile.preferredProteinGoal || "not set"}`,
    "- Preferred coaching style: not set",
    `- Goal pace: ${profile.goalPace}`,
    `- Dietary preferences: ${profile.dietaryPreferences || "not set"}`,
    `- Biggest cut concerns: ${
      profile.cutConcerns.length > 0 ? profile.cutConcerns.join(", ") : "not set"
    }`,
    `- Specific concern notes: ${profile.cutConcernNotes || "not set"}`,
  ].join("\n");
}

function getPreviousAnalyses(
  currentCheckIn: CheckIn,
  storedAnalyses: StoredAnalysis[]
) {
  return storedAnalyses
    .filter((item) => item.date !== currentCheckIn.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
}

function formatPreviousAnalyses(previousAnalyses: StoredAnalysis[]) {
  if (previousAnalyses.length === 0) {
    return "Previous AI Analyses:\n- No previous analyses saved yet.";
  }

  return [
    "Previous AI Analyses:",
    ...previousAnalyses.map((item) =>
      [
        `${item.date}:`,
        `- Cut score: ${Math.round(item.analysis.cutScore)}`,
        `- Biggest win: ${item.analysis.biggestWin}`,
        `- Biggest issue: ${item.analysis.biggestIssue}`,
        `- Trend observation: ${item.analysis.trendObservation}`,
        `- Mission: ${item.analysis.tomorrowMission.join("; ")}`,
        `- Coaching note: ${item.analysis.coachingNote}`,
      ].join("\n")
    ),
  ].join("\n\n");
}

export function buildAIContext({
  currentCheckIn,
  foodMemory,
  savedCheckIns,
  profile,
  storedAnalyses,
}: {
  currentCheckIn: CheckIn;
  foodMemory: FoodMemoryItem[];
  savedCheckIns: CheckIn[];
  profile: UserProfile;
  storedAnalyses: StoredAnalysis[];
}) {
  const savedWithCurrent = [
    ...savedCheckIns.filter((item) => item.date !== currentCheckIn.date),
    currentCheckIn,
  ].sort((a, b) => a.date.localeCompare(b.date));
  const previousAnalyses = getPreviousAnalyses(currentCheckIn, storedAnalyses);
  const last7 = summarizeTrends(
    "Last 7 days",
    getCheckInsWithinDays(savedWithCurrent, currentCheckIn.date, 7)
  );
  const last30 = summarizeTrends(
    "Last 30 days",
    getCheckInsWithinDays(savedWithCurrent, currentCheckIn.date, 30)
  );
  const relevantFoodMemory = getRelevantFoodMemories(foodMemory, currentCheckIn);

  return [
    "You are continuing an ongoing coaching relationship.",
    "Avoid repeating identical advice.",
    "Build upon previous recommendations.",
    "Recognize improvements.",
    "Recognize recurring problems.",
    "Use food memory to improve consistency, but do not blindly trust it if today's log clearly differs.",
    "Monitor the user's selected cut concerns in every analysis, but mention them only when they are relevant to the logged day or recent trends.",
    "Do not shame the user when addressing cut concerns.",
    "",
    "SECTION 1 - User Profile",
    formatProfile(profile),
    "",
    "SECTION 1B - Food Memory",
    formatFoodMemoryForContext(relevantFoodMemory),
    "",
    "SECTION 2 - Current Check-In",
    formatCheckIn(currentCheckIn),
    "",
    "SECTION 3 - Recent Trends",
    formatTrendSummary(last7),
    "",
    formatTrendSummary(last30),
    "",
    "SECTION 4 - Behavior Patterns",
    detectBehaviorPatterns(currentCheckIn, savedWithCurrent, profile, previousAnalyses),
    "",
    "SECTION 5 - Previous AI Analyses",
    formatPreviousAnalyses(previousAnalyses),
  ].join("\n");
}
