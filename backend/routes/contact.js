/* =========================================================
   JYSA Media — Contact route
   POST /api/contact
   ========================================================= */

const express = require("express");
const rateLimit = require("express-rate-limit");
const { handleSubmission } = require("../controllers/contactController");

const router = express.Router();

/* ---------------------------------------------------------
   Rate limiter — 10 requests per IP every 15 minutes
   --------------------------------------------------------- */

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many submissions. Please try again later.",
  },
});

router.post("/", contactLimiter, handleSubmission);

module.exports = router;
