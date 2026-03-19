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
  const categoryMap: Record<string, string> = {
    carpenter: "carpenter",
    carpentry: "carpenter",
    woodwork: "carpenter",
    painter: "painter",
    painting: "painter",
    plumber: "plumber",
    plumbing: "plumber",
    electrician: "electrician",
    electrical: "electrician",
    wiring: "electrician",
    babysitter: "babysitter",
    nanny: "babysitter",
    childcare: "babysitter",
    "child care": "babysitter",
    "pool cleaner": "pool-cleaner",
    "swimming pool": "pool-cleaner",
    cleaner: "house-cleaner",
    cleaning: "house-cleaner",
    maid: "house-cleaner",
    housekeeper: "house-cleaner",
    housekeeping: "house-cleaner",
    "house keeping": "house-cleaner",
    janitor: "house-cleaner",
    gardener: "gardener",
    landscaper: "gardener",
    landscaping: "gardener",
    driver: "driver",
    chauffeur: "driver",
    driving: "driver",
    cook: "cook",
    chef: "cook",
    kitchen: "cook",
    cooking: "cook",
    "food service": "cook",
    waiter: "cook",
    waitress: "cook",
    commis: "cook",
    catering: "cook",
    barista: "cook",
    baker: "cook",
    security: "security",
    guard: "security",
    watchman: "security",
    "ac technician": "ac-technician",
    "air conditioning": "ac-technician",
    hvac: "ac-technician",
    "air condition": "ac-technician",
    handyman: "handyman",
    maintenance: "handyman",
    "general repair": "handyman",
    mover: "moving",
    porter: "moving",
    moving: "moving",
    relocation: "moving",
    laundry: "laundry",
    "dry clean": "laundry",
    "pet care": "pet-care",
    "dog walker": "pet-care",
    "pet sitter": "pet-care",
    veterinar: "pet-care",
    contractor: "contractor",
    "construction worker": "contractor",
    foreman: "contractor",
    "site supervisor": "contractor",
    "general labor": "contractor",
    mason: "contractor",
    masonry: "contractor",
    tiler: "tiler",
    tiling: "tiler",
    "tile installer": "tiler",
    "floor installer": "tiler",
    welder: "welder",
    welding: "welder",
    fabricat: "welder",
    "metal work": "welder",
    "pest control": "pest-control",
    exterminat: "pest-control",
    fumigat: "pest-control",
    "appliance repair": "appliance-repair",
    "appliance technician": "appliance-repair",
    refrigerat: "appliance-repair",
    "washing machine": "appliance-repair",
    "window clean": "window-cleaner",
    "facade clean": "window-cleaner",
    "glass clean": "window-cleaner",
    "interior design": "interior-designer",
    decorator: "interior-designer",
    "home decor": "interior-designer",
    "interior fit": "interior-designer",
    // Additional common ME job title variants
    steward: "house-cleaner",
    "room attendant": "house-cleaner",
    "house boy": "house-cleaner",
    "office boy": "house-cleaner",
    servant: "house-cleaner",
    helper: "handyman",
    "facility management": "handyman",
    "building maintenance": "handyman",
    technician: "handyman",
    "service technician": "handyman",
    mechanic: "handyman",
    "delivery driver": "delivery-runner",
    courier: "delivery-runner",
    messenger: "delivery-runner",
    "bus driver": "driver",
    "heavy driver": "driver",
    "light driver": "driver",
    butcher: "cook",
    dishwasher: "cook",
    "food handler": "cook",
    "sous chef": "cook",
    "executive chef": "cook",
    "demi chef": "cook",
    "pastry chef": "cook",
    lifeguard: "pool-cleaner",
    "pool attendant": "pool-cleaner",
    "swimming instructor": "pool-cleaner",
    "pest management": "pest-control",
    scaffolder: "contractor",
    rigger: "contractor",
    "steel fixer": "contractor",
    "pipe fitter": "plumber",
    pipefitter: "plumber",
    "sanitary": "plumber",
    // Additional common job title matches
    "landscape": "gardener",
    "lawn": "gardener",
    "horticultur": "gardener",
    receptionist: "house-cleaner",
    "front desk": "house-cleaner",
    "bellboy": "house-cleaner",
    "bell boy": "house-cleaner",
    "valet": "driver",
    "warehouse": "moving",
    "labor": "contractor",
    "labour": "contractor",
    "construction": "contractor",
    estimator: "contractor",
    "site engineer": "contractor",
    "gym": "handyman",
    "fitness": "handyman",
    // Broader trade/service terms for Jooble & other API sources
    engineer: "contractor",
    "project manager": "contractor",
    supervisor: "contractor",
    inspector: "handyman",
    installer: "handyman",
    "repair": "handyman",
    fitter: "handyman",
    operator: "handyman",
    "supply chain": "moving",
    logistics: "moving",
    "store keeper": "moving",
    storekeeper: "moving",
    "stock": "moving",
    procurement: "moving",
    "food and beverage": "cook",
    "f&b": "cook",
    "restaurant": "cook",
    hostess: "cook",
    host: "cook",
    "dining": "cook",
    "spa": "house-cleaner",
    attendant: "house-cleaner",
    "laundress": "laundry",
    "linen": "laundry",
    "tailor": "laundry",
    "seamstress": "laundry",
    "sewing": "laundry",
    "nursery": "babysitter",
    "governess": "babysitter",
    "tutor": "babysitter",
    "teacher": "babysitter",
    "caregiver": "babysitter",
    "care giver": "babysitter",
    "elderly care": "babysitter",
    "home care": "babysitter",
    "cctv": "cctv-alarm",
    "surveillance": "cctv-alarm",
    "fire": "security",
    "safety officer": "security",
    "hse": "security",
    "concierge": "house-cleaner",
    "doorman": "security",
    "patrol": "security",
    "bouncer": "security",
    // Ironing / Pressing (split from laundry)
    ironing: "ironing",
    pressing: "ironing",
    "press service": "ironing",
    "iron service": "ironing",
    // Furniture Assembly
    "furniture assembly": "furniture-assembly",
    "furniture installer": "furniture-assembly",
    "furniture repair": "furniture-assembly",
    "cabinet": "furniture-assembly",
    "wardrobe assembly": "furniture-assembly",
    // Car Wash
    "car wash": "car-wash",
    "car cleaning": "car-wash",
    "auto detailing": "car-wash",
    "vehicle cleaning": "car-wash",
    "car care": "car-wash",
    // Satellite / TV Installation
    satellite: "satellite-tv",
    "dish installation": "satellite-tv",
    antenna: "satellite-tv",
    "tv installation": "satellite-tv",
    "tv mounting": "satellite-tv",
    // Water Tank Cleaning
    "water tank": "water-tank",
    "tank cleaning": "water-tank",
    cistern: "water-tank",
    // Solar Panel Installation
    "solar panel": "solar-panel",
    "solar installation": "solar-panel",
    "solar energy": "solar-panel",
    photovoltaic: "solar-panel",
    // Curtain / Blinds Installation
    curtain: "curtain-blinds",
    blinds: "curtain-blinds",
    drapes: "curtain-blinds",
    "roller blind": "curtain-blinds",
    // Home Renovation
    renovation: "home-renovation",
    remodeling: "home-renovation",
    refurbishment: "home-renovation",
    "home improvement": "home-renovation",
    "fit out": "home-renovation",
    fitout: "home-renovation",
    // Locksmith
    locksmith: "locksmith",
    "lock repair": "locksmith",
    "key cutting": "locksmith",
    "door lock": "locksmith",
    // Glass / Mirror Work
    "glass work": "glass-work",
    glazier: "glass-work",
    "mirror": "glass-work",
    "glass installation": "glass-work",
    "glass cutting": "glass-work",
    // Upholstery / Sofa Cleaning
    upholstery: "upholstery-cleaning",
    "sofa cleaning": "upholstery-cleaning",
    "furniture cleaning": "upholstery-cleaning",
    "couch cleaning": "upholstery-cleaning",
    // Rug / Carpet Cleaning
    "carpet cleaning": "carpet-cleaning",
    "rug cleaning": "carpet-cleaning",
    "carpet washing": "carpet-cleaning",
    "carpet shampoo": "carpet-cleaning",
    "carpet steam": "carpet-cleaning",
    // CCTV / Alarm Installation (split from security)
    "alarm system": "cctv-alarm",
    "security camera": "cctv-alarm",
    intercom: "cctv-alarm",
    "access control": "cctv-alarm",
    // Delivery / Errands Runner (split from driver)
    errands: "delivery-runner",
    "errand runner": "delivery-runner",
    "dispatch rider": "delivery-runner",
    delivery: "delivery-runner",
    // Arabic household service terms
    "نظافة": "house-cleaner",
    "عامل نظافة": "house-cleaner",
    "خادمة": "house-cleaner",
    "خادمات": "house-cleaner",
    "شغالة": "house-cleaner",
    "شغالات": "house-cleaner",
    "عاملة منزلية": "house-cleaner",
    "عاملات منازل": "house-cleaner",
    "تنظيف": "house-cleaner",
    "تنظيف منازل": "house-cleaner",
    "تنظيف فلل": "house-cleaner",
    "تنظيف شقق": "house-cleaner",
    "جليسة": "babysitter",
    "عناية بالاطفال": "babysitter",
    "سباك": "plumber",
    "تمديدات صحية": "plumber",
    "نجار": "carpenter",
    "نجّار": "carpenter",
    "كهربائي": "electrician",
    "تمديدات كهربائية": "electrician",
    "دهان": "painter",
    "طباخ": "cook",
    "شيف": "cook",
    "سائق": "driver",
    "توصيل": "delivery-runner",
    "مربية": "babysitter",
    "بستاني": "gardener",
    "حارس": "security",
    "حارس أمن": "security",
    "لحام": "welder",
    "بلاط": "tiler",
    "تكييف": "ac-technician",
    "نقل اثاث": "moving",
    "صيانة": "handyman",
  };

  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (titleLower.includes(keyword)) {
      return category;
    }
  }
  return "other";
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
    /\b(AED|JOD|SAR|QAR|BHD|KWD|OMR|IQD|LBP|EGP|USD|\$|£)\s*[\d,]+(?:\s*[-–to]+\s*[\d,]+)?(?:\s*\/?\s*(?:month|mo|yr|year|per\s+month|per\s+annum|p\.m\.|monthly|annually))?\b/i,
    // "2,000 - 4,000 AED" (currency after amount)
    /\b[\d,]+(?:\s*[-–to]+\s*[\d,]+)?\s*(?:AED|JOD|SAR|QAR|BHD|KWD|OMR|IQD|LBP|EGP|USD)(?:\s*\/?\s*(?:month|mo|yr|year|per\s+month|per\s+annum|monthly))?\b/i,
    // "Salary: 2000" or "salary range: 1500-2500"
    /salary\s*(?:range)?\s*[:=]?\s*[\$]?\s*[\d,]+(?:\s*[-–to]+\s*[\d,]+)?(?:\s*(?:AED|JOD|SAR|QAR|BHD|KWD|OMR|EGP|USD))?(?:\s*\/?\s*(?:month|mo|monthly|per\s+month))?\b/i,
    // Arabic "راتب" (salary)
    /راتب\s*[:=]?\s*[\d,]+(?:\s*[-–to]+\s*[\d,]+)?/,
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
