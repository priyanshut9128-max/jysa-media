/* =========================================================
   JYSA Media — Contact route
   POST /api/contact
   ========================================================= */

const express = require("express");
const rateLimit = require("express-rate-limit");
const { handleSubmission } = require("../controllers/contactController");

const router = express.Router();

/* ---------------------------------------------------------
   Rate limiter — 5 requests per IP every 15 minutes
   Extracts client IP reliably across Vercel reverse proxies
   --------------------------------------------------------- */

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator(req) {
    // Rely on Express's proxy-aware req.ip (configured via app.set('trust proxy', 1))
    // to prevent client-supplied X-Real-IP spoofing attacks
    return req.ip || req.socket?.remoteAddress || "127.0.0.1";
  },
  validate: { trustProxy: false },
  message: {
    success: false,
    error: "Too many submissions. Please try again later.",
  },
});

/* ---------------------------------------------------------
   Content-Type validation middleware
   --------------------------------------------------------- */

function requireJsonContentType(req, res, next) {
  if (!req.is("application/json")) {
    return res.status(415).json({
      success: false,
      error: "Unsupported Media Type. Request body must be Content-Type: application/json.",
    });
  }
  next();
}

/* ---------------------------------------------------------
   Method enforcement & handler
   Rejects non-POST methods with 405 Method Not Allowed
   --------------------------------------------------------- */

router.all("/", (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({
      success: false,
      error: `Method Not Allowed. Only POST is accepted, received ${req.method}.`,
    });
  }
  next();
});

router.post("/", contactLimiter, requireJsonContentType, handleSubmission);

module.exports = router;

