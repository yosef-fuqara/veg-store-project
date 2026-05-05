function getApp() {
  if (!global.__TEST_APP__) {
    throw new Error("Test app not initialized (setup-after-env beforeAll did not run)");
  }
  return global.__TEST_APP__;
}

function getEnv() {
  // Lazy: do not load config/env until after setup-after-env sets process.env
  return require("../../src/config/env");
}

/** @param {string} path - e.g. "/auth/login" */
function apiUrl(path) {
  const env = getEnv();
  const base = env.apiBasePath.endsWith("/") ? env.apiBasePath.slice(0, -1) : env.apiBasePath;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

module.exports = { getApp, apiUrl, getEnv };
