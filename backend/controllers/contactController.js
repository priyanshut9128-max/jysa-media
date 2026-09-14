/* =========================================================
   JYSA Media — Contact controller
   Validates input, sanitizes text, and delegates to email service.
   ========================================================= */

const validator = require("validator");
const { sendEnquiryEmail, sendConfirmationEmail } = require("../services/emailService");

/* ---------------------------------------------------------
   Allowed form-source values
   --------------------------------------------------------- */

const VALID_SOURCES = ["LET'S TALK POPUP", "CONTACT US"];

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

/* ---------------------------------------------------------
   Handler
   --------------------------------------------------------- */

async function handleSubmission(req, res) {
  try {
    const { name, phone, email, company, message, formSource, _hp_check } = req.body || {};

    /* ---------- honeypot check (anti-spam / bot protection) ---------- */

    if (_hp_check && typeof _hp_check === "string" && _hp_check.trim() !== "") {
      // Silently discard bot submission without sending emails or notifying bot
      return res.status(200).json({
        success: true,
        message: "Your message has been sent successfully. We'll get back to you soon!",
      });
    }

    /* ---------- server-side validation ---------- */

    const errors = {};

    // 1. Name: required, 1-100 characters, no CRLF
    if (!name || typeof name !== "string" || !validator.trim(name)) {
      errors.name = "Name is required.";
    } else if (hasCrlf(name)) {
      errors.name = "Name contains invalid characters.";
    } else if (name.trim().length > 100) {
      errors.name = "Name cannot exceed 100 characters.";
    }

    // 2. Phone / Mobile: required, 7-20 characters, format validation, no CRLF
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

    // 3. Email: required, RFC valid, max 254 chars, no CRLF
    if (!email || typeof email !== "string" || !validator.trim(email)) {
      errors.email = "Email is required.";
    } else if (hasCrlf(email)) {
      errors.email = "Email contains invalid characters.";
    } else if (email.trim().length > 254 || !validator.isEmail(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    // 4. Company: optional, max 120 chars, no CRLF
    if (company && typeof company === "string") {
      if (hasCrlf(company)) {
        errors.company = "Company contains invalid characters.";
      } else if (company.trim().length > 120) {
        errors.company = "Company name cannot exceed 120 characters.";
      }
    }

    // 5. Message: optional, max 3000 chars
    if (message && typeof message === "string" && message.length > 3000) {
      errors.message = "Message cannot exceed 3000 characters.";
    }

    // 6. Form source: required + strict allowlist
    if (!formSource || !VALID_SOURCES.includes(formSource)) {
      errors.formSource = "Invalid form source.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    /* ---------- sanitize sanitized data ---------- */

    const cleanEmail = validator.normalizeEmail(email.trim()) || sanitizeSingleLine(email);

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
        confirmError.message
      );
      // Logged on server without exposing SMTP credentials or server details to visitor
    }

    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully. We'll get back to you soon!",
    });
  } catch (error) {
    console.error("[Contact Controller] Failed to process submission:", error.message);

    return res.status(500).json({
      success: false,
      error: "Something went wrong. Please try again later.",
    });
  }
}

module.exports = { handleSubmission };
