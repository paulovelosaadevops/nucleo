export const LEGACY_CATEGORY_COLOR = "#8f8f99";

export function categoryDisplayColor(color: string | null | undefined) {
  return color ?? LEGACY_CATEGORY_COLOR;
}
