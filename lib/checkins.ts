import type { CheckIn } from "./types";

export const today = new Date().toISOString().split("T")[0];

export const emptyCheckIn: CheckIn = {
  date: today,
  weight: "",
  steps: "",
  workout: "",
  workoutType: "Push",
  workoutDuration: "",
  cardioType: "",
  cardioDuration: "",
  lunch: "",
  dinner: "",
  snacks: "",
  alcohol: "",
  water: "",
  hunger: "",
  energy: "",
  mood: "",
  notes: "",
};

export function isAlcoholDay(alcohol: string) {
  const value = alcohol.trim().toLowerCase();
  return value !== "" && value !== "none" && value !== "0";
}

export function calculateStreak(saved: CheckIn[]) {
  const savedDates = new Set(saved.map((item) => item.date));
  let streak = 0;
  const current = new Date(today);

  while (true) {
    const dateString = current.toISOString().split("T")[0];
    if (!savedDates.has(dateString)) break;
    streak++;
    current.setDate(current.getDate() - 1);
  }

  return streak;
}

export function getMissingDates(saved: CheckIn[]) {
  if (saved.length === 0) return [];

  const savedDates = new Set(saved.map((item) => item.date));
  const sorted = [...saved].sort((a, b) => a.date.localeCompare(b.date));
  const start = new Date(sorted[0].date);
  const end = new Date(today);
  const missing: string[] = [];

  const current = new Date(start);

  while (current <= end) {
    const dateString = current.toISOString().split("T")[0];
    if (!savedDates.has(dateString)) missing.push(dateString);
    current.setDate(current.getDate() + 1);
  }

  return missing;
}

export function formatCheckIn(checkIn: CheckIn) {
  const workoutDetails = [
    checkIn.workout,
    checkIn.workoutType ? `type: ${checkIn.workoutType}` : "",
    checkIn.workoutDuration ? `lift duration: ${checkIn.workoutDuration}` : "",
    checkIn.cardioType ? `cardio: ${checkIn.cardioType}` : "",
    checkIn.cardioDuration ? `cardio duration: ${checkIn.cardioDuration}` : "",
  ]
    .filter(Boolean)
    .join("; ");

  return [
    `Date: ${checkIn.date}`,
    `Weight: ${checkIn.weight || "not logged"}`,
    `Steps: ${checkIn.steps || "not logged"}`,
    `Workout: ${workoutDetails || "not logged"}`,
    `Alcohol: ${checkIn.alcohol || "not logged"}`,
    `Mood: ${checkIn.mood || "not logged"}`,
    `Lunch: ${checkIn.lunch || "not logged"}`,
    `Dinner: ${checkIn.dinner || "not logged"}`,
    `Snacks: ${checkIn.snacks || "not logged"}`,
    `Water: ${checkIn.water || "not logged"}`,
    `Hunger: ${checkIn.hunger || "not logged"}`,
    `Energy: ${checkIn.energy || "not logged"}`,
    `Notes: ${checkIn.notes || "not logged"}`,
  ].join("\n");
}

