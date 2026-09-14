/* =========================================================
   JYSA Media — Contact controller
   Validates input, sanitizes text, and delegates to email service.
   ========================================================= */

const crypto = require("crypto");
const validator = require("validator");
const { sendEnquiryEmail, sendConfirmationEmail } = require("../services/emailService");

/* ---------------------------------------------------------
   Allowed form-source values & permitted fields
   --------------------------------------------------------- */

const VALID_SOURCES = ["LET'S TALK POPUP", "CONTACT US"];

const ALLOWED_FIELDS = new Set([
  "name",
  "phone",
  "email",
  "company",
  "message",
  "formSource",
  "_hp_check",
  "_ts_check",
]);

/* ---------------------------------------------------------
   Duplicate submission debounce cache (60s TTL)
   Prevents double clicks, automated bursts, and email bombing
   --------------------------------------------------------- */

const recentSubmissions = new Map();

function cleanExpiredSubmissions() {
  const now = Date.now();
  for (const [key, timestamp] of recentSubmissions.entries()) {
    if (now - timestamp > 60000) {
      recentSubmissions.delete(key);
    }
  }
}

/* ---------------------------------------------------------
   Helpers for safe string sanitization and CRLF prevention
   --------------------------------------------------------- */

// Check for dangerous CRLF injection characters
function hasCrlf(str) {
  return typeof str === "string" && /[\r\n]/.test(str);
}

// Sanitize a single-line field (strips newlines and control characters)
function sanitizeSingleLine(value) {
  if (typeof value !== "string") return "";
  return validator.stripLow(value.replace(/[\r\n]/g, "").trim());
}

// Sanitize multi-line field (strips control characters but preserves newlines)
function sanitizeMultiLine(value) {
  if (typeof value !== "string") return "";
  return validator.stripLow(value.trim(), true);
}

// Sanitize error messages before logging to ensure no credentials or secrets leak
function sanitizeLogMessage(msg) {
  if (typeof msg !== "string") return "Unknown error";
  return msg.replace(/([a-zA-Z0-9_\-\.\:\/]{30,})/g, "[REDACTED]");
}

/* ---------------------------------------------------------
   Handler
   --------------------------------------------------------- */

