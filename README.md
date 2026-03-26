# HarmonyShield — EdTech Cybersecurity Suite

**NDPR-Compliant Cybersecurity Platform for Nigerian Educational Institutions**

HarmonyShield is a comprehensive cybersecurity management platform purpose-built for Nigerian schools, colleges, and universities. It addresses the unique challenges educational institutions face in protecting student data, maintaining regulatory compliance with Nigeria's Data Protection Regulation (NDPR), and defending against increasingly sophisticated cyber threats — all within a unified, intuitive interface.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Why HarmonyShield?](#why-harmonyshield)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Limitations & Setup Guide](#limitations--setup-guide)
- [Screenshots](#screenshots)
- [License](#license)

---

## Overview

Nigerian educational institutions handle vast amounts of sensitive data — student records, examination results, staff information, financial details, and health records. The Nigeria Data Protection Regulation (NDPR) mandates that organisations processing personal data must implement appropriate technical and organisational measures to protect it. Yet most schools lack the technical resources, expertise, and budget to build a cybersecurity programme from scratch.

HarmonyShield bridges this gap by providing:

- A **compliance management system** that maps directly to NDPR requirements, tracking completion status across all regulatory obligations
- A **real-time threat monitoring dashboard** that aggregates threat intelligence from multiple sources and monitors network activity
- An **incident response workflow** that guides school IT staff through structured response procedures when breaches occur
- A **cybersecurity training platform** with courses, quizzes, and certification tracking tailored to education sector staff
- **Automated reporting** for regulatory submissions, board presentations, and internal audits

---

## Key Features

### 1. Executive Dashboard
A bird's-eye view of your institution's cybersecurity posture. At a glance, see your overall compliance score, active threat count, ongoing incidents, and staff training completion rates. Trend charts show improvement over time, and quick-action cards highlight the most urgent items requiring attention.

### 2. NDPR Compliance Management
Track every compliance requirement with granular detail:
- **Categorised compliance items** — Data Protection, Access Control, Incident Response, Training & Awareness, Technical Security, and more
- **Status tracking** — Mark items as Compliant, Partially Compliant, Non-Compliant, or Not Applicable
- **Priority levels** — Critical, High, Medium, Low to help you focus resources
- **Due date management** — Never miss a regulatory deadline
- **Evidence attachment** — Upload supporting documents for audit readiness
- **Progress metrics** — Real-time compliance percentage across all categories

### 3. Threat Intelligence Monitor
Stay ahead of threats targeting the education sector:
- **Multi-source threat feeds** — Aggregates intelligence from AlienVault OTX, AbuseIPDB, and curated education-sector feeds
- **Severity classification** — Critical, High, Medium, Low with colour-coded visual indicators
- **Threat type categorisation** — Malware, Phishing, DDoS, Ransomware, Data Breach, Insider Threat
- **IP Reputation Checker** — Instantly look up any IP address for known malicious activity
- **Cybersecurity news feed** — Curated articles about threats relevant to Nigerian educational institutions

### 4. Incident Response Centre
When a security incident occurs, HarmonyShield provides a structured response framework:
- **Incident logging** with severity, type, and detailed description
- **Status workflow** — Open → Investigating → Contained → Resolved → Closed
- **Action tracking** — Log every step taken during response, with timestamps and responsible personnel
- **Timeline view** — Complete audit trail of incident handling
- **Post-incident review** — Document lessons learned for continuous improvement

### 5. Training & Awareness Platform
Build a security-aware culture across your institution:
- **Role-based courses** — Tailored content for administrators, teachers, IT staff, and general staff
- **Interactive quizzes** — Test comprehension with multiple-choice assessments
- **Progress tracking** — Monitor individual and institutional training completion
- **Course categories** — NDPR Basics, Phishing Awareness, Password Security, Data Handling, Incident Reporting, and more
- **Completion certificates** — Recognise staff who complete training programmes

### 6. Reports & Analytics
Generate comprehensive reports for stakeholders:
- **Compliance reports** — Detailed NDPR compliance status for regulators
- **Threat analysis** — Trends, patterns, and risk assessments
- **Incident summaries** — Response effectiveness and resolution metrics
- **Training metrics** — Staff participation and knowledge assessment results
- **Executive summaries** — Board-ready overviews of cybersecurity posture
- **Export formats** — PDF, Excel, and PowerPoint (requires backend configuration)

### 7. Platform Settings
Configure HarmonyShield for your institution:
- **School profile management** — Name, address, type, student count
- **Notification preferences** — Email alerts, threat notifications, compliance reminders
- **User management** — Roles and permissions
- **Integration settings** — API keys for threat intelligence feeds
- **Data retention policies** — Configure data lifecycle management

---

## Why HarmonyShield?

### Built for Nigerian Education
Unlike generic cybersecurity tools, HarmonyShield is designed from the ground up for Nigerian schools. The compliance framework maps directly to NDPR requirements. Threat intelligence is filtered for relevance to the education sector. Training content addresses the specific challenges Nigerian institutions face.

### Simplifies Complexity
Cybersecurity is inherently complex, but the people managing it in schools are not always cybersecurity specialists. HarmonyShield translates complex requirements into actionable checklists, clear dashboards, and guided workflows.

### Regulatory Confidence
With the NDPR audit framework built in, schools can demonstrate compliance to regulators with generated reports, evidence trails, and documented procedures — reducing the risk of penalties and reputational damage.

### Cost-Effective
HarmonyShield is a self-hosted open-source solution. Schools maintain full control of their data (a requirement under NDPR) while avoiding expensive SaaS subscriptions.

### Scalable
From a single primary school to a network of universities, HarmonyShield's architecture supports multi-tenant deployment where each institution maintains its own isolated data environment.

---

## Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui components |
| **Routing** | wouter (hash-based) |
| **Data Fetching** | TanStack React Query v5 |
| **Charts** | Recharts |
| **Backend** | Express.js (Node.js) |
| **Database** | SQLite (via better-sqlite3 + Drizzle ORM) |
| **Validation** | Zod + drizzle-zod |
| **Font** | General Sans (Fontshare CDN) |
| **Build Tool** | Vite |

### Database Schema

HarmonyShield uses 10 core tables:

| Table | Purpose |
|---|---|
| `schools` | Institution profiles and metadata |
| `users` | Staff accounts with roles and credentials |
| `complianceItems` | NDPR compliance requirements and status |
| `threats` | Threat intelligence entries |
| `incidents` | Security incident records |
| `incidentActions` | Actions taken during incident response |
| `trainingCourses` | Course content, quizzes, and metadata |
| `trainingProgress` | Individual staff training completion |
| `newsArticles` | Cybersecurity news and advisories |
| `auditLog` | System-wide activity audit trail |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/Chukwuemerie-ezieke/harmonyshield.git
cd harmonyshield

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application starts on `http://localhost:5000` with both the Express backend and Vite frontend running on the same port.

### Production Build

```bash
# Build for production
npm run build

# Start the production server
NODE_ENV=production node dist/index.cjs
```

---

## Project Structure

```
harmonyshield/
├── client/
│   ├── index.html              # Entry point
│   └── src/
│       ├── App.tsx             # Router and layout
│       ├── index.css           # Theme (navy + emerald)
│       ├── main.tsx            # React entry
│       ├── components/
│       │   ├── app-sidebar.tsx # Navigation sidebar
│       │   └── ui/            # shadcn/ui components
│       ├── hooks/              # Custom React hooks
│       ├── lib/                # Utilities and query client
│       └── pages/
│           ├── dashboard.tsx
│           ├── compliance.tsx
│           ├── threat-monitor.tsx
│           ├── training.tsx
│           ├── incident-response.tsx
│           ├── reports.tsx
│           ├── settings.tsx
│           └── not-found.tsx
├── server/
│   ├── index.ts               # Express server entry
│   ├── routes.ts              # API routes + seed data
│   ├── storage.ts             # Database operations (Drizzle)
│   ├── vite.ts                # Vite dev middleware
│   └── static.ts              # Static file serving
├── shared/
│   └── schema.ts              # Database schema (Drizzle + Zod)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── drizzle.config.ts
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

See `.env.example` for all available configuration options. Key variables include:

| Variable | Description | Required |
|---|---|---|
| `ALIENVAULT_OTX_API_KEY` | AlienVault OTX threat feed API key | For live threats |
| `ABUSEIPDB_API_KEY` | AbuseIPDB IP reputation API key | For IP checker |
| `NEWS_API_KEY` | NewsAPI key for cybersecurity news | For live news |
| `SMTP_HOST` | Email server hostname | For notifications |
| `SMTP_PORT` | Email server port | For notifications |
| `SMTP_USER` | Email account username | For notifications |
| `SMTP_PASS` | Email account password | For notifications |
| `JWT_SECRET` | Secret key for JWT token signing | For authentication |
| `SESSION_SECRET` | Secret key for session management | For sessions |
| `DATABASE_URL` | Database connection string | For PostgreSQL |

---

## Limitations & Setup Guide

Please read **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** for a complete, honest list of what is currently implemented as demo/seed data versus production-ready, and step-by-step instructions for what you need to build or configure yourself.

**Key points:**
- Threat feeds, news, and IP checker currently use **seed/demo data** — no live API calls are made
- There is **no authentication system** — you must implement login/registration
- The platform currently runs as **single-school** — multi-tenancy requires additional work
- Passwords in seed data are **plain text** — you must add bcrypt hashing
- Report exports (PDF/Excel/PowerPoint) require **backend implementation**

---

## Screenshots

The platform uses a deep navy (`#1B2A4A`) and emerald green (`#10B981`) colour scheme, designed for professional use in educational environments. The interface features:

- A collapsible sidebar with shield logo and navigation
- Responsive card-based layouts with data visualisation
- Colour-coded severity indicators throughout
- Clean, accessible typography with General Sans

---

## License

This project is provided as-is for educational and institutional use. See the [SETUP_GUIDE.md](./SETUP_GUIDE.md) for production deployment guidance.

---

**Built for Nigerian schools. Built for data protection. Built for peace of mind.**
