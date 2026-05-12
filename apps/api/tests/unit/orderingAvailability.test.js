const {
  normalizeSettingsForEvaluation,
  evaluateStoreOrderingGate,
  isOrderingCurrentlyAllowed,
  isOutsideConfiguredBusinessHours
} = require("../../src/utils/orderingAvailability");
const { utcMillisAtZonedWallClock } = require("../../src/utils/zonedOperatingHours");

describe("orderingAvailability", () => {
  it("allows ordering when store is open", () => {
    const s = normalizeSettingsForEvaluation({ isStoreOpen: true });
    const g = evaluateStoreOrderingGate(s);
    expect(g.canOrderNow).toBe(true);
    expect(g.storeClosedReason).toBeNull();
  });

  it("blocks ordering only when store is manually closed", () => {
    const s = normalizeSettingsForEvaluation({ isStoreOpen: false });
    const g = evaluateStoreOrderingGate(s);
    expect(g.canOrderNow).toBe(false);
    expect(g.storeClosedReason).toBe("STORE_CLOSED");
  });

  it("does not block ordering when outside configured hours", () => {
    const ms = utcMillisAtZonedWallClock("Asia/Jerusalem", 2026, 6, 15, 7, 0);
    expect(ms).not.toBeNull();
    const s = normalizeSettingsForEvaluation({
      isStoreOpen: true,
      operatingHoursEnabled: true,
      operatingTimezone: "Asia/Jerusalem",
      operatingOpenLocal: "09:00",
      operatingCloseLocal: "21:00"
    });
    const g = evaluateStoreOrderingGate(s);
    expect(g.canOrderNow).toBe(true);
  });

  it("isOrderingCurrentlyAllowed matches manual open flag", () => {
    expect(isOrderingCurrentlyAllowed({ isStoreOpen: true })).toBe(true);
    expect(isOrderingCurrentlyAllowed({ isStoreOpen: false })).toBe(false);
  });

  it("isOutsideConfiguredBusinessHours is false when notice is disabled", () => {
    const ms = utcMillisAtZonedWallClock("Asia/Jerusalem", 2026, 6, 15, 7, 0);
    expect(
      isOutsideConfiguredBusinessHours(
        {
          operatingHoursEnabled: false,
          operatingTimezone: "Asia/Jerusalem",
          operatingOpenLocal: "09:00",
          operatingCloseLocal: "21:00"
        },
        new Date(ms)
      )
    ).toBe(false);
  });

  it("isOutsideConfiguredBusinessHours is true outside same-day window when enabled", () => {
    const ms = utcMillisAtZonedWallClock("Asia/Jerusalem", 2026, 6, 15, 7, 0);
    expect(ms).not.toBeNull();
    expect(
      isOutsideConfiguredBusinessHours(
        {
          operatingHoursEnabled: true,
          operatingTimezone: "Asia/Jerusalem",
          operatingOpenLocal: "09:00",
          operatingCloseLocal: "21:00"
        },
        new Date(ms)
      )
    ).toBe(true);
  });

  it("isOutsideConfiguredBusinessHours is false inside same-day window when enabled", () => {
    const ms = utcMillisAtZonedWallClock("Asia/Jerusalem", 2026, 6, 15, 12, 0);
    expect(ms).not.toBeNull();
    expect(
      isOutsideConfiguredBusinessHours(
        {
          operatingHoursEnabled: true,
          operatingTimezone: "Asia/Jerusalem",
          operatingOpenLocal: "09:00",
          operatingCloseLocal: "21:00"
        },
        new Date(ms)
      )
    ).toBe(false);
  });
});
