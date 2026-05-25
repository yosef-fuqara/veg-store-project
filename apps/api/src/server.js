const app = require("./app");
const env = require("./config/env");
const { connectDatabase } = require("./config/db");
const { logWhatsAppStartupDiagnostics } = require("./services/whatsapp.service");

const startServer = async () => {
  try {
    await connectDatabase();
    logWhatsAppStartupDiagnostics();
    app.listen(env.port, () => {
      console.log(`API server listening on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
