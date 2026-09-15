/* ==========================================================================
   JYSA MEDIA — CONTACT ROUTE (contact.js)
   
   Route: POST /api/contact
   
   Architecture Overview:
   1. Rate Limiting Middleware (5 req / 15 min per IP)
   2. Content-Type Validation Middleware (415 for non-JSON)
   3. HTTP Method Enforcement Middleware (405 for non-POST)
   4. Route Handler Dispatch (controllers/contactController.js)
   ========================================================================== */

const express = require("express");
const rateLimit = require("express-rate-limit");
const { handleSubmission } = require("../controllers/contactController");

const router = express.Router();

/* ==========================================================================
   1. RATE LIMITING MIDDLEWARE
   ========================================================================== */

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

/* ==========================================================================
   2. CONTENT-TYPE VALIDATION MIDDLEWARE
   ========================================================================== */

function requireJsonContentType(req, res, next) {
  if (!req.is("application/json")) {
    return res.status(415).json({
      success: false,
      error: "Unsupported Media Type. Request body must be Content-Type: application/json.",
    });
  }
  next();
}

/* ==========================================================================
   3. HTTP METHOD ENFORCEMENT & ROUTE DISPATCH
   ========================================================================== */

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

