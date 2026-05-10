const request = require("supertest");
const { getApp, apiUrl } = require("../helpers/test-app");
const {
  createAdminUser,
  createCategory,
  loginAndGetAccessToken,
  DEFAULT_PASSWORD
} = require("../helpers/factories");

describe("Categories", () => {
  it("GET /categories lists only active, non-frozen, non-deleted", async () => {
    await createCategory({ name: "Visible Cat", slug: "visible-cat", isFrozen: false, isDeleted: false });
    await createCategory({
      name: "Frozen Cat",
      slug: "frozen-cat",
      isFrozen: true,
      isDeleted: false
    });
    await createCategory({
      name: "Deleted Cat",
      slug: "deleted-cat",
      isDeleted: true,
      isActive: false,
      isFrozen: true
    });

    const res = await request(getApp()).get(apiUrl("/categories"));
    expect(res.status).toBe(200);
    const slugs = res.body.data.categories.map((c) => c.slug);
    expect(slugs).toContain("visible-cat");
    expect(slugs).not.toContain("frozen-cat");
    expect(slugs).not.toContain("deleted-cat");
  });

  it("POST /categories creates category as admin", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);

    const res = await request(getApp())
      .post(apiUrl("/categories"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: { ar: "منتجات طازجة", he: "תוצרת טרייה", en: "Fresh Produce" },
        description: "Veggies"
      });

    expect(res.status).toBe(201);
    expect(res.body.data.category.slug).toBe("fresh-produce");
  });

  it("POST /categories returns 409 for duplicate name/slug", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);

    const dupName = { ar: "اختبار مكرر", he: "בדיקה כפולה", en: "Dup Test" };
    const first = await request(getApp())
      .post(apiUrl("/categories"))
      .set("Authorization", `Bearer ${token}`)
      .send({ name: dupName, description: "" });
    expect(first.status).toBe(201);

    const second = await request(getApp())
      .post(apiUrl("/categories"))
      .set("Authorization", `Bearer ${token}`)
      .send({ name: dupName, description: "" });

    expect(second.status).toBe(409);
  });

  it("PATCH /categories/:id updates category", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const cat = await createCategory({ name: "Old", slug: "old-cat" });

    const res = await request(getApp())
      .patch(apiUrl(`/categories/${cat._id}`))
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: { ar: "اسم جديد", he: "שם חדש", en: "New Name" }
      });

    expect(res.status).toBe(200);
    expect(res.body.data.category.name).toMatchObject({
      ar: "اسم جديد",
      he: "שם חדש",
      en: "New Name"
    });
  });

  it("PATCH /categories/:id/freeze freezes and unfreezes", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const cat = await createCategory({ name: "Freeze Me", slug: "freeze-me" });

    const frozen = await request(getApp())
      .patch(apiUrl(`/categories/${cat._id}/freeze`))
      .set("Authorization", `Bearer ${token}`)
      .send({ isFrozen: true });
    expect(frozen.status).toBe(200);
    expect(frozen.body.data.category.isFrozen).toBe(true);

    const thaw = await request(getApp())
      .patch(apiUrl(`/categories/${cat._id}/freeze`))
      .set("Authorization", `Bearer ${token}`)
      .send({ isFrozen: false });
    expect(thaw.status).toBe(200);
    expect(thaw.body.data.category.isFrozen).toBe(false);
  });

  it("DELETE /categories/:id soft-deletes", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const cat = await createCategory({ name: "Del", slug: "del-me" });

    const res = await request(getApp())
      .delete(apiUrl(`/categories/${cat._id}`))
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.category.isDeleted).toBe(true);
  });

  it("returns 401 for admin category routes without auth", async () => {
    const cat = await createCategory();
    const res = await request(getApp()).post(apiUrl("/categories")).send({ name: "X", description: "" });
    expect(res.status).toBe(401);

    const patch = await request(getApp())
      .patch(apiUrl(`/categories/${cat._id}`))
      .send({ name: "Y" });
    expect(patch.status).toBe(401);
  });
});
