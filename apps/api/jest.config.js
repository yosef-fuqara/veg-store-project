/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup-after-env.js"],
  globalTeardown: "<rootDir>/tests/global-teardown.js",
  testMatch: ["**/*.test.js"],
  testTimeout: 120000,
  modulePathIgnorePatterns: ["<rootDir>/node_modules/"],
  // Mongoose / HTTP agents occasionally keep the event loop busy after globalTeardown.
  forceExit: true
};
