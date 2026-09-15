/* =========================================================
   JYSA Media — Email service
   Sends contact-form emails via GoDaddy Professional Email SMTP.
   ========================================================= */

const nodemailer = require("nodemailer");

/* ---------------------------------------------------------
   SMTP transporter (lazy — created on first use so env vars
   are guaranteed to be loaded by dotenv)
   --------------------------------------------------------- */

let _transporter = null;

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true, // SSL/TLS on port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: true,
      },
    });
  }
  return _transporter;
}

/* ---------------------------------------------------------
   Security helpers: HTML escaping & CRLF header sanitation
   --------------------------------------------------------- */

function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanHeader(val) {
  if (typeof val !== "string") return "";
  return val.replace(/[\r\n]/g, "").trim();
}

/* ---------------------------------------------------------
   Helpers to determine Enquiry Type and Form Source
   --------------------------------------------------------- */

function determineEnquiryType(formSource, message) {
  const msg = (message || "").toLowerCase();
  if (msg.includes("career") || msg.includes("job") || msg.includes("intern") || msg.includes("hiring")) {
    return "Careers & Hiring";
  }
  if (msg.includes("seo") || msg.includes("marketing") || msg.includes("campaign") || msg.includes("ads") || msg.includes("growth")) {
    return "Digital Marketing & Growth";
  }
  if (msg.includes("brand") || msg.includes("design") || msg.includes("creative") || msg.includes("logo")) {
    return "Branding & Creative Design";
  }
  if (msg.includes("web") || msg.includes("site") || msg.includes("dev") || msg.includes("app")) {
    return "Web & App Development";
  }
  if (formSource === "LET'S TALK POPUP") {
    return "Brand Consultation / Strategy Discussion";
  }
  return "General Website Enquiry";
}

function determineSource(formSource) {
  if (formSource === "LET'S TALK POPUP") {
    return "LET'S TALK POPUP";
  }
  return "CONTACT US FORM";
}

/* ---------------------------------------------------------
   EMAIL 1: Send enquiry notification to JYSA Media
   --------------------------------------------------------- */

