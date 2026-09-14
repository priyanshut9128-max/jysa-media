# JYSA Media — Full Source (Deploy Ready)

The homepage remains the summary landing page. Existing red + white styling and the 3D cube are preserved.

## Project Structure

```
project/
├── frontend/               ← All website files
│   ├── index.html           Landing page
│   ├── css/
│   │   ├── style.css        Landing page styles
│   │   ├── pages.css        Shared inner-page styles
│   │   └── service.css      Service page styles
│   ├── js/
│   │   └── main.js          Landing interactions + form API integration
│   ├── pages/               Dedicated top-level pages
│   ├── services/            Service detail pages (homepage card links)
│   └── assets/              Images and media
│
├── backend/                 ← Node.js API server
│   ├── server.js            Express entry point
│   ├── routes/
│   │   └── contact.js       POST /api/contact route + rate limiter
│   ├── controllers/
│   │   └── contactController.js   Validation + orchestration
│   ├── services/
│   │   └── emailService.js  Nodemailer SMTP (GoDaddy / Titan)
│   ├── package.json
│   └── .env.example         Environment variable template
│
├── .gitignore
└── README.md
```

## Main navigation

ABOUT US → `pages/about.html`
SERVICES → `pages/services.html`
OUR WORK → `pages/work.html`
CAREERS → `pages/careers.html`
CONTACT US → `pages/contact.html`

All links open in the same browser tab.

## 3D cube

The existing cube remains in the About section and every face is clickable:

JYSA → `pages/services/website-design.html`
MEDIA → `pages/services/digital-strategy.html`
ADS → `pages/services/paid-advertising.html`
SEO → `pages/services/seo.html`
SOCIAL → `pages/services/social-media.html`
GROW → `pages/services/performance-marketing.html`

## Contact Forms

Both website contact forms (LET'S TALK popup + homepage Contact Us) are connected to the backend API.

**Submission flow:**
1. User fills in the form and clicks submit
2. Frontend sends `POST /api/contact` to the backend
3. Backend validates the data
4. Backend sends an email via GoDaddy Professional Email SMTP
5. Email is delivered to the configured business inbox

**Email format:**
- Subject: `New Website Enquiry — JYSA Media`
- Reply-To: the submitted email address
- Includes: Name, Mobile, Email, Company, Message, Form Source

## Backend Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your GoDaddy Professional Email credentials:

```
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=465
SMTP_USER=hello@jysamedia.in
SMTP_PASS=your-email-password
CONTACT_RECEIVER=hello@jysamedia.in
PORT=3001
```

### 3. Start the backend

```bash
npm start
```

The API will run on `http://localhost:3001`.

### 4. Serve the frontend

From the project root:

```bash
cd frontend
python3 -m http.server 8000
```

Open `http://localhost:8000` (or `http://localhost:8080`) in your browser.

## Security & Hardening Controls

- **SMTP Credentials**: Server-side only, stored in `.env` (excluded from git via `.gitignore`).
- **Dependency Audit**: Clean bill of health with 0 vulnerabilities (`nodemailer` upgraded, `qs` override applied).
- **Strict Server-Side Validation**: Validates name (max 100 chars), mobile format (7-20 digits), email format (max 254 chars), company (max 120 chars), and message (max 3000 chars).
- **CRLF Injection Defense**: Strict rejection of `\r` and `\n` in email headers and single-line form fields.
- **Email HTML Escaping**: Context-aware HTML escaping on all dynamic data injected into email templates to prevent HTML/XSS injection in mail clients.
- **Anti-Spam Honeypot**: Hidden honeypot field (`_hp_check`) silently intercepts automated bots without consuming SMTP quota.
- **Rate Limiting**: 10 submissions per IP per 15 minutes with `trust proxy` enabled for accurate client IP resolution behind reverse proxies.
- **CORS Protection**: Whitelisted origins only (`localhost:8080`, `localhost:8000`, `localhost:3001`, `jysamedia.in`).
- **Secure HTTP Headers**: Helmet enabled on backend; production CSP, HSTS, X-Frame-Options (DENY), nosniff, and Permissions-Policy configured in `vercel.json`.
- **Request Limits & Error Handling**: 10 KB request body size limit; standard HTTP 413, 400, and 404 responses without stack trace or server information leakage.
- **Client-Side Form Validation**: Instant client feedback and pattern constraints (`maxlength`, `pattern`, `autocomplete`).

## Service Card Navigation

- Existing homepage service cards are full-card same-tab links
- Dedicated pages for all 7 homepage service categories
- Homepage service card visual styling is preserved
- Service pages reuse the existing JYSA red/white styling
- Contact email: hello@jysamedia.in

- Social Media dedicated page uses user-supplied Instagram, Facebook, and Google Ads logo assets for the orbit.
