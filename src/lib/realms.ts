export interface Realm {
  name: string;
  slug: string;
  region: string;
  namespace: string;
  type: "retail" | "classic" | "classic-era" | "classic-tbc" | "classic-wotlk" | "classic-cata" | "classic-mop";
  typeLabel: string;
}

export const REALMS: Realm[] = [
  // EU Retail
  { name: "Antonidas", slug: "antonidas", region: "eu", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Blackrock", slug: "blackrock", region: "eu", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Die ewige Wacht", slug: "die-ewige-wacht", region: "eu", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Eredar", slug: "eredar", region: "eu", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Frostmourne", slug: "frostmourne", region: "eu", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Kelthuzad", slug: "kelthuzad", region: "eu", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Lordaeron", slug: "lordaeron", region: "eu", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Mal'Ganis", slug: "malganis", region: "eu", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Myzrael", slug: "myzrael", region: "eu", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Onyxia", slug: "onyxia", region: "eu", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Ravencrest", slug: "ravencrest", region: "eu", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Stormscale", slug: "stormscale", region: "eu", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Sylvanas", slug: "sylvanas", region: "eu", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Tarren Mill", slug: "tarren-mill", region: "eu", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Twisting Nether", slug: "twisting-nether", region: "eu", namespace: "profile", type: "retail", typeLabel: "Retail" },
  // EU Classic Era (1x)
  { name: "Firemaw", slug: "firemaw", region: "eu", namespace: "profile-classic1x", type: "classic-era", typeLabel: "Classic Era" },
  { name: "Spineshatter", slug: "spineshatter", region: "eu", namespace: "profile-classic1x", type: "classic-era", typeLabel: "Classic Era" },
  // EU TBC Anniversary – namespace is "profile-classic" (confirmed working)
  { name: "Thunderstrike", slug: "thunderstrike", region: "eu", namespace: "profile-classic", type: "classic-tbc", typeLabel: "TBC Anniversary" },
  { name: "Crusader Strike", slug: "crusader-strike", region: "eu", namespace: "profile-classic", type: "classic-tbc", typeLabel: "TBC Anniversary" },
  // EU WotLK Anniversary
  { name: "Atiesh", slug: "atiesh", region: "eu", namespace: "profile-classic", type: "classic-wotlk", typeLabel: "WotLK Anniversary" },
  // US Retail
  { name: "Area 52", slug: "area-52", region: "us", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Illidan", slug: "illidan", region: "us", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Mal'Ganis", slug: "malganis", region: "us", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Stormrage", slug: "stormrage", region: "us", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Tichondrius", slug: "tichondrius", region: "us", namespace: "profile", type: "retail", typeLabel: "Retail" },
  { name: "Thrall", slug: "thrall", region: "us", namespace: "profile", type: "retail", typeLabel: "Retail" },
  // US Classic Era
  { name: "Faerlina", slug: "faerlina", region: "us", namespace: "profile-classic1x", type: "classic-era", typeLabel: "Classic Era" },
  { name: "Benediction", slug: "benediction", region: "us", namespace: "profile-classic1x", type: "classic-era", typeLabel: "Classic Era" },
  // US TBC Anniversary
  { name: "Crusader Strike", slug: "crusader-strike", region: "us", namespace: "profile-classic", type: "classic-tbc", typeLabel: "TBC Anniversary" },
];

export const REGIONS = [
  { value: "eu", label: "Europe" },
  { value: "us", label: "Americas" },
  { value: "kr", label: "Korea" },
  { value: "tw", label: "Taiwan" },
];

export function getRealmsByRegion(region: string): Realm[] {
  return REALMS.filter((r) => r.region === region);
}
