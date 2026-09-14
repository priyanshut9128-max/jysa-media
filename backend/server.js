/* =========================================================
   JYSA Media — Backend API Server
   Express entry point: loads env, mounts middleware & routes.
   ========================================================= */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const contactRouter = require("./routes/contact");

const app = express();
const PORT = process.env.PORT || 3001;

// Trust reverse proxy for accurate IP resolution in rate limiting
app.set("trust proxy", 1);

// Prevent framework fingerprinting
app.disable("x-powered-by");

/* ---------------------------------------------------------
   Middleware
   --------------------------------------------------------- */

// Secure HTTP headers
app.use(helmet());

// CORS — allow requests only from verified frontend origins
const allowedOrigins = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://jysamedia.in",
  "https://www.jysamedia.in",
];

// In production, add any configured custom origins
if (process.env.FRONTEND_ORIGIN) {
  const customOrigins = process.env.FRONTEND_ORIGIN.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  allowedOrigins.push(...customOrigins);
}

app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server or tools with no origin (curl/Postman), allowed origins, and Vercel deployments
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    optionsSuccessStatus: 204,
  })
);

// JSON body parser — 10 KB limit to prevent abuse
app.use(express.json({ limit: "10kb" }));

/* ---------------------------------------------------------
   Routes
   --------------------------------------------------------- */

app.use("/api/contact", contactRouter);
app.use("/contact", contactRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Fallback for unmatched API routes
app.use("/api", (_req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found" });
});

/* ---------------------------------------------------------
   Global error handler
   --------------------------------------------------------- */

app.use((err, _req, res, _next) => {
  // CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ success: false, error: "Forbidden: Origin not allowed" });
  }

  // Request entity too large (HTTP 413)
  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({
      success: false,
      error: "Payload too large. Maximum allowed size is 10KB.",
    });
  }

  // Malformed JSON (HTTP 400)
  if (
    err.type === "entity.parse.failed" ||
    (err instanceof SyntaxError && err.status === 400 && "body" in err)
  ) {
    return res.status(400).json({
      success: false,
      error: "Malformed JSON payload in request.",
    });
  }

  // Server error without sensitive details or stack trace leakage
  console.error("[Server Error]", err.message || "Unknown error");
  res.status(500).json({ success: false, error: "Internal server error" });
});

/* ---------------------------------------------------------
   Start with connection timeouts (when run directly)
   --------------------------------------------------------- */

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`✓ JYSA Media API running on http://localhost:${PORT}`);
  });

  // Mitigate Slowloris / slow HTTP attacks
  server.timeout = 15000;
  server.keepAliveTimeout = 10000;
}

module.exports = app;
