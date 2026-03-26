# HarmonyShield — Limitations & Setup Guide

This document is an honest, detailed breakdown of what HarmonyShield currently includes as demo/seed data, what is fully functional, and what you need to build or configure yourself to make it production-ready.

---

## Table of Contents

- [Current Status Summary](#current-status-summary)
- [What Works Out of the Box](#what-works-out-of-the-box)
- [What Uses Demo/Seed Data](#what-uses-demoseed-data)
- [What You Need to Build](#what-you-need-to-build)
- [Step-by-Step Setup Instructions](#step-by-step-setup-instructions)
- [Production Deployment Checklist](#production-deployment-checklist)

---

## Current Status Summary

| Feature | Status | Notes |
|---|---|---|
| Dashboard with metrics | ✅ Working | Reads from database, calculates real metrics |
| Compliance management | ✅ Working | Full CRUD — add, edit, update status |
| Incident response | ✅ Working | Create incidents, add actions, update status |
| Training courses & quizzes | ✅ Working | Take courses, answer quizzes, track progress |
| Settings page | ✅ Working | Update school profile and preferences |
| Threat intelligence feeds | ⚠️ Demo Data | 12 hardcoded threats — no live API calls |
| News feed | ⚠️ Demo Data | 5 hardcoded articles — no live API calls |
| IP reputation checker | ⚠️ Demo Data | Returns mock/deterministic results |
| Authentication & login | ❌ Not Built | No login page, no JWT, no sessions |
| Multi-school support | ❌ Not Built | Hardcoded to school ID 1 |
| Report exports (PDF/Excel/PPTX) | ❌ Not Built | Buttons exist, show "requires configuration" toast |
| Email notifications | ❌ Not Built | No SMTP integration |
| Certificate generation | ❌ Not Built | Training certificates not implemented |
| File/evidence upload | ❌ Not Built | Upload fields in compliance not functional |
| Real-time updates | ❌ Not Built | No WebSocket/SSE — all data is on-demand fetch |
| Payment/subscription system | ❌ Not Built | Tiered pricing referenced but no payment integration |

---

## What Works Out of the Box

These features are fully functional with the SQLite database:

### Dashboard
- Compliance score calculated from actual compliance items in the database
- Active threat count, incident count, and training completion are live database queries
- Trend charts display data from the database
- Quick-action cards link to relevant sections

### Compliance Management
- View all 15 pre-seeded NDPR compliance items across 6 categories
- Filter by category, status, and priority
- Update compliance status (Compliant / Partially Compliant / Non-Compliant)
- Add new compliance items with full details
- Track due dates and progress percentages

### Incident Response
- View 3 pre-seeded incidents with full details
- Create new incidents with severity, type, and description
- Add response actions with timestamps
- Update incident status through the workflow (Open → Investigating → Contained → Resolved → Closed)
- View incident timeline

### Training Platform
- 6 pre-seeded courses with full lesson content and quiz questions
- Take courses, read content, answer multiple-choice quizzes
- Track completion progress per user
- View scores and completion status

### Settings
- View and update school profile information
- Toggle notification preferences
- View integration settings placeholders

### Audit Log
- All actions (compliance updates, incident creation, etc.) are automatically logged
- Timestamped audit trail stored in the database

---

## What Uses Demo/Seed Data

### Threat Intelligence (12 Hardcoded Threats)

**Location:** `server/routes.ts` lines ~100-113

The threats displayed on the Threat Monitor page are **hardcoded in the backend route handler**. They have source labels like "alienvault", "abuseipdb", and "news", but **no actual API calls are made** to these services. The data is static and never updates.

**What you see:**
- 12 threat entries with realistic titles, severities, and types
- Source badges showing "AlienVault OTX", "AbuseIPDB", "News"

**What's actually happening:**
- A static array is returned from the `/api/threats` endpoint
- No external HTTP requests are made
- Data never changes unless you modify the source code

### News Feed (5 Hardcoded Articles)

**Location:** `server/routes.ts` lines ~150-165

The cybersecurity news section shows **5 pre-written articles**. These are not fetched from any news API.

**What you see:**
- 5 news articles about Nigerian cybersecurity topics
- Realistic dates and sources

**What's actually happening:**
- A static array returned from the `/api/news` endpoint
- No connection to NewsAPI or any RSS feed

### IP Reputation Checker (Mock Results)

**Location:** `client/src/pages/threat-monitor.tsx` line ~323

The IP checker tool on the Threat Monitor page returns **deterministic/mock results** based on simple logic — it does not query AbuseIPDB or any real IP reputation database.

**What you see:**
- An input field to enter an IP address
- Results showing risk score, country, and threat classification

**What's actually happening:**
- Frontend generates results locally without making any API call
- Risk scores are computed from the IP string, not real threat data

---

## What You Need to Build

### 1. Authentication System (Critical — Priority 1)

**Why it's needed:** Currently, anyone who can access the URL can see all data. There is no login page, no user sessions, and no role-based access control.

**What to implement:**
- Login page with email/password
- Registration flow (or admin-created accounts)
- JWT token generation and validation (or session-based auth)
- Middleware to protect all API routes
- Role-based access: Admin, IT Manager, Teacher, Staff
- Password hashing with bcrypt (currently passwords are plain text "demo123")
- Session management and token refresh

**Suggested approach:**
```
npm install bcrypt jsonwebtoken express-session
```
- Add a `/api/auth/login` and `/api/auth/register` route
- Create auth middleware that validates JWT on every protected route
- Hash passwords in the user creation/seed flow
- Add a login page component and protect routes in the React app

### 2. Live Threat Intelligence Feeds (Priority 2)

**Why:** The core value proposition of the Threat Monitor depends on real data.

**What to implement:**

**AlienVault OTX:**
- Sign up at https://otx.alienvault.com/ (free account)
- Get your API key from the dashboard
- Replace the hardcoded threats array in `server/routes.ts` with:
  ```typescript
  // Example: Fetch pulses from AlienVault OTX
  const response = await fetch('https://otx.alienvault.com/api/v1/pulses/subscribed', {
    headers: { 'X-OTX-API-KEY': process.env.ALIENVAULT_OTX_API_KEY }
  });
  const data = await response.json();
  // Transform and return the results
  ```

**AbuseIPDB:**
- Sign up at https://www.abuseipdb.com/ (free tier: 1,000 checks/day)
- Get your API key
- Replace the mock IP checker with:
  ```typescript
  // Example: Check IP reputation
  const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`, {
    headers: {
      'Key': process.env.ABUSEIPDB_API_KEY,
      'Accept': 'application/json'
    }
  });
  ```

**NewsAPI (or alternative):**
- Sign up at https://newsapi.org/ (free tier: 100 requests/day)
- Or use a free RSS feed parser for cybersecurity news
- Replace the hardcoded news array with live API calls

### 3. Multi-Tenancy / Multi-School Support (Priority 2)

**Why:** Currently, school ID `1` is hardcoded in 6 frontend files.

**Hardcoded locations to fix:**
| File | Line(s) | What's Hardcoded |
|---|---|---|
| `dashboard.tsx` | ~179 | School name "Federal Government College, Enugu" |
| `dashboard.tsx` | Multiple | `schoolId: 1` in API calls |
| `compliance.tsx` | Multiple | `schoolId: 1` in API calls |
| `incident-response.tsx` | Multiple | `schoolId: 1` in API calls |
| `settings.tsx` | Multiple | `schoolId: 1` in API calls |
| `reports.tsx` | Multiple | `schoolId: 1` in API calls |
| `training.tsx` | ~467, 493, 736 | `userId: 1` in API calls |

**What to implement:**
- After building authentication, derive school ID and user ID from the logged-in user's session/token
- Replace all hardcoded `schoolId: 1` with the authenticated user's school
- Replace all hardcoded `userId: 1` with the authenticated user's ID
- Add school selection for super-admin users who manage multiple institutions

### 4. Report Exports — PDF, Excel, PowerPoint (Priority 3)

**Why:** The Reports page has export buttons that currently show a toast saying "requires backend configuration."

**What to implement:**
```
npm install pdfkit exceljs pptxgenjs
```

- **PDF reports:** Use `pdfkit` to generate compliance reports, incident summaries, and executive overviews
- **Excel exports:** Use `exceljs` to create spreadsheets with compliance data, threat logs, and training metrics
- **PowerPoint:** Use `pptxgenjs` to generate presentation-ready board reports

Create API routes like:
- `GET /api/reports/compliance/pdf`
- `GET /api/reports/threats/excel`
- `GET /api/reports/executive/pptx`

### 5. Email Notification Service (Priority 3)

**What to implement:**
```
npm install nodemailer
```

- Configure SMTP settings via environment variables
- Send alerts when new high-severity threats are detected
- Send compliance deadline reminders
- Send incident status change notifications
- Send training completion confirmations

### 6. Training Certificate Generation (Priority 4)

**What to implement:**
- Use `pdfkit` or an HTML-to-PDF library to generate certificates
- Include: student name, course title, completion date, score, institution name
- Add a download button on the training completion page

### 7. File/Evidence Upload (Priority 4)

**What to implement:**
```
npm install multer
```

- Configure `multer` for file upload handling
- Create an `uploads/` directory for stored files
- Add upload endpoints for compliance evidence documents
- Connect the existing upload UI in the compliance page to the backend
- Add file size limits and type validation

### 8. Real-Time Updates (Priority 5)

**What to implement:**
- WebSocket (via `ws` package) or Server-Sent Events for live updates
- Push new threat alerts to connected dashboards
- Live incident status updates across users
- Real-time compliance score changes

### 9. Database Migration to PostgreSQL (Priority 5 — Production)

**Why:** SQLite is excellent for development and small deployments, but PostgreSQL is recommended for production with multiple concurrent users.

**What to implement:**
- Update `drizzle.config.ts` to use PostgreSQL
- Install `pg` and `drizzle-orm/pg-core`
- Update schema imports from `sqliteTable` to `pgTable`
- Run migrations
- Update storage methods for async PostgreSQL driver

---

## Step-by-Step Setup Instructions

### Step 1: Clone and Install

```bash
git clone https://github.com/Chukwuemerie-ezieke/harmonyshield.git
cd harmonyshield
npm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your API keys and configuration (see `.env.example` for all options).

### Step 3: Run in Development

```bash
npm run dev
```

Visit `http://localhost:5000`. The app runs with seed data immediately.

### Step 4: Implement Authentication (First Priority)

1. Install auth packages: `npm install bcrypt jsonwebtoken`
2. Create `server/auth.ts` with login/register routes
3. Add JWT middleware to `server/routes.ts`
4. Create a `client/src/pages/login.tsx` component
5. Add route protection in `App.tsx`
6. Replace hardcoded user/school IDs with session values

### Step 5: Connect Live Threat Feeds

1. Sign up for free API keys (AlienVault OTX, AbuseIPDB, NewsAPI)
2. Add keys to `.env`
3. Replace hardcoded arrays in `server/routes.ts` with API fetch calls
4. Add error handling and caching (cache threats for 15 minutes to avoid rate limits)
5. Implement a background job to refresh threats periodically

### Step 6: Build Report Exports

1. Install: `npm install pdfkit exceljs`
2. Create report templates in `server/reports/`
3. Add download routes in `server/routes.ts`
4. Connect the frontend export buttons to the new endpoints

---

## Production Deployment Checklist

- [ ] Implement authentication with bcrypt password hashing
- [ ] Replace all hardcoded school/user IDs with session-derived values
- [ ] Connect at least one live threat feed (AlienVault OTX is free)
- [ ] Set up HTTPS (use a reverse proxy like Nginx with Let's Encrypt)
- [ ] Configure environment variables securely (never commit `.env`)
- [ ] Set up database backups (SQLite: copy the `.db` file; PostgreSQL: `pg_dump`)
- [ ] Add rate limiting to API routes (`express-rate-limit`)
- [ ] Add input sanitisation to prevent XSS/SQL injection (Drizzle ORM handles SQL injection, but sanitise user-facing outputs)
- [ ] Set up error logging (e.g., Winston, Pino)
- [ ] Configure CORS appropriately for your deployment domain
- [ ] Add health check endpoint for monitoring
- [ ] Set `NODE_ENV=production` in your deployment environment
- [ ] Remove or secure seed data creation (currently runs on every server start)

---

## Questions?

This platform provides a solid foundation for a comprehensive EdTech cybersecurity suite. The demo data and pre-built UI give you a working prototype that demonstrates all core workflows. The items listed above are what you need to implement to move from prototype to production.

Focus on authentication first — it's the foundation everything else depends on. Then connect the threat feeds for real-time value. Everything else can be built incrementally.
