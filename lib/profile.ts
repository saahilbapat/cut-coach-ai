import type { UserProfile } from "./types";

export const cutConcernOptions = [
  "Healthy eating",
  "Consistent gym",
  "Daily activity / steps",
  "Alcohol",
  "Weekend discipline",
  "Hunger",
  "Sleep",
  "Stress",
  "Protein consistency",
  "Restaurant choices",
  "Late-night snacking",
  "Motivation",
];

export const emptyProfile: UserProfile = {
  name: "",
  age: "",
  height: "",
  sex: "",
  currentWeight: "",
  goalWeight: "",
  goalPace: "Moderate Cut",
  activityLevel: "",
  preferredProteinGoal: "",
  dietaryPreferences: "",
  favoriteRestaurants: "",
  commonGroceryStores: "",
  favoriteFoods: "",
  cutConcerns: [],
  cutConcernNotes: "",
};

export function formatProfileContext(profile: UserProfile) {
  const lines = [
    `Name: ${profile.name || "not set"}`,
    `Age: ${profile.age || "not set"}`,
    `Height: ${profile.height || "not set"}`,
    `Sex: ${profile.sex || "not set"}`,
    `Current weight: ${profile.currentWeight || "not set"}`,
    `Goal weight: ${profile.goalWeight || "not set"}`,
    `Goal pace: ${profile.goalPace}`,
    `Activity level: ${profile.activityLevel || "not set"}`,
    `Preferred protein goal: ${profile.preferredProteinGoal || "not set"}`,
    `Dietary preferences: ${profile.dietaryPreferences || "not set"}`,
    `Favorite restaurants: ${profile.favoriteRestaurants || "not set"}`,
    `Common grocery stores: ${profile.commonGroceryStores || "not set"}`,
    `Favorite foods: ${profile.favoriteFoods || "not set"}`,
    `Cut concerns: ${
      profile.cutConcerns.length > 0 ? profile.cutConcerns.join(", ") : "not set"
    }`,
    `Specific concern notes: ${profile.cutConcernNotes || "not set"}`,
  ];

  return ["User profile and goals:", ...lines].join("\n");
}

function parsePositiveNumber(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.NaN;
}

export function validateProfile(profile: UserProfile) {
  const errors: Partial<Record<keyof UserProfile, string>> = {};
  const age = parsePositiveNumber(profile.age);
  const currentWeight = parsePositiveNumber(profile.currentWeight);
  const goalWeight = parsePositiveNumber(profile.goalWeight);

  if (!profile.name.trim()) {
    errors.name = "Name is required.";
  }

  if (Number.isNaN(age) || (age !== null && age > 120)) {
    errors.age = "Enter a valid age.";
  }

  if (Number.isNaN(currentWeight)) {
    errors.currentWeight = "Enter a valid current weight.";
  }

  if (Number.isNaN(goalWeight)) {
    errors.goalWeight = "Enter a valid goal weight.";
  }

  return errors;
}

export function isProfileComplete(profile: UserProfile | null) {
  return profile !== null && Object.keys(validateProfile(profile)).length === 0;
}
