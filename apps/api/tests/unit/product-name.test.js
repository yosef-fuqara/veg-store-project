const {
  getLocalizedProductName,
  getLocalizedText,
  toProductNameLocales,
  resolveProductNameString
} = require("../../src/utils/product-name");

describe("product-name utils", () => {
  const trilingual = { ar: "بصل أبيض", he: "בצל לבן", en: "White onion" };

  it("getLocalizedText prefers selected language", () => {
    expect(getLocalizedText(trilingual, "ar")).toBe("بصل أبيض");
    expect(getLocalizedText(trilingual, "he")).toBe("בצל לבן");
    expect(getLocalizedText(trilingual, "en")).toBe("White onion");
  });

  it("getLocalizedText falls back ar → he → en when selected locale missing", () => {
    const partial = { en: "White onion", he: "בצל לבן", ar: "" };
    expect(getLocalizedText(partial, "ar")).toBe("בצל לבן");
    expect(getLocalizedText(partial, "he")).toBe("בצל לבן");
  });

  it("getLocalizedProductName reads product.name object", () => {
    expect(getLocalizedProductName({ name: trilingual, _id: "abc" }, "ar")).toBe("بصل أبيض");
  });

  it("getLocalizedProductName reads order item nameLocales", () => {
    expect(
      getLocalizedProductName(
        { name: "White onion", nameLocales: trilingual, product: "pid1" },
        "ar",
        { warnInDev: false }
      )
    ).toBe("بصل أبيض");
  });

  it("getLocalizedProductName reads cart productSnapshot.name", () => {
    expect(
      getLocalizedProductName(
        { productSnapshot: { name: trilingual }, product: "pid2" },
        "he"
      )
    ).toBe("בצל לבן");
  });

  it("legacy string name still resolves", () => {
    expect(getLocalizedProductName({ name: "Legacy Name" }, "ar")).toBe("Legacy Name");
  });

  it("toProductNameLocales normalizes legacy string", () => {
    expect(toProductNameLocales("Tomato")).toEqual({
      ar: "Tomato",
      he: "Tomato",
      en: "Tomato"
    });
  });

  it("resolveProductNameString prefers English for legacy flat order name", () => {
    expect(resolveProductNameString(trilingual)).toBe("White onion");
  });
});
