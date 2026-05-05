process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test_jwt_access_secret_min_32_chars_x";
process.env.JWT_REFRESH_SECRET = "test_jwt_refresh_secret_min_32_chars_y";
process.env.PAYMENT_WEBHOOK_SECRET = "test_webhook_secret_value";
process.env.PAYMENT_PROVIDER = "placeholder";

jest.mock("../src/services/image-upload.service", () => ({
  uploadBufferToCloudinary: jest.fn().mockResolvedValue({
    secure_url: "https://test.invalid/img.jpg",
    public_id: "test_public_id"
  }),
  destroyCloudinaryImage: jest.fn().mockResolvedValue(undefined)
}));

// Per-test timeout (each it()). Do not pass --testTimeout=10000 on CLI — it overrides this
// and will fail while MongoMemoryServer is still downloading.
jest.setTimeout(120000);

const mongoose = require("mongoose");
const { getMongoUri } = require("./mongo-singleton");

// Long timeout: first MongoMemoryServer.create() may download the server binary.
beforeAll(
  async () => {
    const uri = await getMongoUri();
    process.env.MONGO_URI = uri;

    const { connectDatabase } = require("../src/config/db");

    if (mongoose.connection.readyState === 0) {
      await connectDatabase();
    }

    if (!global.__TEST_APP__) {
      global.__TEST_APP__ = require("../src/app");
    }
  },
  600000
);

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.keys(collections).map((key) => collections[key].deleteMany({}))
  );
});
