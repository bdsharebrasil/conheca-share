import { describe, expect, it } from "vitest";
// @ts-expect-error The original site's browser modules are plain JavaScript.
import { DEMO_AIRCRAFT_LABEL } from "../portal/booking-view.js";

describe("Public booking illustration", () => {
  it("uses a neutral aircraft label instead of the real registration", () => {
    expect(DEMO_AIRCRAFT_LABEL).toBe("Aeronave demonstrativa");
    expect(DEMO_AIRCRAFT_LABEL).not.toMatch(/\bP[PRT]-[A-Z]{3}\b/);
  });
});
