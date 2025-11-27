import { LinearGradientProps } from "expo-linear-gradient";

// NEW: "Midnight Void"
// A deep, expensive-looking Navy fading into pure Black.
// This provides maximum contrast for the Fire Gradient.
export const bannerGradient: Pick<
  LinearGradientProps,
  "colors" | "locations" | "start" | "end"
> = {
  colors: ["#0A192F", "#000000"],
  locations: [0, 1],
  start: { x: 0.5, y: 0 }, // Starts at Top Center
  end: { x: 0.5, y: 1 }, // Ends at Bottom Center
};

// EXISTING: "Fire" (The Party Accent)
// Kept exactly as is, but now it will look brighter against the new background.
export const fireGradient: Pick<
  LinearGradientProps,
  "colors" | "locations" | "start" | "end"
> = {
  colors: ["#FA8900", "#942C00"],
  locations: [0, 0.99],
  start: { x: 1, y: 0 },
  end: { x: 0, y: 0 },
};

// HOST: "Electric" (The Business Accent)
// Kept for the Host side screens we already built.
export const electricGradient: Pick<
  LinearGradientProps,
  "colors" | "locations" | "start" | "end"
> = {
  colors: ["#B92BFF", "#6500B0"],
  locations: [0, 1],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};
