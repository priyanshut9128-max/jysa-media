/* =========================================================
   JYSA Media — Vercel Serverless Function & Reverse Proxy
   Handles /api/* requests on Vercel deployments.
   ========================================================= */

const path = require("path");

// Load backend/.env if present (useful in local testing)
try {
  require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });
} catch (e) {}

const app = require("../backend/server");

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

module.exports = async (req, res) => {
  // If an external backend URL is specified (e.g. Render/Railway), reverse-proxy to it
  if (process.env.BACKEND_URL) {
    try {
      const backendBase = process.env.BACKEND_URL.replace(/\/+$/, "");
      const targetUrl = `${backendBase}${req.url.startsWith("/") ? req.url : "/" + req.url}`;

      const headers = { ...req.headers };
      delete headers.host;

      let body = undefined;
      if (req.method !== "GET" && req.method !== "HEAD") {
        body = await getRequestBody(req);
        if (body && !headers["content-type"]) {
          headers["content-type"] = "application/json";
        }
      }

      const response = await fetch(targetUrl, {
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
      console.error("[Vercel Reverse Proxy Error]", proxyError.message);
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
