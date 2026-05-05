const request = require("supertest");
const { getApp, apiUrl } = require("../helpers/test-app");
const {
  registerCustomer,
  createAdminUser,
  createCustomerUser,
  DEFAULT_PASSWORD
} = require("../helpers/factories");

describe("Auth", () => {
  describe("POST /auth/register", () => {
    it("registers customer successfully", async () => {
      const email = `newuser.${Date.now()}@test.com`;
      const res = await registerCustomer({
        name: "New User",
        phone: "0501234567",
        email,
        password: DEFAULT_PASSWORD
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(email.toLowerCase());
      expect(res.body.data.user.role).toBe("customer");
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it("returns 400 when fields missing", async () => {
      const res = await registerCustomer({ email: "x@test.com" });
      expect(res.status).toBe(400);
      expect(res.body.details).toBeDefined();
    });
  });

  describe("POST /auth/login", () => {
    it("logs in customer successfully", async () => {
      const user = await createCustomerUser();
      const res = await request(getApp())
        .post(apiUrl("/auth/login"))
        .send({ email: user.email, password: DEFAULT_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(user.email);
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it("logs in admin successfully", async () => {
      const admin = await createAdminUser();
      const res = await request(getApp())
        .post(apiUrl("/auth/login"))
        .send({ email: admin.email, password: DEFAULT_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe("admin");
    });

    it("returns 401 for wrong password", async () => {
      const user = await createCustomerUser();
      const res = await request(getApp())
        .post(apiUrl("/auth/login"))
        .send({ email: user.email, password: "WrongPass999" });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it("returns 400 when login fields missing", async () => {
      const res = await request(getApp()).post(apiUrl("/auth/login")).send({ email: "a@test.com" });
      expect(res.status).toBe(400);
      expect(res.body.details).toBeDefined();
    });
  });

  describe("GET /auth/me", () => {
    it("returns 401 without token", async () => {
      const res = await request(getApp()).get(apiUrl("/auth/me"));
      expect(res.status).toBe(401);
    });

    it("returns 401 for invalid token", async () => {
      const res = await request(getApp())
        .get(apiUrl("/auth/me"))
        .set("Authorization", "Bearer not.a.valid.jwt.token");
      expect(res.status).toBe(401);
    });

    it("returns user for valid token", async () => {
      const user = await createCustomerUser();
      const login = await request(getApp())
        .post(apiUrl("/auth/login"))
        .send({ email: user.email, password: DEFAULT_PASSWORD });

      const token = login.body.data.tokens.accessToken;
      const res = await request(getApp())
        .get(apiUrl("/auth/me"))
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(user.email);
    });
  });

  describe("Admin route access", () => {
    it("returns 403 when customer hits admin ping", async () => {
      const user = await createCustomerUser();
      const login = await request(getApp())
        .post(apiUrl("/auth/login"))
        .send({ email: user.email, password: DEFAULT_PASSWORD });

      const res = await request(getApp())
        .get(apiUrl("/admin/ping"))
        .set("Authorization", `Bearer ${login.body.data.tokens.accessToken}`);

      expect(res.status).toBe(403);
    });
  });
});
