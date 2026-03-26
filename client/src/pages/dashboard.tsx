import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  GraduationCap,
  ClipboardCheck,
  Siren,
  BookOpen,
  ExternalLink,
  Newspaper,
  Clock,
} from "lucide-react";
import type { Incident, NewsArticle } from "@shared/schema";

// ──────────── Circular Gauge ────────────
function CircularGauge({
  value,
  size = 120,
  strokeWidth = 10,
  color = "hsl(160, 84%, 39%)",
  trackColor = "hsl(220, 14%, 92%)",
  label,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold leading-none">{value}%</span>
        {label && <span className="text-[10px] text-muted-foreground mt-0.5">{label}</span>}
      </div>
    </div>
  );
}

// ──────────── Severity Badge ────────────
function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { className: string; label: string }> = {
    critical: { className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Critical" },
    high: { className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", label: "High" },
    medium: { className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", label: "Medium" },
    low: { className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Low" },
  };
  const s = map[severity] ?? { className: "bg-muted text-muted-foreground", label: severity };
  return <Badge variant="outline" className={`text-[11px] font-medium border-0 ${s.className}`}>{s.label}</Badge>;
}

// ──────────── Status Badge ────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { className: string; label: string }> = {
    detected: { className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Detected" },
    contained: { className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", label: "Contained" },
    investigating: { className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Investigating" },
    remediating: { className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", label: "Remediating" },
    recovering: { className: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400", label: "Recovering" },
    reported: { className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Reported" },
  };
  const s = map[status] ?? { className: "bg-muted text-muted-foreground", label: status };
  return <Badge variant="outline" className={`text-[11px] font-medium border-0 ${s.className}`}>{s.label}</Badge>;
}

// ──────────── Type Badge ────────────
function TypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    ransomware: "Ransomware",
    phishing: "Phishing",
    data_breach: "Data Breach",
    unauthorized_access: "Unauthorized Access",
    ddos: "DDoS",
    insider_threat: "Insider Threat",
    malware: "Malware",
  };
  return (
    <Badge variant="secondary" className="text-[11px] font-medium">
      {labels[type] ?? type}
    </Badge>
  );
}

// ──────────── Helpers ────────────
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ──────────── Dashboard Types ────────────
interface DashboardStats {
  complianceScore: number;
  totalThreats: number;
  criticalThreats: number;
  activeIncidents: number;
  trainingCompletion: number;
  recentIncidents: Incident[];
}

interface ThreatStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byType: Record<string, number>;
}

// ──────────── Main Component ────────────
export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/1"],
  });

  const { data: threatStats, isLoading: threatsLoading } = useQuery<ThreatStats>({
    queryKey: ["/api/threats/stats"],
  });

  const { data: news, isLoading: newsLoading } = useQuery<NewsArticle[]>({
    queryKey: ["/api/news"],
  });

  const isLoading = statsLoading || threatsLoading;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight" data-testid="text-page-title">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5" data-testid="text-school-name">
          Federal Government College, Enugu
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Score */}
        <Card data-testid="card-compliance-score">
          <CardContent className="pt-5 pb-4 px-5 flex items-center gap-4">
            {isLoading ? (
              <Skeleton className="w-[100px] h-[100px] rounded-full" />
            ) : (
              <CircularGauge
                value={stats?.complianceScore ?? 0}
                size={100}
                strokeWidth={8}
                color="hsl(160, 84%, 39%)"
                trackColor="hsl(160, 84%, 39%, 0.12)"
                label="NDPR"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                NDPR Compliance
              </p>
              <p className="text-lg font-bold mt-1">
                {isLoading ? <Skeleton className="h-5 w-16" /> : `${stats?.complianceScore ?? 0}%`}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Compliant</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Threats */}
        <Card data-testid="card-active-threats" className="border-red-200/50 dark:border-red-900/30">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Active Threats
              </p>
              <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-12 mt-2" />
            ) : (
              <>
                <p className="text-2xl font-bold mt-2">{threatStats?.total ?? 0}</p>
                <div className="flex gap-3 mt-2">
                  <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                    {threatStats?.critical ?? 0} Critical
                  </span>
                  <span className="text-[11px] text-orange-600 dark:text-orange-400 font-medium">
                    {threatStats?.high ?? 0} High
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Incidents */}
        <Card data-testid="card-active-incidents" className="border-amber-200/50 dark:border-amber-900/30">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Active Incidents
              </p>
              <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-12 mt-2" />
            ) : (
              <>
                <p className="text-2xl font-bold mt-2">{stats?.activeIncidents ?? 0}</p>
                <p className="text-[11px] text-muted-foreground mt-2">Require attention</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Training Completion */}
        <Card data-testid="card-training-completion" className="border-blue-200/50 dark:border-blue-900/30">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Training Completion
              </p>
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-12 mt-2" />
            ) : (
              <>
                <p className="text-2xl font-bold mt-2">{stats?.trainingCompletion ?? 0}%</p>
                <div className="mt-2 h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${stats?.trainingCompletion ?? 0}%` }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Actions ── */}
      <div className="flex flex-wrap gap-3">
        <Link href="/compliance">
          <Button variant="outline" size="sm" data-testid="button-run-audit" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Run Compliance Audit
          </Button>
        </Link>
        <Link href="/incidents">
          <Button variant="outline" size="sm" data-testid="button-report-incident" className="gap-2">
            <Siren className="h-4 w-4" />
            Report Incident
          </Button>
        </Link>
        <Link href="/training">
          <Button variant="outline" size="sm" data-testid="button-start-training" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Start Training
          </Button>
        </Link>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Recent Incidents (left 3 cols) ── */}
        <Card className="lg:col-span-3" data-testid="card-recent-incidents">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Recent Incidents
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {statsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats?.recentIncidents && stats.recentIncidents.length > 0 ? (
              <div className="space-y-0">
                {stats.recentIncidents.map((incident, idx) => (
                  <div
                    key={incident.id}
                    className={`flex items-start gap-3 py-3 ${
                      idx < stats.recentIncidents.length - 1 ? "border-b" : ""
                    }`}
                    data-testid={`row-incident-${incident.id}`}
                  >
                    {/* Timeline dot */}
                    <div className="mt-1.5 relative flex flex-col items-center">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          incident.severity === "critical"
                            ? "bg-red-500"
                            : incident.severity === "high"
                            ? "bg-orange-500"
                            : incident.severity === "medium"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                        }`}
                      />
                      {idx < stats.recentIncidents.length - 1 && (
                        <div className="w-px h-full bg-border absolute top-3.5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">
                        {incident.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <TypeBadge type={incident.type} />
                        <SeverityBadge severity={incident.severity} />
                        <StatusBadge status={incident.status} />
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(incident.createdAt)}</span>
                        <span className="mx-1">·</span>
                        <span>Reported by {incident.reportedBy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No incidents recorded
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── News Feed (right 2 cols) ── */}
        <Card className="lg:col-span-2" data-testid="card-news-feed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-blue-500" />
              Cybersecurity News
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {newsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                ))}
              </div>
            ) : news && news.length > 0 ? (
              <div className="space-y-0">
                {news.map((article, idx) => (
                  <div
                    key={article.id}
                    className={`py-3 ${idx < news.length - 1 ? "border-b" : ""}`}
                    data-testid={`card-news-${article.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug">
                          {article.title}
                        </p>
                        {article.summary && (
                          <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2">
                            {article.summary}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {article.source}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {timeAgo(article.publishedAt)}
                          </span>
                        </div>
                      </div>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 mt-0.5"
                        data-testid={`link-news-${article.id}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No news articles available
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