async function sendEnquiryEmail({ name, phone, email, company, message, formSource }) {
  const enquiryType = determineEnquiryType(formSource, message);
  const source = determineSource(formSource);
  const subject = "New Website Enquiry — JYSA Media";
  const cleanEmail = cleanHeader(email);

  /* ---- plain text body ---- */
  const text = [
    "NEW WEBSITE ENQUIRY",
    "",
    `Name:         ${name}`,
    `Mobile:       ${phone}`,
    `Email:        ${email}`,
    `Company:      ${company || "—"}`,
    `Enquiry Type: ${enquiryType}`,
    `Source:       ${source}`,
    "",
    "Message:",
    message || "—",
  ].join("\n");

  /* ---- HTML body ---- */
  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#e31324;padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
              NEW WEBSITE ENQUIRY
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;color:#222222;line-height:1.7;">
              <tr>
                <td style="padding:6px 0;font-weight:600;width:120px;vertical-align:top;">Name:</td>
                <td style="padding:6px 0;">${escapeHtml(name)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-weight:600;vertical-align:top;">Mobile:</td>
                <td style="padding:6px 0;">${escapeHtml(phone)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-weight:600;vertical-align:top;">Email:</td>
                <td style="padding:6px 0;">
                  <a href="mailto:${escapeHtml(cleanEmail)}" style="color:#e31324;text-decoration:none;">${escapeHtml(cleanEmail)}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-weight:600;vertical-align:top;">Company:</td>
                <td style="padding:6px 0;">${escapeHtml(company || "—")}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-weight:600;vertical-align:top;">Enquiry Type:</td>
                <td style="padding:6px 0;color:#e31324;font-weight:600;">${escapeHtml(enquiryType)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-weight:600;vertical-align:top;">Source:</td>
                <td style="padding:6px 0;"><strong>${escapeHtml(source)}</strong></td>
              </tr>
            </table>

            <hr style="border:none;border-top:1px solid #eeeeee;margin:20px 0;">

            <p style="margin:0 0 6px;font-weight:600;font-size:15px;color:#222222;">Message:</p>
            <p style="margin:0;font-size:15px;color:#444444;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message || "—")}</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#fafafa;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaaaaa;">
              This email was sent from the JYSA Media website contact form.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const mailOptions = {
    from: `"JYSA Media Website" <${process.env.SMTP_USER}>`,
    to: cleanHeader(process.env.CONTACT_RECEIVER || "hello@jysamedia.in"),
    replyTo: cleanEmail, // visitor's email for direct reply, validated & CRLF stripped
    subject,
    text,
    html,
  };

  const info = await getTransporter().sendMail(mailOptions);
  console.log("[Email Service] Enquiry email sent to JYSA:", info.messageId);
  return info;
}

/* ---------------------------------------------------------
   EMAIL 2: Send automatic confirmation email to visitor
   --------------------------------------------------------- */

async function sendConfirmationEmail({ name, email, formSource, message }) {
  const enquiryType = determineEnquiryType(formSource, message);
  const source = determineSource(formSource);
  const subject = "We Received Your Message — JYSA Media";

  /* ---- plain text body ---- */
  const text = [
    `Hi ${name},`,
    "",
    "Thank you for contacting JYSA Media.",
    "",
    "We have successfully received your enquiry and our team will review it shortly. We will get in touch with you as soon as possible.",
    "",
    "Enquiry Type:",
    enquiryType,
    "",
    "Source:",
    source,
    "",
    "Thank you,",
    "JYSA Media",
    "hello@jysamedia.in",
    "jysamedia.in",
  ].join("\n");

  /* ---- HTML body ---- */
  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#e31324;padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:24px;font-weight:900;letter-spacing:1px;color:#ffffff;">JYSA</span>
                  <span style="font-size:12px;letter-spacing:3px;color:#ffffff;display:block;opacity:0.9;">MEDIA</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:36px 32px 28px;">
            <p style="margin:0 0 18px;font-size:16px;color:#111111;font-weight:600;">
              Hi ${escapeHtml(name)},
            </p>

            <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.7;">
              Thank you for contacting JYSA Media.
            </p>

            <p style="margin:0 0 24px;font-size:15px;color:#444444;line-height:1.7;">
              We have successfully received your enquiry and our team will review it shortly. We will get in touch with you as soon as possible.
            </p>

            <!-- Details Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fcfcfc;border:1px solid #eeeeee;border-radius:6px;margin:0 0 24px;">
              <tr>
                <td style="padding:18px 22px;">
                  <p style="margin:0 0 10px;font-size:14px;color:#666666;">
                    <strong style="color:#222222;display:block;margin-bottom:2px;">Enquiry Type:</strong>
                    ${escapeHtml(enquiryType)}
                  </p>
                  <p style="margin:0;font-size:14px;color:#666666;">
                    <strong style="color:#222222;display:block;margin-bottom:2px;">Source:</strong>
                    ${escapeHtml(source)}
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 4px;font-size:15px;color:#333333;">
              Thank you,
            </p>
            <p style="margin:0;font-size:15px;font-weight:700;color:#111111;">
              JYSA Media
            </p>
            <p style="margin:4px 0 0;font-size:14px;">
              <a href="mailto:hello@jysamedia.in" style="color:#e31324;text-decoration:none;">hello@jysamedia.in</a>
              &nbsp;•&nbsp;
              <a href="https://jysamedia.in" style="color:#666666;text-decoration:none;">jysamedia.in</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#fafafa;padding:16px 32px;text-align:center;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:12px;color:#aaaaaa;">
              © 2026 JYSA Media House Pvt. Ltd. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const cleanEmail = cleanHeader(email);

  const mailOptions = {
    from: `"JYSA Media" <${process.env.SMTP_USER}>`,
    to: cleanEmail, // visitor's email, validated & CRLF stripped
    replyTo: cleanHeader(process.env.CONTACT_RECEIVER || "hello@jysamedia.in"),
    subject,
    text,
    html,
  };

  const info = await getTransporter().sendMail(mailOptions);
  console.log("[Email Service] Confirmation email sent to visitor:", info.messageId);
  return info;
}

module.exports = {
  sendContactEmail: sendEnquiryEmail,
  sendEnquiryEmail,
  sendConfirmationEmail,
  determineEnquiryType,
  determineSource,
};
