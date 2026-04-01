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
Your task is to categorize the following job titles accurately.

1. First, attempt to map the job title to EXACTLY ONE of these primary predefined categories:
${categoryListStr}

2. IMPORTANT: If the job title represents a legitimate job but does NOT fit any of the predefined household/service categories (e.g., "Software Engineer", "ICU Nurse", "Sales Manager"), DO NOT use "other". Instead, invent a new, concise, hyphenated category slug for it (e.g., "software-engineering", "healthcare", "sales", "education").

3. Only use "other" if the title is complete garbage, a generic agency listing ("Urgent Hiring"), or fully unidentifiable.

Respond ONLY with a JSON object containing a dictionary mapping the EXACT job title to its category slug.
Example format:
{
  "categories": {
    "Need Driver in Riyadh": "driver",
    "Senior Frontend Developer": "software-engineering",
    "House Maid Wanted": "house-cleaner",
    "Registered Nurse": "healthcare",
    "***": "other"
  }
}

Job Titles to categorize:
${JSON.stringify(titles, null, 2)}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{"categories": {}}');
    
    // We expect an object map back.
    const categoriesMap = parsed.categories || parsed || {};

    // Map results back to the original titles array safely
    return titles.map(title => {
       const mapped = categoriesMap[title];
       if (typeof mapped === "string") {
         return mapped.toLowerCase().replace(/[^a-z0-9\-]/g, "-") || "other";
       }
       return "other";
    });
  } catch (error) {
    console.error("AI Categorization failed:", error);
    return titles.map(() => "other");
  }
}
