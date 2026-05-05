const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;
let ownsMemoryServer = false;

/**
 * Returns a Mongo connection string for tests.
 *
 * - Set TEST_MONGO_URI (e.g. mongodb://127.0.0.1:27017/veg_api_test) to use a local
 *   mongod and avoid MongoMemoryServer's first-time binary download (~600MB), which
 *   can make Jest look "stuck" on RUNS for many minutes.
 */
async function getMongoUri() {
  const external = process.env.TEST_MONGO_URI;
  if (external) {
    return external;
  }

  if (!mongoServer) {
    // eslint-disable-next-line no-console
    console.error(
      "\n[jest] Starting MongoMemoryServer — first run may download MongoDB (large + slow). " +
        "Set TEST_MONGO_URI to skip (see tests/mongo-singleton.js).\n"
    );
    mongoServer = await MongoMemoryServer.create();
    ownsMemoryServer = true;
  }
  return mongoServer.getUri();
}

async function stopMongo() {
  if (mongoServer && ownsMemoryServer) {
    await mongoServer.stop();
    mongoServer = undefined;
    ownsMemoryServer = false;
  }
}

module.exports = { getMongoUri, stopMongo };
