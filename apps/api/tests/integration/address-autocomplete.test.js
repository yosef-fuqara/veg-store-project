const request = require("supertest");
const { getApp, apiUrl } = require("../helpers/test-app");

describe("Address autocomplete", () => {
  it("returns delivery cities", async () => {
    const res = await request(getApp()).get(apiUrl("/address/cities")).query({ q: "eil", lang: "en" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.cities)).toBe(true);
    expect(res.body.data.cities.some((c) => c.key === "eilabun")).toBe(true);
  });
});
