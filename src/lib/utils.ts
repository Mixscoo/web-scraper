import { CITY_COORDINATES, COUNTRIES } from "./constants";

export function generateJobId(title: string, company: string, source: string): string {
  const raw = `${title}-${company}-${source}`.toLowerCase().replace(/\s+/g, "-");
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function getCityCoordinates(city: string): { lat: number; lng: number } | null {
  for (const [name, coords] of Object.entries(CITY_COORDINATES)) {
    if (city.toLowerCase().includes(name.toLowerCase())) {
      return coords;
    }
  }
  return null;
}

export function normalizeCategory(title: string): string {
  const titleLower = title.toLowerCase();

  const categoryPatterns: Record<string, string[]> = {
    "carpenter": ["carpenter", "carpentry", "woodwork", "نجار", "نجّار"],
    "painter": ["painter", "painting", "دهان"],
    "plumber": ["plumber", "plumbing", "pipe fitter", "pipefitter", "sanitary", "سباك", "تمديدات صحية"],
    "electrician": ["electrician", "electrical", "wiring", "كهربائي", "تمديدات كهربائية"],
    "babysitter": ["babysitter", "nanny", "childcare", "child care", "nursery", "governess", "tutor", "caregiver", "care giver", "elderly care", "home care", "مربية", "جليسة", "عناية بالاطفال"],
    "pool-cleaner": ["pool cleaner", "swimming pool", "lifeguard", "pool attendant", "swimming instructor"],
    "house-cleaner": ["cleaner", "cleaning", "maid", "housekeeper", "housekeeping", "house keeping", "janitor", "steward", "room attendant", "house boy", "office boy", "servant", "receptionist", "front desk", "bellboy", "bell boy", "spa", "attendant", "concierge", "نظافة", "عامل نظافة", "خادمة", "خادمات", "شغالة", "شغالات", "عاملة منزلية", "عاملات منازل", "تنظيف", "تنظيف منازل", "تنظيف فلل", "تنظيف شقق", "fbh", "domestic worker", "domestic helper", "home helper", "residential services", "مساعد منزلي", "خدمات منزلية"],
    "gardener": ["gardener", "landscaper", "landscaping", "landscape", "lawn", "horticultur", "بستاني"],
    "driver": ["driver", "chauffeur", "driving", "bus driver", "heavy driver", "light driver", "valet", "سائق"],
    "cook": ["cook", "chef", "kitchen", "cooking", "food service", "waiter", "waitress", "commis", "catering", "barista", "baker", "butcher", "dishwasher", "food handler", "sous chef", "executive chef", "demi chef", "pastry chef", "food and beverage", "f&b", "restaurant", "hostess", "host", "dining", "طباخ", "شيف"],
    "security": ["security", "guard", "watchman", "fire", "safety officer", "hse", "doorman", "patrol", "bouncer", "حارس", "حارس أمن"],
    "ac-technician": ["ac technician", "air conditioning", "hvac", "air condition", "تكييف"],
    "handyman": ["handyman", "maintenance", "general repair", "helper", "facility management", "building maintenance", "technician", "service technician", "mechanic", "gym", "fitness", "inspector", "installer", "repair", "fitter", "operator", "صيانة", "multi-skilled helper", "household assistant"],
    "moving": ["mover", "porter", "moving", "relocation", "warehouse", "supply chain", "logistics", "store keeper", "storekeeper", "stock", "procurement", "نقل اثاث"],
    "laundry": ["laundry", "dry clean", "laundress", "linen", "tailor", "seamstress", "sewing"],
    "pet-care": ["pet care", "dog walker", "pet sitter", "veterinar"],
    "contractor": ["contractor", "construction worker", "foreman", "site supervisor", "general labor", "mason", "masonry", "scaffolder", "rigger", "steel fixer", "labor", "labour", "construction", "estimator", "site engineer", "engineer", "project manager", "supervisor", "عامل"],
    "tiler": ["tiler", "tiling", "tile installer", "floor installer", "بلاط"],
    "welder": ["welder", "welding", "fabricat", "metal work", "لحام"],
    "pest-control": ["pest control", "exterminat", "fumigat", "pest management"],
    "appliance-repair": ["appliance repair", "appliance technician", "refrigerat", "washing machine", "appliance"],
    "window-cleaner": ["window clean", "facade clean", "glass clean", "window cleaning", "high-rise window", "exterior cleaning", "facade cleaning"],
    "interior-designer": ["interior design", "decorator", "home decor", "interior fit"],
    "ironing": ["ironing", "pressing", "press service", "iron service"],
    "furniture-assembly": ["furniture assembly", "furniture installer", "furniture repair", "cabinet", "wardrobe assembly"],
    "car-wash": ["car wash", "car cleaning", "auto detailing", "vehicle cleaning", "car care"],
    "satellite-tv": ["satellite", "dish installation", "antenna", "tv installation", "tv mounting", "dish tech", "signal installer", "satellite tv"],
    "water-tank": ["water tank", "tank cleaning", "cistern", "water system technician", "tank tech"],
    "solar-panel": ["solar panel", "solar installation", "solar energy", "photovoltaic", "solar tech"],
    "curtain-blinds": ["curtain", "blinds", "drapes", "roller blind"],
    "home-renovation": ["renovation", "remodeling", "refurbishment", "home improvement", "fit out", "fitout"],
    "locksmith": ["locksmith", "lock repair", "key cutting", "door lock"],
    "glass-work": ["glass work", "glazier", "mirror", "glass installation", "glass cutting"],
    "upholstery-cleaning": ["upholstery", "sofa cleaning", "furniture cleaning", "couch cleaning"],
    "carpet-cleaning": ["carpet cleaning", "rug cleaning", "carpet washing", "carpet shampoo", "carpet steam", "rug services", "floor cleaning"],
    "cctv-alarm": ["cctv", "surveillance", "alarm system", "security camera", "intercom", "access control"],
    "delivery-runner": ["delivery", "errands", "errand runner", "dispatch rider", "delivery driver", "courier", "messenger", "dispatch specialist", "توصيل", "runner"]
  };

  let bestMatch = "other";
  let maxWeight = 0;

  for (const [category, keywords] of Object.entries(categoryPatterns)) {
    for (const keyword of keywords) {
      const isEnglish = /^[a-z0-9& \-]+$/i.test(keyword);
      // Use word boundaries for english to avoid partial matches
      const pattern = isEnglish ? `\\b${keyword}\\b` : keyword;
      
      try {
        const regex = new RegExp(pattern, 'i');
        const match = titleLower.match(regex);
        if (match) {
          const weight = keyword.length;
          if (weight > maxWeight) {
            maxWeight = weight;
            bestMatch = category;
          }
        }
      } catch(e) {
        // Fallback for tricky regex
        if (titleLower.includes(keyword.toLowerCase())) {
          const weight = keyword.length;
          if (weight > maxWeight) {
            maxWeight = weight;
            bestMatch = category;
          }
        }
      }
    }
  }

  return bestMatch;
}

const ME_COUNTRY_NAMES = COUNTRIES.map((c) => c.name.toLowerCase());
const ME_COUNTRY_CODES = new Set(COUNTRIES.map((c) => c.code.toLowerCase()));
const ME_CITY_NAMES = Object.keys(CITY_COORDINATES).map((c) => c.toLowerCase());

// Common Arabic city name variants returned by APIs like JSearch
const ARABIC_CITY_NAMES = [
  "Ø¹Ù…Ù‘Ø§Ù†", "Ø¹Ù…Ø§Ù†", // Amman
  "Ø¥Ø±Ø¨Ø¯", // Irbid
  "Ø§Ù„Ø²Ø±Ù‚Ø§Ø¡", // Zarqa
  "Ø§Ù„Ø¹Ù‚Ø¨Ø©", // Aqaba
  "Ø§Ù„Ø±ÙŠØ§Ø¶", // Riyadh
  "Ø¬Ø¯Ø©", "Ø¬Ø¯Ù‡", // Jeddah
  "Ø¯Ø¨ÙŠ", // Dubai
  "Ø£Ø¨ÙˆØ¸Ø¨ÙŠ", "Ø£Ø¨Ùˆ Ø¸Ø¨ÙŠ", // Abu Dhabi
  "Ø§Ù„Ø¯ÙˆØ­Ø©", // Doha
  "Ø§Ù„Ù…Ù†Ø§Ù…Ø©", // Manama
  "Ø§Ù„ÙƒÙˆÙŠØª", // Kuwait City
  "Ù…Ø³Ù‚Ø·", // Muscat
  "Ø¨ØºØ¯Ø§Ø¯", // Baghdad
  "Ø£Ø±Ø¨ÙŠÙ„", // Erbil
  "Ø¨ÙŠØ±ÙˆØª", // Beirut
  "Ø§Ù„Ù‚Ø§Ù‡Ø±Ø©", // Cairo
  "Ø§Ù„Ø¥Ø³ÙƒÙ†Ø¯Ø±ÙŠØ©", // Alexandria
  "Ø§Ù„Ø´Ø§Ø±Ù‚Ø©", // Sharjah
  "Ø§Ù„Ø¯Ù…Ø§Ù…", // Dammam
  "Ù…ÙƒØ©", // Mecca
  "Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©", // Medina
];

const NON_ME_INDICATORS = [
  "new york", "california", "texas", "florida", "chicago", "los angeles",
  "san francisco", "boston", "seattle", "denver", "atlanta", "dallas",
  "houston", "phoenix", "philadelphia", "washington dc", "miami",
  "london", "manchester", "birmingham", "paris", "berlin", "toronto",
  "vancouver", "sydney", "melbourne", "mumbai", "bangalore", "delhi",
  "singapore", "hong kong", "tokyo", "beijing", "shanghai",
  "united states", "united kingdom", "canada", "australia", "india",
  "germany", "france", "usa", "u.s.", "u.k.", "uk",
];

const US_STATE_CODES = new Set([
  "al","ak","az","ar","ca","co","ct","de","fl","ga","hi","id","il","in","ia",
  "ks","ky","la","me","md","ma","mi","mn","ms","mo","mt","ne","nv","nh","nj",
  "nm","ny","nc","nd","oh","ok","or","pa","ri","sc","sd","tn","tx","ut","vt",
  "va","wa","wv","wi","wy","dc",
]);

export function isMiddleEastJob(job: { location: string; country: string; city: string }): boolean {
  const locationLower = job.location.toLowerCase();
  const cityLower = job.city.toLowerCase();
  const countryLower = job.country.toLowerCase();

  // Country must match a ME country name
  if (!ME_COUNTRY_NAMES.includes(countryLower)) {
    return false;
  }

  // Fast reject: known non-ME indicators
  for (const indicator of NON_ME_INDICATORS) {
    if (locationLower.includes(indicator) || cityLower.includes(indicator)) {
      return false;
    }
  }

  // Reject US state abbreviation patterns like ", PA" at end of location
  const stateMatch = job.location.match(/,\s*([A-Z]{2})\s*$/);
  if (stateMatch && US_STATE_CODES.has(stateMatch[1].toLowerCase())) {
    return false;
  }

  // Positive validation: location or city must contain a known ME city, country name,
  // country code, Arabic city name, or common ME-associated terms.
  const allText = `${locationLower} ${cityLower}`;
  const hasKnownMELocation =
    ME_COUNTRY_NAMES.some((name) => allText.includes(name)) ||
    ME_CITY_NAMES.some((city) => allText.includes(city)) ||
    ME_REGION_TERMS.some((term) => allText.includes(term)) ||
    ARABIC_CITY_NAMES.some((name) => job.city.includes(name) || job.location.includes(name)) ||
    // Match 2-letter country codes like "JO", "AE" â€?either bare or at end of location (e.g. "Amman, JO")
    (() => {
      const trimmed = job.location.trim();
      // Bare 2-letter code (entire location is just "JO", "AE", etc.)
      if (/^[A-Z]{2}$/.test(trimmed) && ME_COUNTRY_CODES.has(trimmed.toLowerCase())) return true;
      // Code at end after comma
      const codeMatch = trimmed.match(/,\s*([A-Z]{2})\s*$/);
      return codeMatch ? ME_COUNTRY_CODES.has(codeMatch[1].toLowerCase()) : false;
    })();

  if (!hasKnownMELocation) {
    return false;
  }

  return true;
}

const ME_REGION_TERMS = [
  "middle east", "gulf", "gcc", "mena",
  "arabian", "arab", "islamic",
];

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "…";
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Extract salary information from job title + description text.
 * Returns a human-readable salary string or null if not found.
 */
export function extractSalary(text: string): string | null {
  if (!text) return null;

  // Currency symbols/codes common in ME
  const currencyPatterns = [
    // "AED 2,000 - 4,000" or "AED 2000-4000/month"
    /\b(AED|JOD|SAR|QAR|BHD|KWD|OMR|IQD|LBP|EGP|USD|\$|£)\s*[\d.,]+(?:\s*[-–to]+\s*[\d.,]+)?(?:\s*\/?\s*(?:month|mo|yr|year|per\s+month|per\s+annum|p\.m\.|monthly|annually))?/i,
    // "2,000 - 4,000 AED" (currency after amount)
    /\b[\d.,]+(?:\s*[-–to]+\s*[\d.,]+)?\s*(?:AED|JOD|SAR|QAR|BHD|KWD|OMR|IQD|LBP|EGP|USD)(?:\s*\/?\s*(?:month|mo|yr|year|per\s+month|per\s+annum|monthly))?/i,
    // "Salary: 2000" or "salary range: 1500-2500"
    /salary\s*(?:range)?\s*[:=]?\s*[\$]?\s*[\d.,]+(?:\s*[-–to]+\s*[\d.,]+)?(?:\s*(?:AED|JOD|SAR|QAR|BHD|KWD|OMR|EGP|USD))?(?:\s*\/?\s*(?:month|mo|monthly|per\s+month))?/i,
    // Arabic "راتب" (salary)
    /راتب\s*[:=]?\s*[\d.,]+(?:\s*[-–to]+\s*[\d.,]+)?/,
  ];

  for (const pattern of currencyPatterns) {
    const match = text.match(pattern);
    if (match) {
      let salary = match[0].trim();
      // Clean up: remove "salary:" prefix variations
      salary = salary.replace(/^salary\s*(?:range)?\s*[:=]?\s*/i, "").trim();
      salary = salary.replace(/^راتب\s*[:=]?\s*/i, "").trim();
      return salary;
    }
  }

  return null;
}
