import OpenAI, { APIError } from "openai";

export const runtime = "nodejs";

type Analysis = {
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

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "OpenAI API key is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const checkIn = body?.checkIn;
    const profileContext =
      typeof body?.profileContext === "string"
        ? body.profileContext
        : "User profile and goals: not provided.";

    if (typeof checkIn !== "string" || checkIn.trim().length === 0) {
      return Response.json(
        { error: 'Request body must include a non-empty "checkIn" string.' },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey });

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      temperature: 0,
      instructions: `System:
You are Saahil's fitness cut coach. Your job is to help drive fat loss while preserving muscle.

Developer:
Prioritize these outcomes in order:
1. Fat loss while preserving muscle
2. High protein
3. Step consistency
4. Workout consistency
5. Realistic restaurant eating
6. Sustainable habits

Evaluation rules:
- Use the provided user profile and goals to personalize targets, tone, coachingNote, tomorrowMission, and how aggressive the cut should be.
- Treat the provided context as an ongoing coaching relationship, not a one-off analysis.
- Avoid repeating identical advice when previous AI analyses are provided.
- Build upon previous recommendations, recognize improvements, and call out recurring problems.
- Monitor the user's selected cut concerns in every analysis and mention them only when relevant to the logged day or recent trends.
- If the user selected concerns like healthy eating, consistent gym, daily activity/steps, alcohol, weekend discipline, hunger, sleep, stress, protein consistency, restaurant choices, late-night snacking, or motivation, evaluate those areas more closely without forcing them into the response.
- Estimate calories, protein, carbs, and fat from the logged food and drinks.
- The user does not manually enter macros, so all macro numbers are approximate.
- Be consistent. If the same input is analyzed again, return the same estimates and score.
- Judge restaurant meals by the actual items logged, not by the fact that they came from a restaurant.
- Do not shame restaurant meals. A restaurant meal can be cut-friendly when it includes choices like lean or double protein, rice, beans, vegetables, salsa, no queso, no sour cream, no fried items, and controlled portions.
- Do not call restaurant meals the main issue unless the logged items actually suggest high calories, alcohol, fried food, creamy sauces, desserts, or overeating.
- If portions are unclear, say confidence is low or moderate because portion size is unclear instead of assuming the worst.
- Do not mention being an AI.
- Do not shame the user when addressing concerns or patterns.
- Keep the tone direct, supportive, specific, and like a smart fitness cut coach.
- coachingNote should sound like a real coach: direct, supportive, and tailored to the logged day. Do not make it generic.

Output rules:
- Return strict JSON only, no markdown, no prose outside JSON.
- Return only the structured JSON requested by the schema.
- cutScore should be a 0-100 score for how well the day supported a fitness cut.
- estimatedCalories, estimatedProtein, estimatedCarbs, and estimatedFat should be numeric estimates.
- confidence should be short, such as "Low - portion size is unclear", "Moderate - portions partly clear", or "High - portions are clear".
- tomorrowMission must contain 2-4 short goals.`,
      input: `${profileContext}\n\nCoaching context:\n${checkIn}`,
      text: {
        format: {
          type: "json_schema",
          name: "cut_checkin_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              cutScore: {
                type: "number",
              },
              estimatedCalories: {
                type: "number",
              },
              estimatedProtein: {
                type: "number",
              },
              estimatedCarbs: {
                type: "number",
              },
              estimatedFat: {
                type: "number",
              },
              confidence: {
                type: "string",
              },
              biggestWin: {
                type: "string",
              },
              biggestIssue: {
                type: "string",
              },
              trendObservation: {
                type: "string",
              },
              tomorrowMission: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              coachingNote: {
                type: "string",
              },
            },
            required: [
              "cutScore",
              "estimatedCalories",
              "estimatedProtein",
              "estimatedCarbs",
              "estimatedFat",
              "confidence",
              "biggestWin",
              "biggestIssue",
              "trendObservation",
              "tomorrowMission",
              "coachingNote",
            ],
          },
        },
      },
    });

    const analysis = JSON.parse(response.output_text) as Analysis;

    return Response.json({
      analysis,
    });
  } catch (error) {
    console.error("Analyze route failed:", error);

    if (error instanceof APIError) {
      console.error("OpenAI API error details:", {
        status: error.status,
        message: error.message,
        code: error.code,
      });
    }

    return Response.json(
      { error: "Failed to analyze check-in." },
      { status: 500 }
    );
  }
}
