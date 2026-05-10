const mongoose = require("mongoose");
const request = require("supertest");
const { getApp, apiUrl } = require("../helpers/test-app");
const {
  createAdminUser,
  createAnnouncement,
  createCategory,
  createProduct,
  loginAndGetAccessToken,
  DEFAULT_PASSWORD
} = require("../helpers/factories");

describe("Announcements / promotions", () => {
  it("GET /announcements/active returns null when none match", async () => {
    const res = await request(getApp()).get(apiUrl("/announcements/active"));
    expect(res.status).toBe(200);
    expect(res.body.data.announcement).toBeNull();
  });

  it("GET /announcements/active returns active in-window announcement", async () => {
    const past = new Date(Date.now() - 60000);
    const future = new Date(Date.now() + 86400000);
    await createAnnouncement({
      title: "Summer sale",
      message: "Fresh deals",
      isActive: true,
      startsAt: past,
      endsAt: future
    });

    const res = await request(getApp()).get(apiUrl("/announcements/active"));
    expect(res.status).toBe(200);
    expect(res.body.data.announcement).toMatchObject({
      title: "Summer sale",
      message: "Fresh deals",
      cta: null
    });
    expect(res.body.data.announcement.id).toBeDefined();
    expect(res.body.data.announcement.endsAt).toBeDefined();
  });

  it("GET /announcements/active skips inactive, expired, future, and archived", async () => {
    const now = Date.now();
    await createAnnouncement({
      title: "Off",
      isActive: false,
      startsAt: new Date(now - 1000),
      endsAt: new Date(now + 100000)
    });
    await createAnnouncement({
      title: "Expired",
      isActive: true,
      startsAt: new Date(now - 200000),
      endsAt: new Date(now - 100000)
    });
    await createAnnouncement({
      title: "Future",
      isActive: true,
      startsAt: new Date(now + 200000),
      endsAt: new Date(now + 300000)
    });
    await createAnnouncement({
      title: "Archived",
      isActive: true,
      startsAt: new Date(now - 1000),
      endsAt: new Date(now + 100000),
      archivedAt: new Date()
    });

    const res = await request(getApp()).get(apiUrl("/announcements/active"));
    expect(res.status).toBe(200);
    expect(res.body.data.announcement).toBeNull();
  });

  it("POST /announcements creates as admin with durationHours", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const startsAt = new Date().toISOString();

    const res = await request(getApp())
      .post(apiUrl("/announcements"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Hi",
        message: "There",
        startsAt,
        durationHours: 24,
        isActive: true
      });

    expect(res.status).toBe(201);
    expect(res.body.data.announcement.title).toBe("Hi");
    const end = new Date(res.body.data.announcement.endsAt);
    const start = new Date(res.body.data.announcement.startsAt);
    expect(end.getTime() - start.getTime()).toBe(24 * 3600 * 1000);
  });

  it("POST /announcements accepts optional image upload (multipart)", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const startsAt = new Date().toISOString();
    const tinyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );

    const res = await request(getApp())
      .post(apiUrl("/announcements"))
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Photo promo")
      .field("message", "Fresh from the field")
      .field("startsAt", startsAt)
      .field("durationHours", "48")
      .field("isActive", "false")
      .attach("image", tinyPng, "promo.png");

    expect(res.status).toBe(201);
    expect(res.body.data.announcement.imageUrl).toContain("https://test.invalid/");
  });

  it("GET /announcements without auth returns 401", async () => {
    const res = await request(getApp()).get(apiUrl("/announcements"));
    expect(res.status).toBe(401);
  });

  it("PATCH /announcements/:id/archive and DELETE work", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const row = await createAnnouncement({
      title: "Archive me",
      isActive: true
    });

    const archived = await request(getApp())
      .patch(apiUrl(`/announcements/${row._id}/archive`))
      .set("Authorization", `Bearer ${token}`);

    expect(archived.status).toBe(200);
    expect(archived.body.data.announcement.archivedAt).toBeDefined();
    expect(archived.body.data.announcement.isActive).toBe(false);

    const deleted = await request(getApp())
      .delete(apiUrl(`/announcements/${row._id}`))
      .set("Authorization", `Bearer ${token}`);

    expect(deleted.status).toBe(200);
  });

  it("POST /announcements rejects CTA when product does not exist", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const startsAt = new Date().toISOString();
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(getApp())
      .post(apiUrl("/announcements"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "P",
        message: "M",
        startsAt,
        durationHours: 24,
        cta: {
          type: "product",
          text: { he: "קנו", en: "Buy", ar: "اشتري" },
          productId: fakeId
        }
      });

    expect(res.status).toBe(400);
  });

  it("POST /announcements accepts product CTA and GET /announcements/active returns it", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const category = await createCategory();
    const product = await createProduct({ category: category._id });
    const past = new Date(Date.now() - 60000);
    const future = new Date(Date.now() + 86400000);
    const startsAt = past.toISOString();

    const createRes = await request(getApp())
      .post(apiUrl("/announcements"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Tomato promo",
        message: "Fresh",
        startsAt,
        endsAt: future.toISOString(),
        isActive: true,
        cta: {
          type: "product",
          text: { he: "עגבניות", en: "Tomatoes", ar: "طماطم" },
          productId: String(product._id)
        }
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.announcement.cta).toMatchObject({
      type: "product",
      productId: String(product._id)
    });

    const res = await request(getApp()).get(apiUrl("/announcements/active"));
    expect(res.status).toBe(200);
    expect(res.body.data.announcement).toMatchObject({
      title: "Tomato promo",
      cta: {
        type: "product",
        productId: String(product._id)
      }
    });
    expect(res.body.data.announcement.cta.text).toMatchObject({
      he: "עגבניות",
      en: "Tomatoes",
      ar: "طماطم"
    });
  });
});
