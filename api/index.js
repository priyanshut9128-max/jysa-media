/* ==========================================================================
   JYSA MEDIA — VERCEL SERVERLESS FUNCTION & REVERSE PROXY (api/index.js)
   
   Architecture Overview:
   - In standard Vercel deployments: Directly executes the Express app.
   - If BACKEND_URL is set: Functions as a secure reverse proxy to an
     external backend service (e.g. Render, Railway) with SSRF safeguards.
   ========================================================================== */

const path = require("path");

// Load backend/.env if present (useful in local serverless emulation)
try {
  require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });
} catch (e) {}

const app = require("../backend/server");

/* ==========================================================================
   SERVERLESS REQUEST & RESPONSE HELPERS
   ========================================================================== */

function getRequestBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
      return Promise.resolve(req.body);
    }
    return Promise.resolve(JSON.stringify(req.body));
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendResponse(res, statusCode, headers, body) {
  if (typeof res.status === "function") {
    res.status(statusCode);
  } else {
    res.statusCode = statusCode;
  }

  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      const lower = key.toLowerCase();
      if (lower !== "content-encoding" && lower !== "transfer-encoding" && lower !== "content-length") {
        res.setHeader(key, value);
      }
    }
  }

  if (typeof res.send === "function") {
    return res.send(body);
  }
  return res.end(body);
}

/* ==========================================================================
   VERCEL ENTRYPOINT (Reverse Proxy or Native Express Execution)
   ========================================================================== */

module.exports = async (req, res) => {
  // If an external backend URL is specified (e.g. Render/Railway), reverse-proxy to it
  if (process.env.BACKEND_URL) {
    try {
      const baseParsed = new URL(process.env.BACKEND_URL);
      if (baseParsed.protocol !== "http:" && baseParsed.protocol !== "https:") {
        throw new Error("Invalid protocol for BACKEND_URL");
      }

      // Safe URL resolution preventing SSRF and path manipulation
      const cleanPath = req.url.startsWith("/") ? req.url : "/" + req.url;
      const backendBasePath = baseParsed.pathname.replace(/\/+$/, "");
      const targetUrl = new URL(backendBasePath + cleanPath, baseParsed.origin);

      if (targetUrl.origin !== baseParsed.origin) {
        throw new Error("Destination origin mismatch");
      }

      const headers = { ...req.headers };
      delete headers.host;

      let body = undefined;
      if (req.method !== "GET" && req.method !== "HEAD") {
        body = await getRequestBody(req);
        if (body && !headers["content-type"]) {
          headers["content-type"] = "application/json";
        }
      }

      const response = await fetch(targetUrl.toString(), {
        method: req.method,
        headers,
        body: body && body.length > 0 ? body : undefined,
      });

      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const data = await response.text();
      return sendResponse(res, response.status, responseHeaders, data);
    } catch (proxyError) {
      const safeError = typeof proxyError.message === "string"
        ? proxyError.message.replace(/([a-zA-Z0-9_\-\.\:\/]{30,})/g, "[REDACTED]")
        : "Proxy error";
      console.error("[Vercel Reverse Proxy Error]", safeError);
      return sendResponse(
        res,
        502,
        { "content-type": "application/json" },
        JSON.stringify({
          success: false,
          error: "Bad Gateway: Failed to reach backend service.",
        })
      );
    }
  }

  // Default: Execute the existing Express app directly on Vercel
  return app(req, res);
};
