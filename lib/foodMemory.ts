import type { CheckIn, FoodMemoryItem } from "./types";

type KeywordDefinition = {
  name: string;
  aliases: string[];
  category: FoodMemoryItem["category"];
  description: string;
};

const keywordDefinitions: KeywordDefinition[] = [
  {
    name: "Qdoba",
    aliases: ["Qdoba bowl"],
    category: "restaurant",
    description: "Common logged restaurant meal. Judge by the actual bowl ingredients.",
  },
  {
    name: "Chipotle",
    aliases: ["Chipotle bowl"],
    category: "restaurant",
    description: "Common logged restaurant meal. Judge by the actual bowl ingredients.",
  },
  {
    name: "CAVA",
    aliases: ["Cava", "CAVA bowl"],
    category: "restaurant",
    description: "Common logged Mediterranean bowl or restaurant meal.",
  },
  {
    name: "Sweetgreen",
    aliases: ["Sweetgreen bowl", "Sweetgreen salad"],
    category: "restaurant",
    description: "Common logged salad or bowl restaurant meal.",
  },
  {
    name: "Bibibop",
    aliases: ["Bibibop bowl"],
    category: "restaurant",
    description: "Common logged bowl restaurant meal.",
  },
  {
    name: "Trader Joe's",
    aliases: ["TJ", "Trader Joes"],
    category: "grocery",
    description: "Common grocery source for logged foods.",
  },
  {
    name: "Costco",
    aliases: [],
    category: "grocery",
    description: "Common grocery source for logged foods.",
  },
  {
    name: "Fairlife protein shake",
    aliases: ["Fairlife", "Fairlife shake"],
    category: "drink",
    description: "Common high-protein bottled shake.",
  },
  {
    name: "protein shake",
    aliases: ["protein smoothie"],
    category: "drink",
    description: "Common logged protein drink.",
  },
  {
    name: "Greek yogurt",
    aliases: ["Greek yogurt bowl", "yogurt bowl"],
    category: "snack",
    description: "Common high-protein snack or meal base.",
  },
  {
    name: "Dave's",
    aliases: ["Daves", "Dave's Hot Chicken", "Daves Hot Chicken", "Dave's slider"],
    category: "restaurant",
    description: "Common logged restaurant meal. Watch fried items and sauces.",
  },
  {
    name: "Portillo's",
    aliases: ["Portillos"],
    category: "restaurant",
    description: "Common logged restaurant meal.",
  },
  {
    name: "McDonald's",
    aliases: ["McDonalds"],
    category: "restaurant",
    description: "Common logged restaurant meal.",
  },
  {
    name: "Chick-fil-A",
    aliases: ["Chick fil A", "Chickfila"],
    category: "restaurant",
    description: "Common logged restaurant meal.",
  },
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function getFoodText(checkIn: CheckIn) {
  return [
    checkIn.breakfast,
    checkIn.lunch,
    checkIn.dinner,
    checkIn.snacks,
    checkIn.alcohol,
    checkIn.notes,
  ].join(" ");
}

function itemMatchesText(item: FoodMemoryItem, text: string) {
  return [item.name, ...item.aliases]
    .map(normalize)
    .filter(Boolean)
    .some((value) => text.includes(value));
}

function itemMatchesDefinition(item: FoodMemoryItem, definition: KeywordDefinition) {
  const definitionValues = new Set(
    [definition.name, ...definition.aliases].map(normalize).filter(Boolean)
  );
  return [item.name, ...item.aliases]
    .map(normalize)
    .filter(Boolean)
    .some((value) => definitionValues.has(value));
}

function createFoodMemoryItem(definition: KeywordDefinition, date: string): FoodMemoryItem {
  const now = new Date().toISOString();

  return {
    id: `food-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: definition.name,
    aliases: definition.aliases,
    category: definition.category,
    description: definition.description,
    confidence: "low",
    source: "ai_suggested",
    timesSeen: 1,
    lastSeen: date,
    createdAt: now,
    updatedAt: now,
  };
}

export function applyFoodMemoryDetections(
  currentMemory: FoodMemoryItem[],
  checkIn: CheckIn
) {
  const text = normalize(getFoodText(checkIn));
  const detected = keywordDefinitions.filter((definition) =>
    [definition.name, ...definition.aliases]
      .map(normalize)
      .filter(Boolean)
      .some((keyword) => text.includes(keyword))
  );

  if (detected.length === 0) return currentMemory;

  let next = [...currentMemory];

  detected.forEach((definition) => {
    const existingIndex = next.findIndex((item) => itemMatchesDefinition(item, definition));
    const now = new Date().toISOString();

    if (existingIndex === -1) {
      next = [...next, createFoodMemoryItem(definition, checkIn.date)];
      return;
    }

    const existing = next[existingIndex];
    const aliases = Array.from(new Set([...existing.aliases, ...definition.aliases]));
    const updated: FoodMemoryItem = {
      ...existing,
      aliases,
      description: existing.description || definition.description,
      category: existing.category || definition.category,
      timesSeen: existing.timesSeen + 1,
      lastSeen: checkIn.date,
      updatedAt: now,
    };

    next = [...next.slice(0, existingIndex), updated, ...next.slice(existingIndex + 1)];
  });

  return next.sort((a, b) => b.timesSeen - a.timesSeen || a.name.localeCompare(b.name));
}

export function getRelevantFoodMemories(
  foodMemory: FoodMemoryItem[],
  checkIn: CheckIn
) {
  const text = normalize(getFoodText(checkIn));
  const topMemories = [...foodMemory]
    .sort((a, b) => b.timesSeen - a.timesSeen || a.name.localeCompare(b.name))
    .slice(0, 10);
  const matchingMemories = foodMemory.filter((item) => itemMatchesText(item, text));
  const byId = new Map<string, FoodMemoryItem>();

  [...topMemories, ...matchingMemories].forEach((item) => {
    byId.set(item.id, item);
  });

  return Array.from(byId.values()).sort(
    (a, b) => b.timesSeen - a.timesSeen || a.name.localeCompare(b.name)
  );
}

export function formatFoodMemoryForContext(items: FoodMemoryItem[]) {
  if (items.length === 0) {
    return "Known user foods/meals:\n- No food memories saved yet.";
  }

  return [
    "Known user foods/meals:",
    ...items.map((item) => {
      const estimates = [
        item.estimatedCalories ? `${item.estimatedCalories} kcal` : "",
        item.estimatedProtein ? `${item.estimatedProtein} protein` : "",
        item.estimatedCarbs ? `${item.estimatedCarbs} carbs` : "",
        item.estimatedFat ? `${item.estimatedFat} fat` : "",
      ]
        .filter(Boolean)
        .join(", ");
      const aliases =
        item.aliases.length > 0 ? ` Aliases: ${item.aliases.join(", ")}.` : "";
      const estimateText = estimates ? ` Estimated ${estimates}.` : "";
      const confidence = item.confidence ? ` Confidence ${item.confidence}.` : "";

      return `- ${item.name}: ${item.description || "Remembered food item."}${aliases}${estimateText}${confidence} Seen ${item.timesSeen} time(s).`;
    }),
  ].join("\n");
}
