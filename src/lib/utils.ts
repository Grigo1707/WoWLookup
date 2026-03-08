import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getItemQualityColor(quality: string): string {
  const colors: Record<string, string> = {
    Poor: "#9d9d9d",
    Common: "#ffffff",
    Uncommon: "#1eff00",
    Rare: "#0070dd",
    Epic: "#a335ee",
    Legendary: "#ff8000",
    Artifact: "#e6cc80",
    Heirloom: "#00ccff",
  };
  return colors[quality] || "#ffffff";
}

export function getParseColor(parse: number): string {
  if (parse >= 100) return "#e268a8"; // Artifact
  if (parse >= 99) return "#ff8000"; // Legendary
  if (parse >= 95) return "#a335ee"; // Epic
  if (parse >= 75) return "#0070dd"; // Rare
  if (parse >= 50) return "#1eff00"; // Uncommon
  if (parse >= 25) return "#ffffff"; // Common
  return "#9d9d9d"; // Poor
}

export function getParseLabel(parse: number): string {
  if (parse >= 99) return "Legendary";
  if (parse >= 95) return "Epic";
  if (parse >= 75) return "Rare";
  if (parse >= 50) return "Uncommon";
  if (parse >= 25) return "Common";
  return "Poor";
}
