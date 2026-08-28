import { describe, expect, it } from "vitest";

import { categoryDisplayColor, LEGACY_CATEGORY_COLOR } from "./financial-category-colors";

describe("categoryDisplayColor", () => {
  it("preserves the persisted database color used by finance charts", () => {
    expect(categoryDisplayColor("#2DD4BF")).toBe("#2DD4BF");
  });

  it("uses a neutral color only when legacy data has no persisted color", () => {
    expect(categoryDisplayColor(null)).toBe(LEGACY_CATEGORY_COLOR);
  });
});
