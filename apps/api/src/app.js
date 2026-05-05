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

const corsOptions = {
  origin: [env.corsOriginStore, env.corsOriginAdmin],
  credentials: true
};

const limiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.originalUrl.includes("/payments/webhook")
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
