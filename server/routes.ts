import type { Express } from "express";
import type { Server } from "http";
import { storage, db } from "./storage";
import { 
  schools, users, complianceItems, threats, incidents, incidentActions,
  trainingCourses, trainingProgress, newsArticles, auditLog,
  insertIncidentSchema, insertComplianceItemSchema, insertIncidentActionSchema
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { fetchOTXThreats, fetchLiveNews, checkIPReputation, getFeedStatus } from "./live-feeds";

function seedDatabase() {
  // Check if already seeded
  const existingSchools = storage.getSchools();
  if (existingSchools.length > 0) return;

  // Seed 3 demo schools
  const school1 = storage.createSchool({
    name: "Federal Government College, Enugu",
    address: "Independence Layout, Enugu",
    state: "Enugu",
    lga: "Enugu North",
    type: "secondary",
    studentCount: 1250,
    ndpcRegNumber: "NDPC/2025/EDU/0001",
  });
  const school2 = storage.createSchool({
    name: "Queens College, Lagos",
    address: "Yaba, Lagos",
    state: "Lagos",
    lga: "Yaba",
    type: "secondary",
    studentCount: 2100,
    ndpcRegNumber: "NDPC/2025/EDU/0002",
  });
  const school3 = storage.createSchool({
    name: "Harmony Academy, Anambra",
    address: "Awka, Anambra",
    state: "Anambra",
    lga: "Awka South",
    type: "secondary",
    studentCount: 800,
    ndpcRegNumber: null,
  });

  // Seed demo users
  storage.createUser({ schoolId: school1.id, email: "admin@fgcenugu.edu.ng", name: "Dr. Chukwuma Okafor", password: "demo123", role: "admin", department: "Administration" });
  storage.createUser({ schoolId: school1.id, email: "dpo@fgcenugu.edu.ng", name: "Mrs. Ngozi Eze", password: "demo123", role: "dpo", department: "ICT" });
  storage.createUser({ schoolId: school1.id, email: "teacher@fgcenugu.edu.ng", name: "Mr. Emeka Nwosu", password: "demo123", role: "staff", department: "Science" });
  storage.createUser({ schoolId: school2.id, email: "admin@queenscollege.edu.ng", name: "Mrs. Funmi Adeyemi", password: "demo123", role: "admin", department: "Administration" });
  storage.createUser({ schoolId: school3.id, email: "admin@harmonyacademy.ng", name: "Mr. Ezieke Chukwuemerie", password: "demo123", role: "admin", department: "Administration" });

  // Seed 15 NDPR compliance items for school1
  const complianceData = [
    { key: "dpo_appointed", title: "Data Protection Officer (DPO) Appointed", desc: "Appoint a qualified DPO as required under NDPA 2023 Section 32", weight: 8, status: "completed" },
    { key: "ndpc_registration", title: "NDPC Registration Completed", desc: "Register with the Nigeria Data Protection Commission at ndpc.gov.ng", weight: 8, status: "completed" },
    { key: "dpia_conducted", title: "Data Protection Impact Assessment (DPIA) Conducted", desc: "Conduct DPIA for high-risk processing activities involving student data", weight: 7, status: "in_progress" },
    { key: "privacy_policy", title: "Privacy Policy Published and Accessible", desc: "Publish comprehensive privacy policy on school website/notice boards", weight: 7, status: "completed" },
    { key: "consent_management", title: "Consent Management System Implemented", desc: "Implement mechanisms for obtaining, recording, and managing parental/student consent", weight: 7, status: "in_progress" },
    { key: "data_inventory", title: "Student Data Inventory and Mapping Completed", desc: "Complete inventory of all student personal data collected, stored, and processed", weight: 7, status: "not_started" },
    { key: "breach_notification", title: "Data Breach Notification Procedure Established (72-hour rule)", desc: "Establish procedure to notify NDPC within 72 hours of becoming aware of a data breach", weight: 8, status: "completed" },
    { key: "processor_agreements", title: "Third-party Processor Agreements in Place", desc: "Execute data processing agreements with all third-party vendors (EdTech platforms, cloud providers)", weight: 6, status: "not_started" },
    { key: "staff_training", title: "Staff Data Protection Training Completed", desc: "Ensure all staff handling student data complete NDPR awareness training", weight: 6, status: "in_progress" },
    { key: "retention_policy", title: "Data Retention and Deletion Policy Enforced", desc: "Implement data retention schedule with automated deletion for expired records", weight: 6, status: "not_started" },
    { key: "cross_border", title: "Cross-border Data Transfer Safeguards", desc: "Implement safeguards for any student data transferred outside Nigeria (if applicable)", weight: 5, status: "not_started" },
    { key: "annual_audit", title: "Annual Compliance Audit Conducted", desc: "Conduct comprehensive annual audit of data protection practices", weight: 7, status: "not_started" },
    { key: "processing_records", title: "Records of Processing Activities Maintained", desc: "Maintain up-to-date register of all data processing activities as per NDPA Article 28", weight: 6, status: "in_progress" },
    { key: "data_subject_rights", title: "Rights of Data Subjects Mechanism", desc: "Implement mechanisms for access, rectification, and erasure requests", weight: 6, status: "not_started" },
    { key: "parental_consent", title: "Parental Consent Mechanism for Minors' Data", desc: "Implement verifiable parental consent for processing data of students under 18", weight: 6, status: "not_started" },
  ];

  for (const item of complianceData) {
    db.insert(complianceItems).values({
      schoolId: school1.id,
      itemKey: item.key,
      title: item.title,
      description: item.desc,
      status: item.status,
      weight: item.weight,
      dueDate: "2025-12-31",
      updatedAt: new Date().toISOString(),
    }).run();
  }

  // Also seed for school2 and school3
  for (const sid of [school2.id, school3.id]) {
    for (const item of complianceData) {
      db.insert(complianceItems).values({
        schoolId: sid,
        itemKey: item.key,
        title: item.title,
        description: item.desc,
        status: "not_started",
        weight: item.weight,
        dueDate: "2025-12-31",
        updatedAt: new Date().toISOString(),
      }).run();
    }
  }

  // Seed threat data
  const threatData = [
    { source: "alienvault", title: "Ransomware Campaign Targeting African Educational Institutions", description: "A new ransomware variant 'EduLock' has been observed targeting school management systems across West Africa, exploiting unpatched vulnerabilities in legacy LMS platforms.", severity: "critical", type: "ransomware", publishedAt: "2026-03-25T10:30:00Z", country: "NG" },
    { source: "alienvault", title: "Phishing Kit Mimicking WAEC Results Portal", description: "Threat actors distributing phishing emails claiming to offer early WAEC results access, harvesting student and parent credentials.", severity: "high", type: "phishing", publishedAt: "2026-03-24T14:00:00Z", country: "NG" },
    { source: "abuseipdb", title: "Brute Force Attempts on School Email Servers", description: "Multiple IP addresses from Eastern Europe attempting brute force attacks on Google Workspace accounts used by Nigerian secondary schools.", severity: "high", type: "unauthorized_access", publishedAt: "2026-03-24T08:15:00Z", country: "RU" },
    { source: "news", title: "UK School Hit by Ransomware During GCSE Season", description: "A large academy trust in Manchester reported a ransomware attack affecting 15,000 student records. Attackers demanded £200,000 in cryptocurrency.", severity: "medium", type: "ransomware", publishedAt: "2026-03-23T16:45:00Z", country: "GB" },
    { source: "alienvault", title: "DDoS Attack on Nigerian University Portal", description: "Distributed denial of service attack disrupted online registration portal of a major Nigerian university for 6 hours.", severity: "medium", type: "ddos", publishedAt: "2026-03-22T11:00:00Z", country: "NG" },
    { source: "news", title: "Student Data Breach at US School District Affects 500K Records", description: "Hackers accessed a student information system exposing Social Security numbers, grades, and health records of over 500,000 students in a major US school district.", severity: "critical", type: "data_breach", publishedAt: "2026-03-21T09:30:00Z", country: "US" },
    { source: "abuseipdb", title: "Malware-Infected USB Drives Found in Lagos Schools", description: "Reports of malware-laden USB drives distributed near school gates in Lagos, designed to exfiltrate data from school computers when plugged in.", severity: "high", type: "malware", publishedAt: "2026-03-20T13:20:00Z", country: "NG" },
    { source: "alienvault", title: "Vulnerability in Popular LMS Platform Used by Nigerian Schools", description: "Critical SQL injection vulnerability discovered in a widely-used learning management system, potentially exposing student records.", severity: "critical", type: "data_breach", publishedAt: "2026-03-19T15:00:00Z", country: "US" },
    { source: "news", title: "Australian Schools Hit by Coordinated Cyber Attack", description: "Multiple schools across New South Wales experienced a coordinated phishing campaign that compromised teacher email accounts.", severity: "medium", type: "phishing", publishedAt: "2026-03-18T07:45:00Z", country: "AU" },
    { source: "abuseipdb", title: "Suspicious Port Scanning Targeting Nigerian Education Networks", description: "Increased port scanning activity detected targeting IP ranges associated with Nigerian educational institutions.", severity: "low", type: "unauthorized_access", publishedAt: "2026-03-17T12:10:00Z", country: "CN" },
    { source: "alienvault", title: "Insider Threat: Teacher Sold Student Data on Dark Web", description: "Investigation revealed a staff member at a private school in Abuja was selling student personal information on dark web forums.", severity: "high", type: "data_breach", publishedAt: "2026-03-16T10:00:00Z", country: "NG" },
    { source: "news", title: "NDPC Issues Warning on EdTech App Data Collection", description: "The Nigeria Data Protection Commission issued formal warnings to three EdTech companies for excessive data collection from minor students without proper consent.", severity: "medium", type: "data_breach", publishedAt: "2026-03-15T14:30:00Z", country: "NG" },
  ];

  for (const t of threatData) {
    storage.createThreat({ ...t, isEducationSector: 1, iocData: null });
  }

  // Seed incidents for school1
  const now = new Date().toISOString();
  storage.createIncident({
    schoolId: school1.id, reportedBy: "Mrs. Ngozi Eze", type: "phishing", severity: "high",
    status: "investigating", step: 3, description: "Staff member clicked phishing link disguised as NDPC registration email. Email credentials potentially compromised.",
    affectedSystems: "Google Workspace", affectedCount: 1, createdAt: "2026-03-24T09:00:00Z", resolvedAt: null,
  });
  storage.createIncident({
    schoolId: school1.id, reportedBy: "Mr. Emeka Nwosu", type: "unauthorized_access", severity: "medium",
    status: "contained", step: 2, description: "Unknown login attempt to student information system from foreign IP address. Account locked after 5 failed attempts.",
    affectedSystems: "Student Information System", affectedCount: 0, createdAt: "2026-03-22T14:30:00Z", resolvedAt: null,
  });
  storage.createIncident({
    schoolId: school1.id, reportedBy: "Dr. Chukwuma Okafor", type: "ransomware", severity: "critical",
    status: "reported", step: 6, description: "Ransomware detected on library computer. Isolated immediately. No student data affected. Malware variant identified as LockBit 3.0.",
    affectedSystems: "Library Computer Lab", affectedCount: 0, createdAt: "2026-03-10T08:15:00Z", resolvedAt: "2026-03-12T16:00:00Z",
  });

  // Seed 6 training courses
  const courses = [
    {
      title: "NDPR Fundamentals for Educators",
      description: "Comprehensive introduction to the Nigeria Data Protection Regulation and its implications for school staff.",
      durationMin: 45,
      icon: "shield",
      contentMd: `# NDPR Fundamentals for Educators\n\n## Module 1: What is the NDPA 2023?\nThe Nigeria Data Protection Act 2023 (NDPA) is Nigeria's comprehensive data protection legislation. It establishes the Nigeria Data Protection Commission (NDPC) as the regulatory body.\n\n### Key Principles\n- **Lawfulness, fairness and transparency** - Process data lawfully\n- **Purpose limitation** - Collect data only for specified purposes\n- **Data minimisation** - Only collect what you need\n- **Accuracy** - Keep data accurate and up to date\n- **Storage limitation** - Don't keep data longer than necessary\n- **Integrity and confidentiality** - Protect data against unauthorized processing\n\n## Module 2: Your Role as an Educator\nAs a teacher, you handle sensitive student data daily:\n- Student records (names, ages, addresses)\n- Academic performance data\n- Health records and allergies\n- Parent/guardian contact information\n- Behavioural records\n\n## Module 3: Consent and Student Data\nUnder NDPA 2023, processing student data requires:\n- Verifiable parental consent for students under 18\n- Clear purpose specification\n- Right to withdraw consent\n- Schools must maintain consent records`,
      quizJson: JSON.stringify([
        { q: "What does NDPA stand for?", options: ["Nigeria Data Protection Act", "National Data Privacy Agreement", "Nigeria Digital Protection Authority", "National Data Protection Association"], correct: 0 },
        { q: "Which body enforces data protection in Nigeria?", options: ["NITDA", "NCC", "NDPC", "CBN"], correct: 2 },
        { q: "What is the age threshold for parental consent under NDPA?", options: ["13", "16", "18", "21"], correct: 2 },
        { q: "How long do you have to report a data breach to NDPC?", options: ["24 hours", "48 hours", "72 hours", "1 week"], correct: 2 },
        { q: "Which principle requires collecting only necessary data?", options: ["Data minimisation", "Purpose limitation", "Accuracy", "Transparency"], correct: 0 },
      ]),
      passMark: 70,
    },
    {
      title: "Recognizing Phishing & Social Engineering",
      description: "Learn to identify and avoid phishing attempts and social engineering attacks targeting educational institutions.",
      durationMin: 30,
      icon: "mail-warning",
      contentMd: `# Recognizing Phishing & Social Engineering\n\n## Module 1: What is Phishing?\nPhishing is a type of social engineering attack where attackers disguise themselves as trusted entities to trick you into revealing sensitive information.\n\n### Common Phishing Tactics in Schools\n- Fake WAEC/NECO result notification emails\n- Impersonation of Ministry of Education officials\n- Fake NDPC compliance deadline warnings\n- Bogus parent/guardian messages\n\n## Module 2: Red Flags to Watch For\n1. **Urgency** - "Act immediately or lose access"\n2. **Suspicious sender** - Check the actual email address\n3. **Poor grammar** - Legitimate organizations proofread\n4. **Unexpected attachments** - Don't open files you didn't request\n5. **Mismatched URLs** - Hover before clicking\n\n## Module 3: What to Do\n- **STOP** - Don't click any links\n- **REPORT** - Forward to your school's ICT department\n- **DELETE** - Remove the suspicious message`,
      quizJson: JSON.stringify([
        { q: "What is the most common delivery method for phishing?", options: ["Email", "Text message", "Phone call", "Social media"], correct: 0 },
        { q: "What should you do if you receive a suspicious email?", options: ["Click the link to check", "Reply asking if it's real", "Report it to ICT department", "Forward it to colleagues"], correct: 2 },
        { q: "Which is a red flag for phishing?", options: ["Proper grammar", "Known sender", "Sense of urgency", "Company logo"], correct: 2 },
      ]),
      passMark: 70,
    },
    {
      title: "Password Security & MFA Best Practices",
      description: "Master password hygiene and multi-factor authentication to secure school accounts.",
      durationMin: 20,
      icon: "key-round",
      contentMd: `# Password Security & MFA Best Practices\n\n## Module 1: Password Fundamentals\n### What Makes a Strong Password?\n- Minimum 12 characters\n- Mix of uppercase, lowercase, numbers, symbols\n- No personal information (birthdays, names)\n- Unique for each account\n\n### Password Dos and Don'ts\n✅ Use a passphrase: "MyStudents@FGC2025!"\n❌ Don't use: "password123", "admin", school name\n\n## Module 2: Multi-Factor Authentication (MFA)\nMFA adds a second layer of security beyond your password.\n\n### Types of MFA\n- SMS codes (good)\n- Authenticator apps (better)\n- Security keys (best)\n\n## Module 3: Managing School Accounts\n- Enable MFA on all Google Workspace accounts\n- Never share login credentials\n- Change passwords every 90 days\n- Use the school-approved password manager`,
      quizJson: JSON.stringify([
        { q: "What is the minimum recommended password length?", options: ["6 characters", "8 characters", "12 characters", "20 characters"], correct: 2 },
        { q: "Which MFA method is most secure?", options: ["SMS codes", "Email codes", "Authenticator app", "Security key"], correct: 3 },
      ]),
      passMark: 70,
    },
    {
      title: "Safe Handling of Student Data",
      description: "Best practices for collecting, storing, and sharing student personal information safely.",
      durationMin: 35,
      icon: "database",
      contentMd: `# Safe Handling of Student Data\n\n## Module 1: Types of Student Data\n### Personal Data Categories\n- **Basic identity**: Name, date of birth, gender\n- **Contact**: Address, parent phone numbers, email\n- **Academic**: Grades, exam results, attendance\n- **Health**: Allergies, medical conditions, disabilities\n- **Behavioral**: Disciplinary records, counseling notes\n\n## Module 2: Data Handling Rules\n1. **Collect only what you need** - Don't gather unnecessary information\n2. **Store securely** - Use encrypted systems, not paper files in unlocked cabinets\n3. **Share carefully** - Only with authorized personnel\n4. **Dispose properly** - Shred paper, wipe digital files\n\n## Module 3: Practical Scenarios\n### Scenario 1: Parent Requests\nA parent asks for their child's complete academic record. Under NDPA, they have the right to access this data. Process within 30 days.\n\n### Scenario 2: Another School Requests Data\nA transfer school requests student records. Ensure proper authorization and document the transfer.`,
      quizJson: JSON.stringify([
        { q: "Which of these is considered sensitive student data?", options: ["Name", "Health records", "Class assignment", "School name"], correct: 1 },
        { q: "How should old paper student records be disposed of?", options: ["Throw in bin", "Burn openly", "Shred using approved shredder", "Give to students"], correct: 2 },
        { q: "How long do you have to respond to a data access request?", options: ["7 days", "14 days", "30 days", "90 days"], correct: 2 },
      ]),
      passMark: 70,
    },
    {
      title: "Incident Reporting Procedures",
      description: "Learn the proper steps for reporting cybersecurity incidents at your school.",
      durationMin: 25,
      icon: "siren",
      contentMd: `# Incident Reporting Procedures\n\n## Module 1: What is a Security Incident?\nA security incident is any event that threatens the confidentiality, integrity, or availability of school data or systems.\n\n### Examples\n- Suspicious email opened with attachment\n- Computer acting strangely (possible malware)\n- Student records accessed by unauthorized person\n- Lost or stolen device containing school data\n- Ransomware message appearing on screen\n\n## Module 2: The Reporting Chain\n1. **Immediately**: Stop using the affected system\n2. **Within 15 minutes**: Report to ICT department/DPO\n3. **Within 1 hour**: ICT assesses severity\n4. **Within 24 hours**: Principal notified (if high/critical)\n5. **Within 72 hours**: NDPC notified (if data breach confirmed)\n\n## Module 3: What Information to Provide\n- Date and time of discovery\n- What happened (in plain language)\n- Systems or data affected\n- Actions already taken\n- Your contact information`,
      quizJson: JSON.stringify([
        { q: "Who should you report a security incident to first?", options: ["Principal", "ICT Department/DPO", "NDPC", "Parents"], correct: 1 },
        { q: "Within how many hours must NDPC be notified of a data breach?", options: ["24", "48", "72", "96"], correct: 2 },
        { q: "What should you do first when you discover a potential security incident?", options: ["Try to fix it yourself", "Stop using the affected system", "Tell a colleague", "Wait and see if it gets worse"], correct: 1 },
      ]),
      passMark: 70,
    },
    {
      title: "Ransomware Prevention for Schools",
      description: "Protect your school from ransomware attacks with proven prevention strategies.",
      durationMin: 40,
      icon: "lock",
      contentMd: `# Ransomware Prevention for Schools\n\n## Module 1: Understanding Ransomware\nRansomware encrypts your files and demands payment for their release. Education is the #1 target globally.\n\n### 2025 Education Ransomware Statistics\n- 251 global education ransomware attacks\n- 3.96 million records breached (+27% year over year)\n- Average ransom demand: ₦213 million ($464,000)\n- Average downtime: 21 days\n\n## Module 2: How Ransomware Gets In\n1. **Phishing emails** (65% of cases)\n2. **Unpatched software** (22%)\n3. **Remote Desktop Protocol** (8%)\n4. **USB devices** (5%)\n\n## Module 3: Prevention Strategies\n### For Staff\n- Never open unexpected attachments\n- Report suspicious emails immediately\n- Don't plug in unknown USB devices\n- Keep your software updated\n\n### For ICT Teams\n- Implement 3-2-1 backup strategy\n- Keep all systems patched\n- Segment the network\n- Deploy endpoint detection and response (EDR)\n- Conduct regular penetration testing`,
      quizJson: JSON.stringify([
        { q: "What is the #1 ransomware target sector globally?", options: ["Healthcare", "Finance", "Education", "Government"], correct: 2 },
        { q: "What is the most common way ransomware enters a school?", options: ["USB devices", "Phishing emails", "Social media", "Website downloads"], correct: 1 },
        { q: "What backup strategy is recommended?", options: ["1-1-1", "2-1-1", "3-2-1", "3-3-3"], correct: 2 },
        { q: "What should you do if you see a ransomware message on your screen?", options: ["Pay the ransom", "Turn off the computer and unplug network", "Restart the computer", "Ignore it"], correct: 1 },
      ]),
      passMark: 70,
    },
  ];

  for (const c of courses) {
    db.insert(trainingCourses).values(c).run();
  }

  // Seed training progress for some users
  db.insert(trainingProgress).values({ userId: 1, courseId: 1, status: "completed", score: 85, startedAt: "2026-03-01T09:00:00Z", completedAt: "2026-03-01T10:00:00Z" }).run();
  db.insert(trainingProgress).values({ userId: 1, courseId: 2, status: "completed", score: 90, startedAt: "2026-03-05T09:00:00Z", completedAt: "2026-03-05T09:45:00Z" }).run();
  db.insert(trainingProgress).values({ userId: 1, courseId: 3, status: "in_progress", score: null, startedAt: "2026-03-20T14:00:00Z", completedAt: null }).run();
  db.insert(trainingProgress).values({ userId: 2, courseId: 1, status: "completed", score: 95, startedAt: "2026-02-15T10:00:00Z", completedAt: "2026-02-15T11:00:00Z" }).run();
  db.insert(trainingProgress).values({ userId: 3, courseId: 1, status: "not_started", score: null, startedAt: null, completedAt: null }).run();

  // Seed news articles
  const newsData = [
    { title: "NDPC Fines EdTech Company ₦10M for Unauthorized Student Data Collection", source: "TechCabal", url: "https://techcabal.com", summary: "The Nigeria Data Protection Commission has fined an EdTech startup for collecting biometric data from students without parental consent.", publishedAt: "2026-03-25T08:00:00Z", keywords: "NDPC,fine,EdTech,student data" },
    { title: "Global Education Ransomware Attacks Surge 27% in 2025", source: "BleepingComputer", url: "https://bleepingcomputer.com", summary: "New report shows education sector remains the top target for ransomware with 251 attacks recorded globally in 2025.", publishedAt: "2026-03-23T12:00:00Z", keywords: "ransomware,education,statistics" },
    { title: "Lagos State Mandates Cybersecurity Training for All Public School Staff", source: "Punch Nigeria", url: "https://punchng.com", summary: "Lagos State Ministry of Education announces mandatory cybersecurity awareness training for all public school employees by September 2026.", publishedAt: "2026-03-21T10:30:00Z", keywords: "Lagos,training,cybersecurity,schools" },
    { title: "New WAEC Phishing Scam Targets Parents Ahead of Results Release", source: "The Record", url: "https://therecord.media", summary: "Cybersecurity researchers have identified a sophisticated phishing campaign impersonating WAEC to steal parent financial information.", publishedAt: "2026-03-19T15:00:00Z", keywords: "WAEC,phishing,parents,scam" },
    { title: "FME Partners with NITDA on School Digital Security Framework", source: "Guardian Nigeria", url: "https://guardian.ng", summary: "Federal Ministry of Education and NITDA announce joint initiative to develop comprehensive cybersecurity guidelines for Nigerian schools.", publishedAt: "2026-03-17T09:00:00Z", keywords: "FME,NITDA,cybersecurity,framework" },
  ];

  for (const n of newsData) {
    storage.createNewsArticle(n);
  }

  // Seed audit log
  storage.createAuditEntry({ schoolId: school1.id, userId: 1, action: "login", entityType: "user", entityId: 1, details: "Admin login from 192.168.1.1", timestamp: "2026-03-26T08:00:00Z" });
  storage.createAuditEntry({ schoolId: school1.id, userId: 2, action: "update_compliance", entityType: "compliance", entityId: 1, details: "Updated DPO appointment status to completed", timestamp: "2026-03-25T14:30:00Z" });
  storage.createAuditEntry({ schoolId: school1.id, userId: 1, action: "create_incident", entityType: "incident", entityId: 1, details: "New phishing incident reported", timestamp: "2026-03-24T09:00:00Z" });
}

export function registerRoutes(server: Server, app: Express) {
  // Seed on startup
  seedDatabase();

  // Dashboard stats
  app.get("/api/dashboard/:schoolId", (req, res) => {
    const schoolId = parseInt(req.params.schoolId);
    const stats = storage.getDashboardStats(schoolId);
    res.json(stats);
  });

  // Schools
  app.get("/api/schools", (_req, res) => {
    res.json(storage.getSchools());
  });

  app.get("/api/schools/:id", (req, res) => {
    const school = storage.getSchool(parseInt(req.params.id));
    if (!school) return res.status(404).json({ error: "School not found" });
    res.json(school);
  });

  // Compliance
  app.get("/api/compliance/:schoolId", (req, res) => {
    const items = storage.getComplianceItems(parseInt(req.params.schoolId));
    const score = storage.getComplianceScore(parseInt(req.params.schoolId));
    res.json({ items, score });
  });

  app.put("/api/compliance/:id", (req, res) => {
    const updated = storage.updateComplianceItem(parseInt(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Item not found" });
    res.json(updated);
  });

  // Threats — Live from AlienVault OTX + seed data fallback
  app.get("/api/threats", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    try {
      const otxKey = process.env.ALIENVAULT_OTX_API_KEY;
      const liveThreats = await fetchOTXThreats(otxKey);
      if (liveThreats.length > 0) {
        // Return live threats, supplemented with seed data
        const seedThreats = storage.getThreats(limit).map((t: any) => ({ ...t, isLive: false }));
        const combined = [...liveThreats, ...seedThreats].slice(0, limit);
        res.json(combined);
        return;
      }
    } catch (err) {
      console.error("Live threat fetch failed, falling back to seed data:", err);
    }
    // Fallback to seed data
    res.json(storage.getThreats(limit).map((t: any) => ({ ...t, isLive: false })));
  });

  app.get("/api/threats/stats", (_req, res) => {
    res.json(storage.getThreatStats());
  });

  // IP Reputation Check — Live from AbuseIPDB
  app.get("/api/ip-check/:ip", async (req, res) => {
    const ip = req.params.ip;
    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      res.status(400).json({ error: "Invalid IP address format" });
      return;
    }
    const apiKey = process.env.ABUSEIPDB_API_KEY;
    if (!apiKey) {
      res.json({
        ipAddress: ip,
        abuseConfidenceScore: null,
        countryCode: "N/A",
        isp: "N/A",
        totalReports: 0,
        isLive: false,
        message: "AbuseIPDB API key not configured. Add ABUSEIPDB_API_KEY to your .env file for live IP reputation checks.",
      });
      return;
    }
    try {
      const result = await checkIPReputation(ip, apiKey);
      if (result) {
        res.json(result);
      } else {
        res.status(502).json({ error: "Failed to check IP reputation" });
      }
    } catch (err) {
      res.status(500).json({ error: "IP check failed" });
    }
  });

  // Feed status endpoint
  app.get("/api/feeds/status", (_req, res) => {
    res.json(getFeedStatus());
  });

  // Incidents
  app.get("/api/incidents/:schoolId", (req, res) => {
    res.json(storage.getIncidents(parseInt(req.params.schoolId)));
  });

  app.get("/api/incidents/detail/:id", (req, res) => {
    const incident = storage.getIncident(parseInt(req.params.id));
    if (!incident) return res.status(404).json({ error: "Incident not found" });
    const actions = storage.getIncidentActions(incident.id);
    res.json({ ...incident, actions });
  });

  app.post("/api/incidents", (req, res) => {
    try {
      const incident = storage.createIncident(req.body);
      res.status(201).json(incident);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/incidents/:id", (req, res) => {
    const updated = storage.updateIncident(parseInt(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Incident not found" });
    res.json(updated);
  });

  app.post("/api/incidents/:id/actions", (req, res) => {
    try {
      const action = storage.createIncidentAction({ ...req.body, incidentId: parseInt(req.params.id) });
      res.status(201).json(action);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/incident-actions/:id", (req, res) => {
    const updated = storage.updateIncidentAction(parseInt(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Action not found" });
    res.json(updated);
  });

  // Training
  app.get("/api/training/courses", (_req, res) => {
    res.json(storage.getCourses());
  });

  app.get("/api/training/courses/:id", (req, res) => {
    const course = storage.getCourse(parseInt(req.params.id));
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  });

  app.get("/api/training/progress/:userId", (req, res) => {
    res.json(storage.getTrainingProgress(parseInt(req.params.userId)));
  });

  app.post("/api/training/progress", (req, res) => {
    try {
      const progress = storage.upsertTrainingProgress(req.body);
      res.json(progress);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // News — Live from RSS feeds + seed data fallback
  app.get("/api/news", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    try {
      const liveNews = await fetchLiveNews();
      if (liveNews.length > 0) {
        // Return live news, supplemented with seed data
        const seedNews = storage.getNewsArticles(limit).map((n: any) => ({ ...n, isLive: false }));
        const combined = [...liveNews, ...seedNews].slice(0, limit);
        res.json(combined);
        return;
      }
    } catch (err) {
      console.error("Live news fetch failed, falling back to seed data:", err);
    }
    // Fallback to seed data
    res.json(storage.getNewsArticles(limit).map((n: any) => ({ ...n, isLive: false })));
  });

  // Users
  app.get("/api/users/:schoolId", (req, res) => {
    res.json(storage.getUsers(parseInt(req.params.schoolId)));
  });

  // Audit Log
  app.get("/api/audit/:schoolId", (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    res.json(storage.getAuditLog(parseInt(req.params.schoolId), limit));
  });
}
