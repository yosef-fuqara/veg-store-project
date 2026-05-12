const { parseHHMM, evaluateWindow, utcMillisAtZonedWallClock } = require("../../src/utils/zonedOperatingHours");

describe("zonedOperatingHours", () => {
  it("parseHHMM accepts valid times", () => {
    expect(parseHHMM("09:30")).toEqual({ hour: 9, minute: 30 });
    expect(parseHHMM("23:59")).toEqual({ hour: 23, minute: 59 });
    expect(parseHHMM("24:00")).toBeNull();
  });

  it("evaluateWindow same-day: closed before open", () => {
    const ms = utcMillisAtZonedWallClock("Asia/Jerusalem", 2026, 6, 15, 7, 0);
    expect(ms).not.toBeNull();
    const r = evaluateWindow({
      at: new Date(ms),
      timeZone: "Asia/Jerusalem",
      openM: 9 * 60,
      closeM: 21 * 60
    });
    expect(r.within).toBe(false);
    expect(r.nextOpenAtMs).not.toBeNull();
  });

  it("evaluateWindow same-day: open in range", () => {
    const ms = utcMillisAtZonedWallClock("Asia/Jerusalem", 2026, 6, 15, 12, 0);
    expect(ms).not.toBeNull();
    const r = evaluateWindow({
      at: new Date(ms),
      timeZone: "Asia/Jerusalem",
      openM: 9 * 60,
      closeM: 21 * 60
    });
    expect(r.within).toBe(true);
  });
});
