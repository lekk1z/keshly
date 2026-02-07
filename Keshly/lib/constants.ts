// Preset categories (1-5), must match app/(tabs)/index.tsx display
export const CATEGORIES = [
  { id: 1, name: "Namirnice" },
  { id: 2, name: "Restorani i kafici" },
  { id: 3, name: "Transport" },
  { id: 4, name: "Zabava" },
  { id: 5, name: "Ostalo" },
] as const;

export const CATEGORY_IDS = [1, 2, 3, 4, 5] as const;
export type KategorijaId = (typeof CATEGORY_IDS)[number];

export function clampKategorija(value: number): KategorijaId {
  const n = Math.round(Number(value));
  if (n <= 0) return 1;
  if (n >= 5) return 5;
  return n as KategorijaId;
}

export function getCategoryPromptText(): string {
  return CATEGORIES.map((c) => `${c.id}=${c.name}`).join(", ");
}

/** Full explanation of kategorija for the AI request so it knows what each number means. */
export function getKategorijaExplanationForAI(): string {
  return [
    "kategorija must be an integer from 1 to 5 with this exact meaning:",
    "1 = Namirnice (food, groceries)",
    "2 = Restorani i kafici (restaurants and cafes)",
    "3 = Transport",
    "4 = Zabava (entertainment)",
    "5 = Ostalo (other).",
    "Return only the number (1-5) that best matches each receipt item.",
  ].join(" ");
}
