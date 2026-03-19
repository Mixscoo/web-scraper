import { Source } from "./types";

export const COUNTRIES = [
  { code: "JO", name: "Jordan", flag: "🇯🇴", coordinates: { lat: 31.95, lng: 35.93 } },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", coordinates: { lat: 23.88, lng: 45.08 } },
  { code: "AE", name: "UAE", flag: "🇦🇪", coordinates: { lat: 23.42, lng: 53.85 } },
  { code: "QA", name: "Qatar", flag: "🇶🇦", coordinates: { lat: 25.35, lng: 51.18 } },
  { code: "BH", name: "Bahrain", flag: "🇧🇭", coordinates: { lat: 26.07, lng: 50.55 } },
  { code: "KW", name: "Kuwait", flag: "🇰🇼", coordinates: { lat: 29.31, lng: 47.48 } },
  { code: "OM", name: "Oman", flag: "🇴🇲", coordinates: { lat: 21.47, lng: 55.98 } },
  { code: "IQ", name: "Iraq", flag: "🇮🇶", coordinates: { lat: 33.22, lng: 43.68 } },
  { code: "LB", name: "Lebanon", flag: "🇱🇧", coordinates: { lat: 33.85, lng: 35.86 } },
  { code: "EG", name: "Egypt", flag: "🇪🇬", coordinates: { lat: 26.82, lng: 30.80 } },
] as const;

export const CATEGORIES = [
  { id: "carpenter", name: "Carpenter", icon: "Hammer" },
  { id: "painter", name: "Painter", icon: "Paintbrush" },
  { id: "plumber", name: "Plumber", icon: "Wrench" },
  { id: "electrician", name: "Electrician", icon: "Zap" },
  { id: "babysitter", name: "Babysitter / Nanny", icon: "Baby" },
  { id: "pool-cleaner", name: "Pool Cleaner", icon: "Waves" },
  { id: "house-cleaner", name: "House Cleaner / Maid", icon: "SprayCan" },
  { id: "gardener", name: "Gardener / Landscaper", icon: "Flower2" },
  { id: "driver", name: "Driver", icon: "Car" },
  { id: "cook", name: "Cook / Chef", icon: "ChefHat" },
  { id: "security", name: "Security Guard", icon: "Shield" },
  { id: "ac-technician", name: "AC Technician", icon: "Snowflake" },
  { id: "handyman", name: "Handyman", icon: "Hammer" },
  { id: "moving", name: "Moving / Porter", icon: "Package" },
  { id: "laundry", name: "Laundry / Dry Cleaning", icon: "Shirt" },
  { id: "pet-care", name: "Pet Care", icon: "Dog" },
  { id: "contractor", name: "General Contractor", icon: "HardHat" },
  { id: "tiler", name: "Tiler", icon: "Grid3X3" },
  { id: "welder", name: "Welder / Fabricator", icon: "Flame" },
  { id: "pest-control", name: "Pest Control", icon: "Bug" },
  { id: "appliance-repair", name: "Appliance Repair", icon: "Settings" },
  { id: "window-cleaner", name: "Window Cleaner", icon: "Sparkles" },
  { id: "interior-designer", name: "Interior Designer", icon: "Palette" },
  { id: "ironing", name: "Ironing / Pressing", icon: "Shirt" },
  { id: "furniture-assembly", name: "Furniture Assembly", icon: "Armchair" },
  { id: "car-wash", name: "Car Wash", icon: "CarFront" },
  { id: "satellite-tv", name: "Satellite / TV Installation", icon: "Satellite" },
  { id: "water-tank", name: "Water Tank Cleaning", icon: "Droplets" },
  { id: "solar-panel", name: "Solar Panel Installation", icon: "Sun" },
  { id: "curtain-blinds", name: "Curtain / Blinds Installation", icon: "Blinds" },
  { id: "home-renovation", name: "Home Renovation", icon: "Home" },
  { id: "locksmith", name: "Locksmith", icon: "KeyRound" },
  { id: "glass-work", name: "Glass / Mirror Work", icon: "Glasses" },
  { id: "upholstery-cleaning", name: "Upholstery / Sofa Cleaning", icon: "Sofa" },
  { id: "carpet-cleaning", name: "Rug / Carpet Cleaning", icon: "RectangleHorizontal" },
  { id: "cctv-alarm", name: "CCTV / Alarm Installation", icon: "Camera" },
  { id: "delivery-runner", name: "Delivery / Errands Runner", icon: "Bike" },
] as const;

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export const SOURCES: Source[] = [
  {
    id: "linkedin",
    name: "LinkedIn Jobs",
    url: "https://www.linkedin.com/jobs",
    logo: "/sources/linkedin.svg",
    description: "Professional networking platform with a comprehensive job board for the Middle East.",
    active: true,
  },
  {
    id: "talent",
    name: "Talent.com",
    url: "https://www.talent.com",
    logo: "/sources/talentcom.svg",
    description: "Global job aggregator with dedicated Middle East portals covering millions of listings.",
    active: true,
  },
  {
    id: "jsearch",
    name: "JSearch",
    url: "https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch",
    logo: "/sources/jsearch.svg",
    description: "Multi-source job API aggregating listings from LinkedIn, Indeed, Glassdoor, and more.",
    active: true,
  },
  {
    id: "adzuna",
    name: "Adzuna",
    url: "https://www.adzuna.com",
    logo: "/sources/adzuna.svg",
    description: "Job search engine covering UAE, Saudi Arabia, and Egypt with millions of listings.",
    active: true,
  },
  {
    id: "jooble",
    name: "Jooble",
    url: "https://jooble.org",
    logo: "/sources/jooble.svg",
    description: "International job aggregator with dedicated portals for all Middle East countries.",
    active: true,
  },
  {
    id: "grabjobs",
    name: "GrabJobs",
    url: "https://grabjobs.co",
    logo: "/sources/grabjobs.svg",
    description: "International job platform with listings across all Middle East countries.",
    active: true,
  },
  {
    id: "bayt",
    name: "Bayt",
    url: "https://www.bayt.com",
    logo: "/sources/bayt.svg",
    description: "The Middle East's leading job board with extensive household and service listings.",
    active: true,
  },
  {
    id: "opensooq",
    name: "OpenSooq",
    url: "https://jo.opensooq.com",
    logo: "/sources/opensooq.svg",
    description: "Jordan's undisputed leading digital classifieds platform for gig workers and home service providers.",
    active: true,
  },
];

