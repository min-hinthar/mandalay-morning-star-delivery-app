/**
 * Trigger haptic feedback via the Vibration API.
 */
export function triggerHaptic(type: "light" | "medium" | "heavy" = "light") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const durations = { light: 5, medium: 15, heavy: 25 };
    navigator.vibrate(durations[type]);
  }
}

/**
 * Get fallback emoji based on item name (Myanmar cuisine mapping).
 */
export function getFallbackEmoji(name: string): string {
  const lowercaseName = name.toLowerCase();

  // Rice dishes
  if (
    lowercaseName.includes("rice") ||
    lowercaseName.includes("fried rice") ||
    lowercaseName.includes("htamin")
  ) {
    return "\u{1F35A}"; // Rice bowl
  }

  // Noodles
  if (
    lowercaseName.includes("noodle") ||
    lowercaseName.includes("khao swe") ||
    lowercaseName.includes("mohinga")
  ) {
    return "\u{1F35C}"; // Noodle bowl
  }

  // Curry
  if (lowercaseName.includes("curry") || lowercaseName.includes("hin")) {
    return "\u{1F35B}"; // Curry
  }

  // Soup
  if (lowercaseName.includes("soup") || lowercaseName.includes("hin cho")) {
    return "\u{1F372}"; // Pot of food
  }

  // Salad
  if (lowercaseName.includes("salad") || lowercaseName.includes("thoke")) {
    return "\u{1F957}"; // Salad
  }

  // Tea/drinks
  if (
    lowercaseName.includes("tea") ||
    lowercaseName.includes("laphet") ||
    lowercaseName.includes("drink")
  ) {
    return "\u{1F375}"; // Tea
  }

  // Default food emoji
  return "\u{1F35C}"; // Default noodle bowl for Myanmar cuisine
}
