import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  schools, users, complianceItems, threats, incidents, incidentActions,
  trainingCourses, trainingProgress, newsArticles, auditLog,
  type School, type InsertSchool,
  type User, type InsertUser,
  type ComplianceItem, type InsertComplianceItem,
  type Threat, type InsertThreat,
  type Incident, type InsertIncident,
  type IncidentAction, type InsertIncidentAction,
  type TrainingCourse, type InsertTrainingCourse,
  type TrainingProgress, type InsertTrainingProgress,
  type NewsArticle, type InsertNewsArticle,
  type AuditLog, type InsertAuditLog,
} from "@shared/schema";

const sqlite = new Database("harmonyshield.db");
sqlite.pragma("journal_mode = WAL");
export const db = drizzle(sqlite);

export interface IStorage {
  // Schools
  getSchools(): School[];
  getSchool(id: number): School | undefined;
  createSchool(data: InsertSchool): School;

  // Users
  getUsers(schoolId: number): User[];
  getUser(id: number): User | undefined;
  getUserByEmail(email: string): User | undefined;
  createUser(data: InsertUser): User;

  // Compliance
  getComplianceItems(schoolId: number): ComplianceItem[];
  updateComplianceItem(id: number, data: Partial<ComplianceItem>): ComplianceItem | undefined;
  getComplianceScore(schoolId: number): number;

  // Threats
  getThreats(limit?: number): Threat[];
  getThreatStats(): { total: number; critical: number; high: number; medium: number; low: number; byType: Record<string, number> };
  createThreat(data: InsertThreat): Threat;

  // Incidents
  getIncidents(schoolId: number): Incident[];
  getIncident(id: number): Incident | undefined;
  createIncident(data: InsertIncident): Incident;
  updateIncident(id: number, data: Partial<Incident>): Incident | undefined;
  getIncidentActions(incidentId: number): IncidentAction[];
  createIncidentAction(data: InsertIncidentAction): IncidentAction;
  updateIncidentAction(id: number, data: Partial<IncidentAction>): IncidentAction | undefined;

  // Training
  getCourses(): TrainingCourse[];
  getCourse(id: number): TrainingCourse | undefined;
  getTrainingProgress(userId: number): TrainingProgress[];
  upsertTrainingProgress(data: InsertTrainingProgress): TrainingProgress;

  // News
  getNewsArticles(limit?: number): NewsArticle[];
  createNewsArticle(data: InsertNewsArticle): NewsArticle;

  // Audit Log
  getAuditLog(schoolId: number, limit?: number): AuditLog[];
  createAuditEntry(data: InsertAuditLog): AuditLog;

  // Dashboard
  getDashboardStats(schoolId: number): {
    complianceScore: number;
    totalThreats: number;
    criticalThreats: number;
    activeIncidents: number;
    trainingCompletion: number;
    recentIncidents: Incident[];
  };
}

export class DatabaseStorage implements IStorage {
  getSchools(): School[] {
    return db.select().from(schools).all();
  }

  getSchool(id: number): School | undefined {
    return db.select().from(schools).where(eq(schools.id, id)).get();
  }

  createSchool(data: InsertSchool): School {
    return db.insert(schools).values(data).returning().get();
  }

  getUsers(schoolId: number): User[] {
    return db.select().from(users).where(eq(users.schoolId, schoolId)).all();
  }

  getUser(id: number): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  getUserByEmail(email: string): User | undefined {
    return db.select().from(users).where(eq(users.email, email)).get();
  }

  createUser(data: InsertUser): User {
    return db.insert(users).values(data).returning().get();
  }

  getComplianceItems(schoolId: number): ComplianceItem[] {
    return db.select().from(complianceItems).where(eq(complianceItems.schoolId, schoolId)).all();
  }

