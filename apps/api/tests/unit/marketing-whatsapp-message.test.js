const { buildMarketingWhatsAppMessage } = require("../../src/utils/marketing-whatsapp-message");

describe("buildMarketingWhatsAppMessage", () => {
  it("includes bold title, body, and unsubscribe footer", () => {
    expect(
      buildMarketingWhatsAppMessage({
        title: "SALE SALE !!!",
        message: "helloo"
      })
    ).toBe("*SALE SALE !!!*\n\nhelloo\n\nTo unsubscribe, reply STOP.");
  });

  it("omits title block when title is empty", () => {
    expect(
      buildMarketingWhatsAppMessage({
        title: "",
        message: "helloo"
      })
    ).toBe("helloo\n\nTo unsubscribe, reply STOP.");
  });

  it("trims title and body", () => {
    expect(
      buildMarketingWhatsAppMessage({
        title: "  Promo  ",
        message: "  body  "
      })
    ).toBe("*Promo*\n\nbody\n\nTo unsubscribe, reply STOP.");
  });
});
