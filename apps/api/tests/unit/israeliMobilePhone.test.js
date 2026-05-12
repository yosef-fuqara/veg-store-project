const {
  normalizeIsraeliMobile,
  isValidIsraeliMobile
} = require("../../src/utils/israeliMobilePhone");

describe("israeliMobilePhone", () => {
  it("accepts local mobile prefixes 050,052–055,058,059", () => {
    expect(normalizeIsraeliMobile("0501234567")).toBe("0501234567");
    expect(normalizeIsraeliMobile("0521234567")).toBe("0521234567");
    expect(normalizeIsraeliMobile("0531234567")).toBe("0531234567");
    expect(normalizeIsraeliMobile("0541234567")).toBe("0541234567");
    expect(normalizeIsraeliMobile("0551234567")).toBe("0551234567");
    expect(normalizeIsraeliMobile("0581234567")).toBe("0581234567");
    expect(normalizeIsraeliMobile("0591234567")).toBe("0591234567");
  });

  it("rejects invalid middle digit (e.g. 051)", () => {
    expect(normalizeIsraeliMobile("0511234567")).toBeNull();
  });

  it("normalizes international +972 and 972", () => {
    expect(normalizeIsraeliMobile("+972501234567")).toBe("0501234567");
    expect(normalizeIsraeliMobile("+972-50-1234567")).toBe("0501234567");
    expect(normalizeIsraeliMobile("972501234567")).toBe("0501234567");
  });

  it("normalizes 9-digit national significant number", () => {
    expect(normalizeIsraeliMobile("501234567")).toBe("0501234567");
  });

  it("trims and strips common separators", () => {
    expect(normalizeIsraeliMobile("  050 123 4567 ")).toBe("0501234567");
    expect(normalizeIsraeliMobile("050-123-4567")).toBe("0501234567");
  });

  it("rejects blocklisted numbers", () => {
    expect(normalizeIsraeliMobile("0000000000")).toBeNull();
    expect(normalizeIsraeliMobile("1234567890")).toBeNull();
  });

  it("rejects invalid characters", () => {
    expect(normalizeIsraeliMobile("050123456a")).toBeNull();
    expect(normalizeIsraeliMobile("abc")).toBeNull();
  });

  it("isValidIsraeliMobile mirrors normalize", () => {
    expect(isValidIsraeliMobile("0521234567")).toBe(true);
    expect(isValidIsraeliMobile("0511234567")).toBe(false);
  });
});
