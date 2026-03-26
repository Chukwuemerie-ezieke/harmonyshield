import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Schools
export const schools = sqliteTable("schools", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  state: text("state").notNull(),
  lga: text("lga").notNull(),
  type: text("type").notNull(), // primary, secondary, tertiary
  studentCount: integer("student_count").notNull().default(0),
  ndpcRegNumber: text("ndpc_reg_number"),
});

export const insertSchoolSchema = createInsertSchema(schools).omit({ id: true });
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type School = typeof schools.$inferSelect;

// Users
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schoolId: integer("school_id").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("staff"), // admin, staff, dpo
  department: text("department"),
  avatarUrl: text("avatar_url"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Compliance Items
export const complianceItems = sqliteTable("compliance_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schoolId: integer("school_id").notNull(),
  itemKey: text("item_key").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("not_started"), // not_started, in_progress, completed, overdue
  dueDate: text("due_date"),
  assignedTo: text("assigned_to"),
  evidenceUrl: text("evidence_url"),
  notes: text("notes"),
  weight: real("weight").notNull().default(6.67),
  updatedAt: text("updated_at"),
});

export const insertComplianceItemSchema = createInsertSchema(complianceItems).omit({ id: true });
export type InsertComplianceItem = z.infer<typeof insertComplianceItemSchema>;
export type ComplianceItem = typeof complianceItems.$inferSelect;

// Threats
export const threats = sqliteTable("threats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull(), // alienvault, abuseipdb, news
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity").notNull(), // critical, high, medium, low
  type: text("type").notNull(), // ransomware, phishing, ddos, unauthorized_access, data_breach, malware
  iocData: text("ioc_data"), // JSON string
  publishedAt: text("published_at").notNull(),
  isEducationSector: integer("is_education_sector").notNull().default(1),
  country: text("country"),
});

export const insertThreatSchema = createInsertSchema(threats).omit({ id: true });
export type InsertThreat = z.infer<typeof insertThreatSchema>;
export type Threat = typeof threats.$inferSelect;

// Incidents
export const incidents = sqliteTable("incidents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schoolId: integer("school_id").notNull(),
  reportedBy: text("reported_by").notNull(),
  type: text("type").notNull(), // ransomware, phishing, data_breach, unauthorized_access, ddos, insider_threat
  severity: text("severity").notNull(), // critical, high, medium, low
  status: text("status").notNull().default("detected"), // detected, contained, investigating, remediating, recovering, reported
  step: integer("step").notNull().default(1), // 1-6
  description: text("description").notNull(),
  affectedSystems: text("affected_systems"),
  affectedCount: integer("affected_count").default(0),
  createdAt: text("created_at").notNull(),
  resolvedAt: text("resolved_at"),
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({ id: true });
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidents.$inferSelect;

// Incident Actions
export const incidentActions = sqliteTable("incident_actions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  incidentId: integer("incident_id").notNull(),
  step: integer("step").notNull(),
  action: text("action").notNull(),
  assignedTo: text("assigned_to"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  dueDate: text("due_date"),
});

export const insertIncidentActionSchema = createInsertSchema(incidentActions).omit({ id: true });
export type InsertIncidentAction = z.infer<typeof insertIncidentActionSchema>;
export type IncidentAction = typeof incidentActions.$inferSelect;

// Training Courses
export const trainingCourses = sqliteTable("training_courses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  contentMd: text("content_md").notNull(),
  durationMin: integer("duration_min").notNull(),
  quizJson: text("quiz_json").notNull(), // JSON array of quiz questions
  passMark: integer("pass_mark").notNull().default(70),
  icon: text("icon"),
});

export const insertTrainingCourseSchema = createInsertSchema(trainingCourses).omit({ id: true });
export type InsertTrainingCourse = z.infer<typeof insertTrainingCourseSchema>;
export type TrainingCourse = typeof trainingCourses.$inferSelect;

// Training Progress
export const trainingProgress = sqliteTable("training_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  status: text("status").notNull().default("not_started"), // not_started, in_progress, completed, failed
  score: integer("score"),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
});

export const insertTrainingProgressSchema = createInsertSchema(trainingProgress).omit({ id: true });
export type InsertTrainingProgress = z.infer<typeof insertTrainingProgressSchema>;
export type TrainingProgress = typeof trainingProgress.$inferSelect;

// News Articles
export const newsArticles = sqliteTable("news_articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  source: text("source").notNull(),
  url: text("url").notNull(),
  summary: text("summary"),
  publishedAt: text("published_at").notNull(),
  keywords: text("keywords"),
});

export const insertNewsArticleSchema = createInsertSchema(newsArticles).omit({ id: true });
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type NewsArticle = typeof newsArticles.$inferSelect;

// Audit Log
export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schoolId: integer("school_id").notNull(),
  userId: integer("user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  details: text("details"),
  timestamp: text("timestamp").notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({ id: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLog.$inferSelect;