export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Jordan
  "Amman": { lat: 31.9454, lng: 35.9284 },
  "Irbid": { lat: 32.5568, lng: 35.8469 },
  "Zarqa": { lat: 32.0728, lng: 36.0880 },
  "Aqaba": { lat: 29.5267, lng: 35.0078 },
  // Saudi Arabia
  "Riyadh": { lat: 24.7136, lng: 46.6753 },
  "Jeddah": { lat: 21.4858, lng: 39.1925 },
  "Dammam": { lat: 26.3927, lng: 49.9777 },
  "Mecca": { lat: 21.3891, lng: 39.8579 },
  "Medina": { lat: 24.5247, lng: 39.5692 },
  "Khobar": { lat: 26.2172, lng: 50.1971 },
  "Dhahran": { lat: 26.2361, lng: 50.0393 },
  "Tabuk": { lat: 28.3838, lng: 36.5550 },
  "Jubail": { lat: 27.0046, lng: 49.6225 },
  "Yanbu": { lat: 24.0895, lng: 38.0618 },
  // UAE
  "Dubai": { lat: 25.2048, lng: 55.2708 },
  "Abu Dhabi": { lat: 24.4539, lng: 54.3773 },
  "Sharjah": { lat: 25.3463, lng: 55.4209 },
  "Ajman": { lat: 25.4052, lng: 55.5136 },
  "Ras Al Khaimah": { lat: 25.7895, lng: 55.9432 },
  "Fujairah": { lat: 25.1288, lng: 56.3265 },
  "Al Ain": { lat: 24.1917, lng: 55.7606 },
  "Musaffah": { lat: 24.3547, lng: 54.4961 },
  "Jumeirah": { lat: 25.2084, lng: 55.2539 },
  // Qatar
  "Doha": { lat: 25.2854, lng: 51.5310 },
  // Bahrain
  "Manama": { lat: 26.2285, lng: 50.5860 },
  // Kuwait
  "Kuwait City": { lat: 29.3759, lng: 47.9774 },
  // Oman
  "Muscat": { lat: 23.5880, lng: 58.3829 },
  // Iraq
  "Baghdad": { lat: 33.3152, lng: 44.3661 },
  "Erbil": { lat: 36.1912, lng: 44.0119 },
  // Lebanon
  "Beirut": { lat: 33.8938, lng: 35.5018 },
  // Egypt
  "Cairo": { lat: 30.0444, lng: 31.2357 },
  "Alexandria": { lat: 31.2001, lng: 29.9187 },
};

export const DATE_FILTERS = [
  { value: "all", label: "All Time" },
  { value: "24h", label: "Last 24 Hours" },
  { value: "week", label: "Last Week" },
  { value: "month", label: "Last Month" },
] as const;

export const ITEMS_PER_PAGE = 12;