export function buildCheckInString(checkIn: CheckIn, savedCheckIns: CheckIn[]) {
  const recentPrevious = savedCheckIns
    .filter((item) => item.date !== checkIn.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const recentWindow = [checkIn, ...recentPrevious];
  const recentWeights = recentWindow
    .filter((item) => item.weight.trim() !== "")
    .sort((a, b) => a.date.localeCompare(b.date));
  const firstRecentWeight = recentWeights[0]?.weight;
  const latestRecentWeight = recentWeights[recentWeights.length - 1]?.weight;
  const recentWeightChange =
    firstRecentWeight && latestRecentWeight
      ? (Number(latestRecentWeight) - Number(firstRecentWeight)).toFixed(1)
      : "not enough data";
  const avgRecentSteps =
    recentWindow.length > 0
      ? Math.round(
          recentWindow.reduce((sum, item) => sum + Number(item.steps || 0), 0) /
            recentWindow.length
        )
      : 0;
  const recentWorkoutDays = recentWindow.filter(
    (item) => item.workoutType !== "Rest" && item.workoutDuration.trim() !== ""
  ).length;
  const recentAlcoholDays = recentWindow.filter((item) => isAlcoholDay(item.alcohol)).length;

  return [
    "Today's full log:",
    formatCheckIn(checkIn),
    "",
    "Recent trend summary from locally saved check-ins:",
    `Recent logs included: ${recentWindow.length}`,
    `Average recent steps: ${avgRecentSteps || "not enough data"}`,
    `Recent workout days: ${recentWorkoutDays}`,
    `Recent alcohol days: ${recentAlcoholDays}`,
    `Recent weight change: ${recentWeightChange}${
      recentWeightChange === "not enough data" ? "" : " lb"
    }`,
    "",
    "Recent previous check-ins:",
    recentPrevious.length > 0
      ? recentPrevious.map((item) => formatCheckIn(item)).join("\n\n---\n\n")
      : "No previous check-ins stored locally.",
  ].join("\n");
}

export function createSignature(value: string) {
  let hash = 5381;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(16);
}

export function saveCheckInToList(saved: CheckIn[], checkIn: CheckIn) {
  return [...saved.filter((item) => item.date !== checkIn.date), checkIn].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

function parseLoggedNumber(value: string) {
  const match = value.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatTrendNumber(value: number | null, digits = 0) {
  if (value === null) return null;
  return Number(value.toFixed(digits));
}

function getWeightDirection(weightChangeLast7: number | null) {
  if (weightChangeLast7 === null) return "Not enough weight data yet.";
  if (weightChangeLast7 <= -1) return `Trending down ${Math.abs(weightChangeLast7).toFixed(1)} lb.`;
  if (weightChangeLast7 < -0.2) return `Slightly down ${Math.abs(weightChangeLast7).toFixed(1)} lb.`;
  if (weightChangeLast7 <= 0.2) return "Mostly flat over recent check-ins.";
  return `Trending up ${weightChangeLast7.toFixed(1)} lb.`;
}

function getActivityConsistency(avgSteps7: number | null) {
  if (avgSteps7 === null) return "Not enough step data yet.";
  if (avgSteps7 >= 10000) return "Very consistent activity.";
  if (avgSteps7 >= 8000) return "Solid activity consistency.";
  if (avgSteps7 >= 6000) return "Activity is moderate but could be steadier.";
  return "Activity is below the cut target.";
}

function getWorkoutConsistency(workoutsLast7: number) {
  if (workoutsLast7 >= 4) return "Workout target is on track.";
  if (workoutsLast7 >= 3) return "Close to the weekly workout target.";
  if (workoutsLast7 >= 1) return "Workout consistency needs a lift.";
  return "No workouts logged recently.";
}

function getAlcoholPattern(alcoholFreeDaysLast7: number, loggedDays: number) {
  if (loggedDays === 0) return "No alcohol data yet.";
  if (alcoholFreeDaysLast7 === loggedDays) return "Alcohol-free across logged days.";
  if (alcoholFreeDaysLast7 >= Math.max(loggedDays - 1, 0)) return "Mostly alcohol-free.";
  if (alcoholFreeDaysLast7 >= Math.ceil(loggedDays / 2)) return "Some alcohol, but not dominating the week.";
  return "Alcohol is showing up often enough to watch.";
}

export function getDashboardStats(saved: CheckIn[]) {
  const last7 = [...saved].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  const chronologicalLast7 = [...last7].sort((a, b) => a.date.localeCompare(b.date));
  const streak = calculateStreak(saved);
  const missingDates = getMissingDates(saved);
  const stepValues = last7
    .map((item) => parseLoggedNumber(item.steps))
    .filter((value): value is number => value !== null);
  const waterValues = last7
    .map((item) => parseLoggedNumber(item.water))
    .filter((value): value is number => value !== null);
  const recentWeightValues = chronologicalLast7
    .map((item) => parseLoggedNumber(item.weight))
    .filter((value): value is number => value !== null);

  const avgSteps = formatTrendNumber(average(stepValues), 0);
  const avgWater = formatTrendNumber(average(waterValues), 0);
  const avgWeight = formatTrendNumber(average(recentWeightValues), 1);

  const workoutsLast7 = last7.filter(
    (item) => item.workoutType !== "Rest" && item.workoutDuration.trim() !== ""
  ).length;

  const alcoholDays = last7.filter((item) => isAlcoholDay(item.alcohol)).length;
  const alcoholFreeDaysLast7 = last7.length - alcoholDays;

  const weights = [...saved]
    .filter((item) => item.weight.trim() !== "")
    .sort((a, b) => a.date.localeCompare(b.date));

  const firstWeight = weights[0]?.weight;
  const latestWeight = weights[weights.length - 1]?.weight;
  const weightChange =
    firstWeight && latestWeight
      ? (Number(latestWeight) - Number(firstWeight)).toFixed(1)
      : null;
  const weightChangeLast7 =
    recentWeightValues.length >= 2
      ? formatTrendNumber(recentWeightValues[recentWeightValues.length - 1] - recentWeightValues[0], 1)
      : null;

  let coachStatus = "⚪ Need More Data";

  if (saved.length >= 2) {
    if ((avgSteps || 0) >= 8000 && workoutsLast7 >= 4 && alcoholDays <= 2) {
      coachStatus = "🟢 On Track";
    } else if ((avgSteps || 0) >= 7000 && workoutsLast7 >= 3 && alcoholDays <= 2) {
      coachStatus = "🟡 Close, Needs Small Fix";
    } else {
      coachStatus = "🔴 Needs Attention";
    }
  }

  return {
    alcoholDays,
    alcoholFreeDaysLast7,
    avgSteps7: avgSteps,
    avgWater7: avgWater,
    avgWeight7: avgWeight,
    avgSteps,
    coachStatus,
    latestWeight,
    missingDates,
    recentTrend: {
      activityConsistency: getActivityConsistency(avgSteps),
      alcoholPattern: getAlcoholPattern(alcoholFreeDaysLast7, last7.length),
      weightDirection: getWeightDirection(weightChangeLast7),
      workoutConsistency: getWorkoutConsistency(workoutsLast7),
    },
    streak,
    weightChange,
    weightChangeLast7,
    workoutsLast7,
    workoutsThisWeek: workoutsLast7,
  };
}

export function getDashboardHighlightGraph(saved: CheckIn[], limit = 7) {
  const recent = [...saved].sort((a, b) => a.date.localeCompare(b.date)).slice(-limit);
  const parsed = recent.map((item) => ({
    date: item.date,
    label: item.date.slice(5).replace("-", "/"),
    steps: parseLoggedNumber(item.steps) || 0,
    weight: parseLoggedNumber(item.weight),
  }));
  const maxSteps = Math.max(...parsed.map((item) => item.steps), 1);
  const weights = parsed
    .map((item) => item.weight)
    .filter((value): value is number => value !== null);
  const minWeight = weights.length > 0 ? Math.min(...weights) : null;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : null;

  return parsed.map((item) => {
    const stepPercent = Math.max(8, Math.round((item.steps / maxSteps) * 100));
    const weightRange =
      minWeight !== null && maxWeight !== null ? maxWeight - minWeight : 0;
    const weightPercent =
      item.weight === null || minWeight === null || maxWeight === null
        ? null
        : weightRange === 0
          ? 50
          : Math.max(10, Math.round(((item.weight - minWeight) / weightRange) * 90) + 5);

    return {
      ...item,
      stepPercent,
      weightPercent,
    };
  });
}

export function formatEstimate(value: number, unit: string) {
  return `${Math.round(value).toLocaleString()}${unit}`;
}
