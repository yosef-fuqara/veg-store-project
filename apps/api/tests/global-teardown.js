const mongoose = require("mongoose");
const { stopMongo } = require("./mongo-singleton");

module.exports = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await stopMongo();
  delete global.__TEST_APP__;
};
