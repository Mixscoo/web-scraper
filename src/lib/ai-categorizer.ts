import { OpenAI } from "openai";
import { CATEGORIES } from "./constants";

// Ideally use a fast and cheap model like 4o-mini
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://z.apiyihe.org/v1", // Custom proxy endpoint
});

export async function categorizeOtherJobs(titles: string[]): Promise<string[]> {
  if (titles.length === 0) return [];
  if (!process.env.OPENAI_API_KEY) {
    console.warn("No OPENAI_API_KEY found, skipping AI categorization fallback.");
    return titles.map(() => "other");
  }

  const categoryListStr = CATEGORIES.map((c) => c.id).join(", ");
  const prompt = `You are a job categorizer for a Middle Eastern job aggregator.
Your task is to categorize the following job titles.

1. First, attempt to map the job title to EXACTLY ONE of these primary predefined categories:
${categoryListStr}

2. IMPORTANT: If the job title represents a legitimate job but does NOT fit any of the predefined household/service categories (e.g., "Software Engineer", "ICU Nurse", "Sales Manager"), DO NOT use "other". Instead, invent a new, concise, hyphenated category slug for it (e.g., "software-engineering", "healthcare", "sales", "education").

3. Only use "other" if the title is complete garbage or fully unidentifiable (e.g., "Urgent Hiring", "***").

Respond ONLY with a JSON object containing a single "categories" array of strings in the exact same order as the input array. For example: {"categories": ["driver", "software-engineering", "house-cleaner", "healthcare"]}

Job Titles to categorize:
${JSON.stringify(titles, null, 2)}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{"categories": []}');
    // Check if the parsed object is an array directly or inside a field
    let results: string[] = [];
    if (Array.isArray(parsed)) {
      results = parsed;
    } else if (parsed.categories && Array.isArray(parsed.categories)) {
      results = parsed.categories;
    } else {
       // fallback try to extract anything that is an array
       const firstArray = Object.values(parsed).find(Array.isArray);
       if (firstArray) results = firstArray as string[];
    }

    if (results.length !== titles.length) {
      console.error("AI returned mismatched array length for job categorizations.");
      return titles.map(() => "other"); // Fallback
    }

    // Allow AI to inject its discovered categories
    return results.map(r => typeof r === "string" ? r.toLowerCase().replace(/[^a-z0-9\-]/g, "-") : "other");
  } catch (error) {
    console.error("AI Categorization failed:", error);
    return titles.map(() => "other");
  }
}
