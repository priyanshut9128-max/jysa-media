# JYSA Media — Full Source (Production Deploy Ready)

A modern, high-performance digital marketing agency website built with vanilla HTML/CSS/JavaScript and an Express.js / Vercel Serverless contact API with GoDaddy/Titan SMTP email delivery.

---

## 1. Project Architecture

```
jysa-media/
├── frontend/                   ← Complete Static Website
│   ├── index.html              Homepage (Hero, 3D Cube, Services Stack, Work, Contact, Let's Talk)
│   ├── css/
│   │   ├── style.css           Homepage styles & responsive design
│   │   ├── pages.css           Sub-pages styles (About, Services, Work, Careers, Contact)
│   │   └── service.css         Detailed service page styles
│   ├── js/
│   │   └── main.js             All client interactions, 3D animations & form submission
│   ├── pages/                  Dedicated top-level sub-pages
│   │   ├── about.html          About JYSA Media
│   │   ├── services.html       Services Overview (7 core services)
│   │   ├── work.html           Portfolio & Case Studies
│   │   ├── careers.html        Careers & Open Positions
│   │   ├── contact.html        Contact Page
│   │   └── services/           6 sub-pages linked from the 3D Cube
│   │       ├── website-design.html
│   │       ├── digital-strategy.html
│   │       ├── paid-advertising.html
│   │       ├── seo.html
│   │       ├── social-media.html
│   │       └── performance-marketing.html
│   ├── services/               10 rich service detail pages (linked from homepage cards)
│   │   ├── branding-creative.html
│   │   ├── content-marketing.html
│   │   ├── digital-strategy.html
│   │   ├── influencer-marketing.html
│   │   ├── paid-advertising.html
│   │   ├── performance-marketing.html
│   │   ├── seo.html
│   │   ├── social-media.html
│   │   ├── website-design.html
│   │   └── website-seo.html
│   └── assets/                 Optimized images, case studies & brand logos
│
├── backend/                    ← Node.js / Express API Server
│   ├── server.js               Express entry point, Helmet, CORS, body parser & timeouts
│   ├── routes/
│   │   └── contact.js          POST /api/contact route + IP rate limiter + content-type check
│   ├── controllers/
│   │   └── contactController.js Schema validation, bot checks, debouncing & dispatch
│   ├── services/
│   │   └── emailService.js     Nodemailer SMTP pooling (GoDaddy / Titan) & email templates
│   ├── package.json            Backend dependencies
│   └── .env.example            Environment template (SMTP credentials)
│
├── api/
│   └── index.js                Vercel Serverless Function entry point & reverse proxy
│
├── vercel.json                 Vercel routing, outputDirectory & CSP/Security headers
├── package.json                Root workspace scripts & dependencies
├── .gitignore                  Excludes node_modules, .env, and OS artifacts
└── README.md                   Developer documentation
```

---

## 2. Navigation Architecture

### Primary Navigation (Header & Footer)
- **ABOUT US** &rarr; `pages/about.html`
- **SERVICES** &rarr; `pages/services.html`
- **OUR WORK** &rarr; `pages/work.html`
- **CAREERS** &rarr; `pages/careers.html`
- **CONTACT US** &rarr; `pages/contact.html` (or `#contact` on homepage)
- **LET'S TALK** &rarr; Opens the dynamic `#talkModal` popup dialog from any page

### 3D Interactive Cube (Homepage About Section)
- **JYSA** &rarr; `pages/services/website-design.html`
- **MEDIA** &rarr; `pages/services/digital-strategy.html`
- **ADS** &rarr; `pages/services/paid-advertising.html`
- **SEO** &rarr; `pages/services/seo.html`
- **SOCIAL** &rarr; `pages/services/social-media.html`
- **GROW** &rarr; `pages/services/performance-marketing.html`

### Services 3D Stacked Card Deck (Homepage Services Section)
- Links directly to the rich service detail pages in `services/*.html`.