  updateComplianceItem(id: number, data: Partial<ComplianceItem>): ComplianceItem | undefined {
    const result = db.update(complianceItems).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(complianceItems.id, id)).returning().get();
    return result;
  }

  getComplianceScore(schoolId: number): number {
    const items = this.getComplianceItems(schoolId);
    if (items.length === 0) return 0;
    const completed = items.filter(i => i.status === "completed");
    const totalWeight = items.reduce((sum, i) => sum + (i.weight || 0), 0);
    const completedWeight = completed.reduce((sum, i) => sum + (i.weight || 0), 0);
    return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  }

  getThreats(limit = 50): Threat[] {
    return db.select().from(threats).orderBy(desc(threats.publishedAt)).limit(limit).all();
  }

  getThreatStats() {
    const allThreats = db.select().from(threats).all();
    const byType: Record<string, number> = {};
    let critical = 0, high = 0, medium = 0, low = 0;
    for (const t of allThreats) {
      byType[t.type] = (byType[t.type] || 0) + 1;
      if (t.severity === "critical") critical++;
      else if (t.severity === "high") high++;
      else if (t.severity === "medium") medium++;
      else low++;
    }
    return { total: allThreats.length, critical, high, medium, low, byType };
  }

  createThreat(data: InsertThreat): Threat {
    return db.insert(threats).values(data).returning().get();
  }

  getIncidents(schoolId: number): Incident[] {
    return db.select().from(incidents).where(eq(incidents.schoolId, schoolId)).orderBy(desc(incidents.createdAt)).all();
  }

  getIncident(id: number): Incident | undefined {
    return db.select().from(incidents).where(eq(incidents.id, id)).get();
  }

  createIncident(data: InsertIncident): Incident {
    return db.insert(incidents).values(data).returning().get();
  }

  updateIncident(id: number, data: Partial<Incident>): Incident | undefined {
    return db.update(incidents).set(data).where(eq(incidents.id, id)).returning().get();
  }

  getIncidentActions(incidentId: number): IncidentAction[] {
    return db.select().from(incidentActions).where(eq(incidentActions.incidentId, incidentId)).all();
  }

  createIncidentAction(data: InsertIncidentAction): IncidentAction {
    return db.insert(incidentActions).values(data).returning().get();
  }

  updateIncidentAction(id: number, data: Partial<IncidentAction>): IncidentAction | undefined {
    return db.update(incidentActions).set(data).where(eq(incidentActions.id, id)).returning().get();
  }

  getCourses(): TrainingCourse[] {
    return db.select().from(trainingCourses).all();
  }

  getCourse(id: number): TrainingCourse | undefined {
    return db.select().from(trainingCourses).where(eq(trainingCourses.id, id)).get();
  }

  getTrainingProgress(userId: number): TrainingProgress[] {
    return db.select().from(trainingProgress).where(eq(trainingProgress.userId, userId)).all();
  }

  upsertTrainingProgress(data: InsertTrainingProgress): TrainingProgress {
    const existing = db.select().from(trainingProgress)
      .where(and(eq(trainingProgress.userId, data.userId), eq(trainingProgress.courseId, data.courseId)))
      .get();
    if (existing) {
      return db.update(trainingProgress).set(data).where(eq(trainingProgress.id, existing.id)).returning().get();
    }
    return db.insert(trainingProgress).values(data).returning().get();
  }

  getNewsArticles(limit = 20): NewsArticle[] {
    return db.select().from(newsArticles).orderBy(desc(newsArticles.publishedAt)).limit(limit).all();
  }

  createNewsArticle(data: InsertNewsArticle): NewsArticle {
    return db.insert(newsArticles).values(data).returning().get();
  }

  getAuditLog(schoolId: number, limit = 50): AuditLog[] {
    return db.select().from(auditLog).where(eq(auditLog.schoolId, schoolId)).orderBy(desc(auditLog.timestamp)).limit(limit).all();
  }

  createAuditEntry(data: InsertAuditLog): AuditLog {
    return db.insert(auditLog).values(data).returning().get();
  }

  getDashboardStats(schoolId: number) {
    const complianceScore = this.getComplianceScore(schoolId);
    const threatStats = this.getThreatStats();
    const schoolIncidents = this.getIncidents(schoolId);
    const activeIncidents = schoolIncidents.filter(i => i.status !== "reported" && i.resolvedAt === null).length;
    const recentIncidents = schoolIncidents.slice(0, 5);
    
    // Calculate training completion
    const schoolUsers = this.getUsers(schoolId);
    const allCourses = this.getCourses();
    let totalExpected = schoolUsers.length * allCourses.length;
    let totalCompleted = 0;
    for (const u of schoolUsers) {
      const progress = this.getTrainingProgress(u.id);
      totalCompleted += progress.filter(p => p.status === "completed").length;
    }
    const trainingCompletion = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;

    return {
      complianceScore,
      totalThreats: threatStats.total,
      criticalThreats: threatStats.critical,
      activeIncidents,
      trainingCompletion,
      recentIncidents,
    };
  }
}

export const storage = new DatabaseStorage();