async function handleSubmission(req, res) {
  try {
    // 1. Enforce JSON object body structure
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        error: "Malformed request body. Expected a JSON object.",
      });
    }

    // 2. Strict schema enforcement — reject unexpected fields
    const bodyKeys = Object.keys(req.body);
    const unexpectedKeys = bodyKeys.filter((k) => !ALLOWED_FIELDS.has(k));
    if (unexpectedKeys.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Unexpected field in request payload: ${unexpectedKeys[0]}`,
      });
    }

    const { name, phone, email, company, message, formSource, _hp_check, _ts_check } = req.body;

    /* ---------- honeypot check (anti-spam / bot protection) ---------- */

    if (_hp_check && typeof _hp_check === "string" && _hp_check.trim() !== "") {
      // Silently discard bot submission without sending emails or alerting bot
      return res.status(200).json({
        success: true,
        message: "Your message has been sent successfully. We'll get back to you soon!",
      });
    }

    /* ---------- timing check (anti-bot protection) ---------- */

    if (_ts_check !== undefined) {
      const elapsedMs = Number(_ts_check);
      // If elapsed time is less than 1.5 seconds, submission was made impossibly fast by a bot
      if (Number.isFinite(elapsedMs) && elapsedMs > 0 && elapsedMs < 1500) {
        return res.status(200).json({
          success: true,
          message: "Your message has been sent successfully. We'll get back to you soon!",
        });
      }
    }

    /* ---------- server-side validation ---------- */

    const errors = {};

    // 1. Name: required, string, 1-100 characters, no CRLF
    if (!name || typeof name !== "string" || !validator.trim(name)) {
      errors.name = "Name is required.";
    } else if (hasCrlf(name)) {
      errors.name = "Name contains invalid characters.";
    } else if (name.trim().length > 100) {
      errors.name = "Name cannot exceed 100 characters.";
    }

    // 2. Phone / Mobile: required, string, 7-20 characters, format validation, no CRLF
    if (!phone || typeof phone !== "string" || !validator.trim(phone)) {
      errors.phone = "Mobile number is required.";
    } else if (hasCrlf(phone)) {
      errors.phone = "Mobile number contains invalid characters.";
    } else {
      const trimmedPhone = phone.trim();
      const digitsOnly = trimmedPhone.replace(/\D/g, "");
      const phoneRegex = /^[+]?[0-9\s\-()]{7,20}$/;

      if (!phoneRegex.test(trimmedPhone) || digitsOnly.length < 7 || trimmedPhone.length > 20) {
        errors.phone = "Please enter a valid mobile number (7–20 digits).";
      }
    }

    // 3. Email: required, string, RFC valid, max 254 chars, no CRLF
    if (!email || typeof email !== "string" || !validator.trim(email)) {
      errors.email = "Email is required.";
    } else if (hasCrlf(email)) {
      errors.email = "Email contains invalid characters.";
    } else if (email.trim().length > 254 || !validator.isEmail(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    // 4. Company: optional, string, max 120 chars, no CRLF
    if (company !== undefined) {
      if (typeof company !== "string") {
        errors.company = "Company must be a string.";
      } else if (hasCrlf(company)) {
        errors.company = "Company contains invalid characters.";
      } else if (company.trim().length > 120) {
        errors.company = "Company name cannot exceed 120 characters.";
      }
    }

    // 5. Message: optional, string, max 3000 chars
    if (message !== undefined) {
      if (typeof message !== "string") {
        errors.message = "Message must be a string.";
      } else if (message.length > 3000) {
        errors.message = "Message cannot exceed 3000 characters.";
      }
    }

    // 6. Form source: required + strict allowlist
    if (!formSource || typeof formSource !== "string" || !VALID_SOURCES.includes(formSource)) {
      errors.formSource = "Invalid form source.";
    }

    // 7. Honeypot type check if provided
    if (_hp_check !== undefined && typeof _hp_check !== "string") {
      errors._hp_check = "Invalid field.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    /* ---------- sanitize clean data ---------- */

    const cleanEmail = validator.normalizeEmail(email.trim()) || sanitizeSingleLine(email);

    /* ---------- duplicate submission debouncing ---------- */

    cleanExpiredSubmissions();
    const submissionHash = crypto
      .createHash("sha256")
      .update(`${cleanEmail.toLowerCase()}:${phone.trim()}`)
      .digest("hex");

    const lastSubmissionTime = recentSubmissions.get(submissionHash);
    if (lastSubmissionTime && Date.now() - lastSubmissionTime < 45000) {
      return res.status(429).json({
        success: false,
        error: "A submission from this contact was recently received. Please allow our team time to respond.",
      });
    }
    recentSubmissions.set(submissionHash, Date.now());

    const data = {
      name: sanitizeSingleLine(name),
      phone: sanitizeSingleLine(phone),
      email: cleanEmail,
      company: sanitizeSingleLine(company || ""),
      message: sanitizeMultiLine(message || ""),
      formSource,
    };

    /* ---------- send emails ---------- */

    // 1. Send enquiry notification to business inbox (hello@jysamedia.in)
    await sendEnquiryEmail(data);

    // 2. Send automatic confirmation email to visitor's email
    try {
      await sendConfirmationEmail(data);
    } catch (confirmError) {
      console.error(
        "[Contact Controller] Failed to send customer confirmation email:",
        sanitizeLogMessage(confirmError.message)
      );
      // Logged on server without exposing SMTP credentials or server details to visitor
    }

    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully. We'll get back to you soon!",
    });
  } catch (error) {
    console.error(
      "[Contact Controller] Failed to process submission:",
      sanitizeLogMessage(error.message)
    );

    return res.status(500).json({
      success: false,
      error: "Something went wrong. Please try again later.",
    });
  }
}

module.exports = { handleSubmission };