---

## 3. Contact Form & Button Micro-Animation

Both website contact forms (**LET'S TALK popup** and **Homepage Contact Us**) connect to `POST /api/contact`.

### Submission Lifecycle
1. **User clicks Submit**:
   - Button is immediately disabled (`btn.disabled = true; form.dataset.submitting = "true"`).
   - Duplicate clicks are rejected instantly.
   - Button bounding box height is locked (`minHeight`) to guarantee **zero layout shift**.
   - Button content smoothly transitions to `"Sending…"`.
2. **Backend Processing**:
   - Rate limit (5 requests per IP / 15 min) and Content-Type (`application/json`) verified.
   - Schema enforcement, honeypot (`_hp_check`), and bot timing (`_ts_check`) validated.
   - Input sanitization & CRLF injection defense applied.
   - Duplicate hash debouncing checked (60-second window).
   - Concurrent SMTP email dispatch via pooled Nodemailer transporter:
     - **Email 1**: Enquiry notification sent to business inbox (`hello@jysamedia.in`).
     - **Email 2**: Automatic confirmation receipt sent to the visitor.
   - Responds with HTTP 200 `{ "success": true }`.
3. **Frontend Success Feedback**:
   - Form fields reset (`form.reset()`).
   - Triggered **only** on genuine HTTP 200 success acknowledgement.
   - Smoothly transforms inner button into an animated SVG checkmark + `"Message Sent"` (~350ms ease-out curve).
   - Strictly self-contained inside the button (no separate success cards or toasts).
   - Automatically returns to normal after 4.5 seconds or as soon as the user starts typing in the form again.
4. **Error Recovery**:
   - On validation error or network drop, the button immediately restores its original label (`SEND MESSAGE →` or `SEND →`) and is re-enabled.
   - Success animation never triggers on errors.

---

## 4. Local Development & Setup

### Prerequisites
- Node.js (v18+)
- npm

### 1. Configure Environment Variables
```bash
cp backend/.env.example backend/.env
```
Fill in your SMTP credentials in `backend/.env`:
```env
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=465
SMTP_USER=hello@jysamedia.in
SMTP_PASS=your-email-password
CONTACT_RECEIVER=hello@jysamedia.in
PORT=3001
```

### 2. Start the Backend API
```bash
npm run dev
# or
cd backend && npm start
```
The API runs on `http://localhost:3001`.

### 3. Serve the Frontend
From the project root:
```bash
npx serve frontend -l 8080
# or
python3 -m http.server 8080 --directory frontend
```
Visit `http://localhost:8080` in your browser. Client-side JS automatically routes API calls to `http://localhost:3001` when running locally.

---

## 5. Security Architecture

- **SMTP Credential Protection**: All credentials stay strictly on the server, excluded via `.gitignore`.
- **Strict Schema Enforcement**: Rejects any payloads containing unexpected or malformed properties.
- **CRLF & Header Injection Defense**: Complete neutralization of `\r` and `\n` in email headers and text inputs.
- **Context-Aware HTML Escaping**: All dynamic inputs in email templates are escaped to prevent mail client HTML/XSS injection.
- **Honeypot & Timing Bot Defense**: Silent bot rejection via hidden honeypot (`_hp_check`) and minimum timing check (`_ts_check`).
- **IP Rate Limiting**: 5 submissions per IP per 15 minutes with proxy-aware IP resolution (`trust proxy: 1`).
- **CORS Protection**: Restricted to verified JYSA Media origins and production domains (`jysamedia.in`, `localhost:8080`, `localhost:8000`, `localhost:3001`).
- **Security Headers (Helmet & Vercel)**: CSP, HSTS (`max-age=63072000`), X-Frame-Options (`DENY`), nosniff, and Permissions-Policy configured.
- **Request Body Limit**: 10 KB limit to prevent resource exhaustion. Standard HTTP 413, 400, and 405 error responses.

