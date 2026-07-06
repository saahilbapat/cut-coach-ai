export type CheckIn = {
  date: string;
  weight: string;
  steps: string;
  workout: string;
  workoutType: string;
  workoutDuration: string;
  cardioType: string;
  cardioDuration: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  alcohol: string;
  water: string;
  hunger: string;
  energy: string;
  mood: string;
  notes: string;
};

export type Analysis = {
  cutScore: number;
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
  confidence: string;
  biggestWin: string;
  biggestIssue: string;
  trendObservation: string;
  tomorrowMission: string[];
  coachingNote: string;
};

export type StoredAnalysis = {
  date: string;
  signature: string;
  analysis: Analysis;
};

export type FoodMemoryItem = {
  id: string;
  name: string;
  aliases: string[];
  category: "restaurant" | "grocery" | "homemade" | "drink" | "snack" | "other";
  description: string;
  estimatedCalories?: string;
  estimatedProtein?: string;
  estimatedCarbs?: string;
  estimatedFat?: string;
  confidence?: "low" | "medium" | "high";
  source: "manual" | "ai_suggested";
  timesSeen: number;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = {
  name: string;
  age: string;
  height: string;
  sex: string;
  currentWeight: string;
  goalWeight: string;
  goalPace: "Slow Cut" | "Moderate Cut" | "Aggressive Cut";
  activityLevel: string;
  preferredProteinGoal: string;
  dietaryPreferences: string;
  favoriteRestaurants: string;
  commonGroceryStores: string;
  favoriteFoods: string;
  cutConcerns: string[];
  cutConcernNotes: string;
};
