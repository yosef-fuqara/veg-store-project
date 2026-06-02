const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const apiRoutes = require("./routes");
const notFoundMiddleware = require("./middlewares/not-found.middleware");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

const normalizeOrigin = (value) => String(value || "").replace(/\/+$/, "");
const allowedOrigins = new Set(env.corsAllowedOrigins.map(normalizeOrigin));

const corsOptions = {
  origin(origin, callback) {
    // Allow requests without an Origin header (e.g. server-to-server, curl, health checks).
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOrigins.has(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    if (env.nodeEnv !== "production") {
      try {
        const { hostname } = new URL(normalizedOrigin);
        if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
          callback(null, true);
          return;
        }
      } catch (_error) {
        // Invalid Origin header; reject below.
      }
    }

    callback(new Error(`CORS origin denied: ${origin}`));
  },
  credentials: true
};

const limiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (req.originalUrl.includes("/payments/webhook")) return true;
    // Local dev (HMR, StrictMode, multiple tabs) can exceed 200/15min quickly.
    if (env.nodeEnv !== "production") return true;
    return false;
  },
});

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(limiter);

app.use(env.apiBasePath, apiRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
