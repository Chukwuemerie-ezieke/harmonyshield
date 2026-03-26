# HarmonyShield Build Spec

## Project: EdTech Cybersecurity Suite for NDPR Compliance in Nigerian Schools
## By: Harmony Digital Consults Ltd

## Tech Stack
- React 18 + Tailwind CSS + shadcn/ui (fullstack webapp template)
- Express backend + SQLite (better-sqlite3) + Drizzle ORM
- Recharts for data visualization
- wouter with useHashLocation for routing
- lucide-react for icons

## Theme
- Deep navy (#1B2A4A / HSL 222 47% 20%) — primary
- Emerald green (#10B981 / HSL 160 84% 39%) — success/compliance/accent 
- Red (#EF4444 / HSL 0 84% 60%) — critical/destructive
- Amber (#F59E0B / HSL 38 92% 50%) — warnings
- Font: General Sans (loaded via Fontshare CDN)
- Dark sidebar with light main content area (Datadog/Grafana style)
- Dark mode support

## Nigerian Education Context
- Use terms: SS1, JSS3, Term 1/2/3, Principal, Vice Principal Academics
- Currency: ₦ (Nigerian Naira)
- Timezone: WAT (UTC+1)
- Brand: "HarmonyShield by Harmony Digital Consults"
- Footer: "Protecting Nigerian Education, One School at a Time 🛡️"

## Routing (hash-based)
- / → Dashboard
- /compliance → NDPR Compliance Module
- /threats → Threat Monitoring
- /training → Staff Training
- /incidents → Incident Response
- /reports → Reports & Audit
- /settings → Settings

## Import Rules
- Use @/ prefix for client imports (e.g., @/components/ui/card)
- Use @shared/ for shared schema types
- Use apiRequest from @/lib/queryClient for ALL HTTP requests
- Use useHashLocation from wouter/use-hash-location
- Router hook={useHashLocation} wraps Switch
- Do NOT use localStorage/sessionStorage (sandbox blocked)
- Use data-testid on all interactive elements

## Schema (in shared/schema.ts)
All tables defined: schools, users, complianceItems, threats, incidents, incidentActions, trainingCourses, trainingProgress, newsArticles, auditLog

## Sidebar Navigation Items
1. Dashboard (LayoutDashboard icon) - /
2. NDPR Compliance (ClipboardCheck icon) - /compliance
3. Threat Monitor (Shield icon) - /threats
4. Staff Training (GraduationCap icon) - /training
5. Incident Response (AlertTriangle icon) - /incidents
6. Reports & Audit (FileText icon) - /reports
7. Settings (Settings icon) - /settings
